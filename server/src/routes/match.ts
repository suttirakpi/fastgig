import { Router } from "express";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { requireAuth, type AuthRequest } from "../middleware/auth";
import { cosine, embed, modelStatus } from "../ai/embeddings";
import { detectCategories } from "../ai/dictionary";
import { haversineKm } from "../ai/geo";
import { getJobVector, jobText } from "../ai/jobVectors";
import { lexicalSimilarity } from "../ai/lexical";
import { WEIGHTS, clamp01, totalScore } from "../ai/scoring";

const router = Router();
router.use(requireAuth);

const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().min(1).max(200).default(10),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const candidateSelect = {
  id: true,
  employerId: true,
  title: true,
  description: true,
  category: true,
  payMin: true,
  payMax: true,
  locationText: true,
  latitude: true,
  longitude: true,
  ageMin: true,
  ageMax: true,
  status: true,
  createdAt: true,
  embedding: true,
  employer: {
    select: { id: true, username: true, profileImage: true, trustPoints: true },
  },
} as const;

const pct = (n: number) => Math.round(n * 100);

// GET /api/match  -> งานที่เหมาะกับฉัน เรียงตามคะแนน
router.get("/", async (req: AuthRequest, res) => {
  const me = req.userId as number;
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success)
    return res.status(400).json({ message: "พารามิเตอร์ไม่ถูกต้อง" });

  const { lat, lng, radius, limit } = parsed.data;
  const origin = lat !== undefined && lng !== undefined ? { lat, lng } : null;

  try {
    const [user, history] = await Promise.all([
      prisma.user.findUnique({
        where: { id: me },
        select: { skills: true, age: true },
      }),
      prisma.application.findMany({
        where: { userId: me },
        orderBy: { appliedAt: "desc" },
        take: 20,
        select: { job: { select: { title: true, category: true } } },
      }),
    ]);

    const age: number | null = user?.age ?? null;
    const ageFilter: Prisma.JobWhereInput[] =
      age === null
        ? []
        : [
            { OR: [{ ageMin: null }, { ageMin: { lte: age } }] },
            { OR: [{ ageMax: null }, { ageMax: { gte: age } }] },
          ];

    const candidates = await prisma.job.findMany({
      where: {
        status: "OPEN",
        employerId: { not: me },
        applications: { none: { userId: me } },
        AND: ageFilter,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: candidateSelect,
    });

    // โปรไฟล์ของผู้ใช้ = ทักษะ + ชื่องานที่เคยสมัครล่าสุด (Content-Based + พฤติกรรม)
    const recentTitles: string[] = history
      .slice(0, 5)
      .map((h: { job: { title: string } }) => h.job.title);
    const profileText = [user?.skills ?? "", ...recentTitles]
      .map((s) => s.trim())
      .filter(Boolean)
      .join(". ");
    const hasProfile = profileText.length > 0;
    const profileVec = hasProfile ? await embed(profileText) : null;

    // หมวดที่ผู้ใช้สนใจ: จากทักษะ (พจนานุกรมคำ) และจากสัดส่วนงานที่เคยสมัคร
    const skillCats = new Set(detectCategories(user?.skills ?? ""));
    const behavior = new Map<string, number>();
    for (const h of history as { job: { category: string | null } }[]) {
      if (h.job.category)
        behavior.set(h.job.category, (behavior.get(h.job.category) ?? 0) + 1);
    }
    const totalApps = Math.max(history.length, 1);

    const scored = [];
    for (const job of candidates) {
      // 1) Semantic: cosine similarity ของเวกเตอร์ (ถ้าโมเดลไม่พร้อมใช้ตัวสำรองแบบคำสำคัญ)
      let semantic = 0.5;
      if (hasProfile) {
        const vec = profileVec ? await getJobVector(job) : null;
        semantic =
          profileVec && vec
            ? clamp01(cosine(profileVec, vec))
            : lexicalSimilarity(profileText, jobText(job));
      }

      // 2) Category: ตรงกับทักษะ = 1, ไม่งั้นใช้สัดส่วนงานหมวดนี้ที่เคยสมัคร
      const jobCats = new Set<string>([
        ...(job.category ? [job.category] : []),
        ...detectCategories(`${job.title} ${job.description}`),
      ]);
      let category = 0;
      for (const c of jobCats) {
        const skillMatch = skillCats.has(c) ? 1 : 0;
        const behaviorShare = (behavior.get(c) ?? 0) / totalApps;
        category = Math.max(category, skillMatch, behaviorShare);
      }

      // 3) Distance: ใกล้ = คะแนนสูง (ถ้าไม่ทราบตำแหน่งให้เป็นกลาง 0.5)
      let distance = 0.5;
      let distanceKm: number | null = null;
      if (origin && job.latitude !== null && job.longitude !== null) {
        distanceKm = haversineKm(origin, {
          lat: job.latitude,
          lng: job.longitude,
        });
        distance = clamp01(1 - distanceKm / radius);
      }

      const total = totalScore({ semantic, category, distance });
      const { embedding, ...publicJob } = job;
      void embedding;
      scored.push({
        total,
        job: {
          ...publicJob,
          match: {
            score: pct(total),
            semantic: pct(semantic),
            category: pct(category),
            distance: pct(distance),
            distanceKm:
              distanceKm === null ? null : Math.round(distanceKm * 10) / 10,
          },
        },
      });
    }

    scored.sort((a, b) => b.total - a.total);

    return res.json({
      jobs: scored.slice(0, limit).map((s) => s.job),
      engine: !hasProfile ? "no-profile" : profileVec ? "embedding" : "keyword",
      modelStatus: modelStatus(),
      hasProfile,
      usedLocation: origin !== null,
      weights: WEIGHTS,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "เกิดข้อผิดพลาดของเซิร์ฟเวอร์" });
  }
});

export default router;
