import { Router } from "express";
import type { Response } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { requireAuth, type AuthRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

const jobSelect = {
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
} as const;

const employerSelect = {
  id: true,
  username: true,
  profileImage: true,
  trustPoints: true,
} as const;

const jobSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "หัวข้องานต้องมีอย่างน้อย 3 ตัวอักษร")
      .max(150),
    description: z.string().trim().min(5, "กรุณาใส่รายละเอียดงาน").max(2000),
    category: z.string().trim().max(50).optional(),
    payMin: z.coerce.number().int().min(0),
    payMax: z.coerce.number().int().min(0),
    locationText: z.string().trim().max(255).optional(),
    latitude: z.coerce.number().min(-90).max(90).optional(),
    longitude: z.coerce.number().min(-180).max(180).optional(),
    ageMin: z.coerce.number().int().min(15).max(100).optional(),
    ageMax: z.coerce.number().int().min(15).max(100).optional(),
  })
  .refine((d) => d.payMax >= d.payMin, {
    message: "ค่าจ้างสูงสุดต้องไม่ต่ำกว่าค่าจ้างต่ำสุด",
    path: ["payMax"],
  })
  .refine(
    (d) =>
      d.ageMin === undefined || d.ageMax === undefined || d.ageMax >= d.ageMin,
    {
      message: "อายุสูงสุดต้องไม่ต่ำกว่าอายุต่ำสุด",
      path: ["ageMax"],
    },
  );

const listQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.string().trim().max(50).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const decisionSchema = z.object({
  status: z.enum(["ACCEPTED", "REJECTED"]),
});

function parseId(value: string | undefined) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function badRequest(res: Response, issues: z.ZodIssue[]) {
  return res.status(400).json({
    message: "ข้อมูลไม่ถูกต้อง",
    errors: issues.map((i) => ({
      field: i.path.join("."),
      message: i.message,
    })),
  });
}

function serverError(res: Response, err: unknown) {
  console.error(err);
  return res.status(500).json({ message: "เกิดข้อผิดพลาดของเซิร์ฟเวอร์" });
}

// ---------- สร้างงาน ----------
router.post("/", async (req: AuthRequest, res) => {
  const parsed = jobSchema.safeParse(req.body);
  if (!parsed.success) return badRequest(res, parsed.error.issues);

  try {
    const job = await prisma.job.create({
      data: { ...parsed.data, employerId: req.userId as number },
      select: jobSelect,
    });
    return res.status(201).json({ job });
  } catch (err) {
    return serverError(res, err);
  }
});

// ---------- รายการงาน (หน้า Homepage > All Jobs) ----------
router.get("/", async (req: AuthRequest, res) => {
  const me = req.userId as number;
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) return badRequest(res, parsed.error.issues);

  const { q, category, page, limit } = parsed.data;
  const where: Prisma.JobWhereInput = {
    status: "OPEN",
    employerId: { not: me },
    ...(category ? { category } : {}),
    ...(q
      ? { OR: [{ title: { contains: q } }, { description: { contains: q } }] }
      : {}),
  };

  try {
    const [total, rows] = await prisma.$transaction([
      prisma.job.count({ where }),
      prisma.job.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          ...jobSelect,
          employer: { select: employerSelect },
          applications: {
            where: { userId: me },
            select: { id: true, status: true },
          },
        },
      }),
    ]);

    const jobs = rows.map(({ applications, ...job }) => ({
      ...job,
      myApplication: applications[0] ?? null,
    }));
    return res.json({ jobs, page, limit, total });
  } catch (err) {
    return serverError(res, err);
  }
});

// ---------- งานที่ฉันลง (My Jobs) ----------
router.get("/mine", async (req: AuthRequest, res) => {
  try {
    const rows = await prisma.job.findMany({
      where: { employerId: req.userId as number },
      orderBy: { createdAt: "desc" },
      select: {
        ...jobSelect,
        _count: { select: { applications: { where: { status: "PENDING" } } } },
      },
    });
    const jobs = rows.map(({ _count, ...job }) => ({
      ...job,
      pendingApplicants: _count.applications,
    }));
    return res.json({ jobs });
  } catch (err) {
    return serverError(res, err);
  }
});

// ---------- งานที่ฉันสมัคร (History > Find Jobs) ----------
router.get("/applied", async (req: AuthRequest, res) => {
  try {
    const applications = await prisma.application.findMany({
      where: { userId: req.userId as number },
      orderBy: { appliedAt: "desc" },
      select: {
        id: true,
        status: true,
        result: true,
        appliedAt: true,
        job: { select: { ...jobSelect, employer: { select: employerSelect } } },
      },
    });
    return res.json({ applications });
  } catch (err) {
    return serverError(res, err);
  }
});

// ---------- รายละเอียดงาน (Details) ----------
router.get("/:id", async (req: AuthRequest, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: "รหัสงานไม่ถูกต้อง" });

  try {
    const row = await prisma.job.findUnique({
      where: { id },
      select: {
        ...jobSelect,
        employer: { select: employerSelect },
        applications: {
          where: { userId: req.userId as number },
          select: { id: true, status: true },
        },
      },
    });
    if (!row) return res.status(404).json({ message: "ไม่พบงานนี้" });

    const { applications, ...job } = row;
    return res.json({
      job: { ...job, myApplication: applications[0] ?? null },
    });
  } catch (err) {
    return serverError(res, err);
  }
});

// ---------- สมัครงาน ----------
router.post("/:id/apply", async (req: AuthRequest, res) => {
  const me = req.userId as number;
  const jobId = parseId(req.params.id);
  if (!jobId) return res.status(400).json({ message: "รหัสงานไม่ถูกต้อง" });

  try {
    const [job, user] = await Promise.all([
      prisma.job.findUnique({ where: { id: jobId } }),
      prisma.user.findUnique({
        where: { id: me },
        select: { username: true, age: true },
      }),
    ]);

    if (!job) return res.status(404).json({ message: "ไม่พบงานนี้" });
    if (job.employerId === me)
      return res.status(400).json({ message: "สมัครงานของตัวเองไม่ได้" });
    if (job.status !== "OPEN")
      return res.status(409).json({ message: "งานนี้ปิดรับสมัครแล้ว" });

    if (
      user?.age != null &&
      ((job.ageMin != null && user.age < job.ageMin) ||
        (job.ageMax != null && user.age > job.ageMax))
    ) {
      return res
        .status(403)
        .json({ message: "อายุของคุณไม่อยู่ในเกณฑ์ของงานนี้" });
    }

    const application = await prisma.$transaction(async (tx) => {
      const created = await tx.application.create({
        data: { jobId, userId: me },
      });
      await tx.notification.create({
        data: {
          userId: job.employerId,
          type: "APPLICATION_RECEIVED",
          content: `${user?.username ?? "มีผู้ใช้"} สมัครงาน "${job.title}" ของคุณ`,
        },
      });
      return created;
    });

    return res.status(201).json({ application });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return res.status(409).json({ message: "คุณสมัครงานนี้ไปแล้ว" });
    }
    return serverError(res, err);
  }
});

// ---------- รายชื่อผู้สมัคร (Applicants list) เฉพาะเจ้าของงาน ----------
router.get("/:id/applicants", async (req: AuthRequest, res) => {
  const jobId = parseId(req.params.id);
  if (!jobId) return res.status(400).json({ message: "รหัสงานไม่ถูกต้อง" });

  try {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { employerId: true },
    });
    if (!job) return res.status(404).json({ message: "ไม่พบงานนี้" });
    if (job.employerId !== req.userId)
      return res.status(403).json({ message: "ไม่มีสิทธิ์ดูรายชื่อผู้สมัคร" });

    const applicants = await prisma.application.findMany({
      where: { jobId },
      orderBy: { appliedAt: "asc" },
      select: {
        id: true,
        status: true,
        result: true,
        appliedAt: true,
        user: {
          select: {
            id: true,
            username: true,
            age: true,
            skills: true,
            profileImage: true,
            trustPoints: true,
            completedJobs: true,
          },
        },
      },
    });
    return res.json({ applicants });
  } catch (err) {
    return serverError(res, err);
  }
});

// ---------- ยอมรับ / ปฏิเสธผู้สมัคร ----------
router.patch(
  "/:jobId/applicants/:applicationId",
  async (req: AuthRequest, res) => {
    const me = req.userId as number;
    const jobId = parseId(req.params.jobId);
    const applicationId = parseId(req.params.applicationId);
    if (!jobId || !applicationId)
      return res.status(400).json({ message: "รหัสไม่ถูกต้อง" });

    const parsed = decisionSchema.safeParse(req.body);
    if (!parsed.success) return badRequest(res, parsed.error.issues);
    const { status } = parsed.data;

    try {
      const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: { job: true },
      });
      if (!application || application.jobId !== jobId) {
        return res.status(404).json({ message: "ไม่พบใบสมัครนี้" });
      }
      if (application.job.employerId !== me) {
        return res.status(403).json({ message: "ไม่มีสิทธิ์จัดการใบสมัครนี้" });
      }
      if (application.status !== "PENDING") {
        return res
          .status(409)
          .json({ message: "ใบสมัครนี้ถูกดำเนินการไปแล้ว" });
      }

      const title = application.job.title;

      const updated = await prisma.$transaction(async (tx) => {
        const result = await tx.application.update({
          where: { id: applicationId },
          data: { status },
        });

        if (status === "REJECTED") {
          await tx.notification.create({
            data: {
              userId: application.userId,
              type: "APPLICATION_REJECTED",
              content: `ใบสมัครงาน "${title}" ของคุณไม่ได้รับการคัดเลือก`,
            },
          });
          return result;
        }

        // ยอมรับ: ปิดงาน (กันกดซ้อนด้วยเงื่อนไข status = OPEN)
        const closed = await tx.job.updateMany({
          where: { id: jobId, status: "OPEN" },
          data: { status: "IN_PROGRESS" },
        });
        if (closed.count === 0) throw new Error("JOB_NOT_OPEN");

        const others = await tx.application.findMany({
          where: { jobId, id: { not: applicationId }, status: "PENDING" },
          select: { id: true, userId: true },
        });
        if (others.length > 0) {
          await tx.application.updateMany({
            where: { id: { in: others.map((o) => o.id) } },
            data: { status: "REJECTED" },
          });
          await tx.notification.createMany({
            data: others.map((o) => ({
              userId: o.userId,
              type: "APPLICATION_REJECTED",
              content: `งาน "${title}" ได้ผู้ทำแล้ว`,
            })),
          });
        }
        await tx.notification.create({
          data: {
            userId: application.userId,
            type: "APPLICATION_ACCEPTED",
            content: `คุณได้รับเลือกให้ทำงาน "${title}"`,
          },
        });
        return result;
      });

      return res.json({ application: updated });
    } catch (err) {
      if (err instanceof Error && err.message === "JOB_NOT_OPEN") {
        return res.status(409).json({ message: "งานนี้ไม่ได้เปิดรับอยู่แล้ว" });
      }
      return serverError(res, err);
    }
  },
);

export default router;
