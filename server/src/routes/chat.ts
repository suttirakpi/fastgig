import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, type AuthRequest } from "../middleware/auth";
import { detectCategories } from "../ai/dictionary";
import { cosine, embed } from "../ai/embeddings";
import { getJobVector, jobText } from "../ai/jobVectors";
import { lexicalSimilarity } from "../ai/lexical";
import { analyze, normalizePlace } from "../ai/nlu";
import { clamp01 } from "../ai/scoring";

const router = Router();
router.use(requireAuth);
router.use(
  rateLimit({
    windowMs: 60_000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "ส่งข้อความถี่เกินไป รอสักครู่แล้วลองใหม่" },
  }),
);

// คะแนนต่ำสุดที่ถือว่า "พอใกล้เคียง" (ปรับได้หลังลองกับข้อมูลจริง)
const MIN_SCORE = 0.3;
const MAX_RESULTS = 5;

const EXAMPLES =
  'ลองพิมพ์ เช่น "หางานทำอาหาร", "อยากขนของใกล้ ม.เกษตร" หรือ "ลงงานทาสีบ้าน"';

const bodySchema = z.object({ message: z.string().trim().min(1).max(300) });

const jobSelect = {
  id: true,
  title: true,
  description: true,
  category: true,
  payMin: true,
  payMax: true,
  locationText: true,
  createdAt: true,
  embedding: true,
  employer: { select: { username: true } },
} as const;

router.post("/", async (req: AuthRequest, res) => {
  const me = req.userId as number;
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success)
    return res
      .status(400)
      .json({ message: "กรุณาพิมพ์ข้อความ (ไม่เกิน 300 ตัวอักษร)" });

  const { message } = parsed.data;
  const a = analyze(message);
  const base = {
    intent: a.intent,
    entities: { categories: a.categories, location: a.location },
  };

  if (a.intent === "GREETING") {
    return res.json({
      ...base,
      reply: `สวัสดีครับ! บอกได้เลยว่าสนใจงานแบบไหน ${EXAMPLES}`,
      jobs: [],
      action: null,
    });
  }
  if (a.intent === "HELP") {
    return res.json({
      ...base,
      reply: `ผมช่วยค้นหางานจากข้อความของคุณได้ และช่วยพาไปลงงานได้ด้วย ${EXAMPLES}`,
      jobs: [],
      action: null,
    });
  }
  if (a.intent === "POST_JOB") {
    return res.json({
      ...base,
      reply: a.categories[0]
        ? `ต้องการลงงานประเภท "${a.categories[0]}" ใช่ไหมครับ กดปุ่มด้านล่างเพื่อไปหน้าสร้างงานได้เลย`
        : "ต้องการลงงานใช่ไหมครับ กดปุ่มด้านล่างเพื่อไปหน้าสร้างงานได้เลย",
      jobs: [],
      action: { type: "create_job", category: a.categories[0] ?? null },
    });
  }

  try {
    const candidates = await prisma.job.findMany({
      where: { status: "OPEN", employerId: { not: me } },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: jobSelect,
    });

    const queryVec = await embed(message);
    const wantedPlace = a.location ? normalizePlace(a.location) : null;

    const scored = [];
    for (const job of candidates) {
      const text = jobText(job);
      const vec = queryVec ? await getJobVector(job) : null;
      const semantic =
        queryVec && vec
          ? clamp01(cosine(queryVec, vec))
          : lexicalSimilarity(message, text);

      const jobCats = new Set<string>([
        ...(job.category ? [job.category] : []),
        ...detectCategories(`${job.title} ${job.description}`),
      ]);
      const category =
        a.categories.length === 0
          ? 0
          : job.category && a.categories.includes(job.category)
            ? 1
            : a.categories.some((c) => jobCats.has(c))
              ? 0.8
              : 0;

      const place =
        wantedPlace &&
        normalizePlace(`${job.locationText ?? ""}${job.description}`).includes(
          wantedPlace,
        )
          ? 1
          : 0;

      // มีหมวดจากพจนานุกรม -> ให้น้ำหนักหมวดมากขึ้น; ไม่มี -> พึ่งความหมายเป็นหลัก
      const score =
        a.categories.length > 0
          ? 0.5 * category + 0.35 * semantic + 0.15 * place
          : 0.85 * semantic + 0.15 * place;

      scored.push({ job, score, category, place });
    }

    scored.sort((x, y) => y.score - x.score);

    const exact =
      a.categories.length > 0 ? scored.filter((s) => s.category > 0) : [];
    const near = scored.filter((s) => s.score >= MIN_SCORE);

    let picked = a.categories.length > 0 ? exact : near;
    let reply: string;

    if (picked.length > 0) {
      picked = picked.slice(0, MAX_RESULTS);
      const placeNote = a.location
        ? picked.some((s) => s.place === 1)
          ? ` แถว "${a.location}"`
          : ` (ยังไม่พบงานที่ระบุสถานที่ "${a.location}" ตรงกัน)`
        : "";
      reply =
        a.categories.length > 0
          ? `นี่คืองานที่เกี่ยวกับ "${a.categories[0]}"${placeNote} จำนวน ${picked.length} งาน`
          : a.intent === "UNKNOWN"
            ? "ไม่แน่ใจว่าหมายถึงอะไร แต่นี่คืองานที่ใกล้เคียงกับข้อความของคุณ"
            : "นี่คืองานที่น่าจะตรงกับที่คุณหา";
    } else if (a.categories.length > 0 && near.length > 0) {
      picked = near.slice(0, 3);
      reply = `ตอนนี้ยังไม่มีงานประเภท "${a.categories[0]}" เปิดรับ ลองดูงานใกล้เคียงเหล่านี้แทนได้ครับ`;
    } else {
      reply = `ยังไม่พบงานที่ตรงกับที่ต้องการ ${EXAMPLES}`;
    }

    return res.json({
      ...base,
      reply,
      action: null,
      jobs: picked.map(({ job }) => ({
        id: job.id,
        title: job.title,
        description: job.description.slice(0, 120),
        category: job.category,
        payMin: job.payMin,
        payMax: job.payMax,
        locationText: job.locationText,
        employer: job.employer.username,
      })),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "เกิดข้อผิดพลาดของเซิร์ฟเวอร์" });
  }
});

export default router;
