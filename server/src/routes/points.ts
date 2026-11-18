import { Router } from "express";
import { prisma } from "../lib/prisma";
import { trustLevel } from "../lib/trust";
import { requireAuth, type AuthRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

// คะแนนของฉัน + ประวัติการได้/เสียคะแนน (หน้า Profile)
router.get("/", async (req: AuthRequest, res) => {
  const me = req.userId as number;

  const [user, entries] = await Promise.all([
    prisma.user.findUnique({
      where: { id: me },
      select: { trustPoints: true, completedJobs: true },
    }),
    prisma.pointsLedger.findMany({
      where: { userId: me },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, points: true, reason: true, createdAt: true },
    }),
  ]);

  if (!user) return res.status(404).json({ message: "ไม่พบผู้ใช้" });

  res.json({
    trustPoints: user.trustPoints,
    completedJobs: user.completedJobs,
    level: trustLevel(user.trustPoints),
    entries,
  });
});

export default router;
