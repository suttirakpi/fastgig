import { Router } from "express";
import type { NextFunction, Response } from "express";
import multer from "multer";
import sharp from "sharp";
import path from "node:path";
import { prisma } from "../lib/prisma";
import {
  AVATAR_DIR,
  AVATAR_URL_PREFIX,
  removeAvatarFile,
} from "../lib/uploads";
import { publicUserSelect } from "../lib/userSelect";
import { requireAuth, type AuthRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|webp)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error("INVALID_TYPE"));
  },
});

function handleUpload(req: AuthRequest, res: Response, next: NextFunction) {
  upload.single("avatar")(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        message:
          err.code === "LIMIT_FILE_SIZE"
            ? "ไฟล์ใหญ่เกิน 5 MB"
            : "อัปโหลดไม่สำเร็จ",
      });
    }
    if (err)
      return res
        .status(400)
        .json({ message: "รองรับเฉพาะไฟล์ JPG, PNG, WebP" });
    next();
  });
}

router.post("/me/avatar", handleUpload, async (req: AuthRequest, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ message: "กรุณาเลือกรูปภาพ" });
  const me = req.userId as number;
  const filename = `${me}-${Date.now()}.webp`;

  try {
    await sharp(file.buffer)
      .rotate() // หมุนตามข้อมูล EXIF จากกล้องมือถือ
      .resize(400, 400, { fit: "cover" })
      .webp({ quality: 82 })
      .toFile(path.join(AVATAR_DIR, filename));
  } catch {
    return res.status(400).json({ message: "ไฟล์รูปภาพไม่ถูกต้อง" });
  }

  try {
    const previous = await prisma.user.findUnique({
      where: { id: me },
      select: { profileImage: true },
    });
    const user = await prisma.user.update({
      where: { id: me },
      data: { profileImage: `${AVATAR_URL_PREFIX}/${filename}` },
      select: publicUserSelect,
    });
    await removeAvatarFile(previous?.profileImage);
    return res.json({ user });
  } catch (err) {
    console.error(err);
    await removeAvatarFile(`${AVATAR_URL_PREFIX}/${filename}`);
    return res.status(500).json({ message: "เกิดข้อผิดพลาดของเซิร์ฟเวอร์" });
  }
});

router.delete("/me/avatar", async (req: AuthRequest, res) => {
  const me = req.userId as number;
  try {
    const previous = await prisma.user.findUnique({
      where: { id: me },
      select: { profileImage: true },
    });
    const user = await prisma.user.update({
      where: { id: me },
      data: { profileImage: null },
      select: publicUserSelect,
    });
    await removeAvatarFile(previous?.profileImage);
    return res.json({ user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "เกิดข้อผิดพลาดของเซิร์ฟเวอร์" });
  }
});

export default router;
