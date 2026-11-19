import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, type AuthRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

const JOB_STATUSES = ["OPEN", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;
const APP_STATUSES = ["PENDING", "ACCEPTED", "REJECTED", "COMPLETED"] as const;

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

function toRecord<K extends string>(keys: readonly K[], values: number[]) {
  return Object.fromEntries(keys.map((k, i) => [k, values[i]])) as Record<
    K,
    number
  >;
}

router.get("/", async (req: AuthRequest, res) => {
  const me = req.userId as number;
  try {
    const [platform, posted, applied, users, user] = await Promise.all([
      Promise.all(
        JOB_STATUSES.map((status) => prisma.job.count({ where: { status } })),
      ),
      Promise.all(
        JOB_STATUSES.map((status) =>
          prisma.job.count({ where: { employerId: me, status } }),
        ),
      ),
      Promise.all(
        APP_STATUSES.map((status) =>
          prisma.application.count({ where: { userId: me, status } }),
        ),
      ),
      prisma.user.count(),
      prisma.user.findUnique({
        where: { id: me },
        select: { trustPoints: true, completedJobs: true },
      }),
    ]);

    res.json({
      platform: {
        total: sum(platform),
        users,
        ...toRecord(JOB_STATUSES, platform),
      },
      mine: {
        posted: { total: sum(posted), ...toRecord(JOB_STATUSES, posted) },
        applications: {
          total: sum(applied),
          ...toRecord(APP_STATUSES, applied),
        },
        trustPoints: user?.trustPoints ?? 0,
        completedJobs: user?.completedJobs ?? 0,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "เกิดข้อผิดพลาดของเซิร์ฟเวอร์" });
  }
});

export default router;
