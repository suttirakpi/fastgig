import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, type AuthRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/", async (req: AuthRequest, res) => {
  const me = req.userId as number;
  const [notifications, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: me },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.notification.count({ where: { userId: me, isRead: false } }),
  ]);
  res.json({ notifications, unread });
});

router.post("/read-all", async (req: AuthRequest, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.userId as number, isRead: false },
    data: { isRead: true },
  });
  res.json({ ok: true });
});

export default router;
