import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { config } from "../config";
import { publicUserSelect } from "../lib/userSelect";
import { requireAuth, type AuthRequest } from "../middleware/auth";

const router = Router();

const registerSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, "ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร")
      .max(50),
    email: z.string().trim().toLowerCase().email("อีเมลไม่ถูกต้อง").max(120),
    password: z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร").max(72),
    confirmPassword: z.string(),
    phone: z
      .string()
      .regex(/^0\d{8,9}$/, "เบอร์โทรไม่ถูกต้อง")
      .optional(),
    age: z.coerce
      .number()
      .int()
      .min(15, "อายุต้องไม่ต่ำกว่า 15 ปี")
      .max(100)
      .optional(),
    skill: z.string().trim().max(500).optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "รหัสผ่านไม่ตรงกัน",
    path: ["confirmPassword"],
  });

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

function signToken(userId: number) {
  return jwt.sign({}, config.jwtSecret, {
    subject: String(userId),
    expiresIn: "7d",
  });
}

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "ข้อมูลไม่ถูกต้อง",
      errors: parsed.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      })),
    });
  }

  const { username, email, password, phone, age, skill } = parsed.data;

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, email, passwordHash, phone, age, skills: skill },
      select: publicUserSelect,
    });
    return res.status(201).json({ token: signToken(user.id), user });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return res
        .status(409)
        .json({ message: "อีเมลหรือชื่อผู้ใช้นี้ถูกใช้แล้ว" });
    }
    console.error(err);
    return res.status(500).json({ message: "เกิดข้อผิดพลาดของเซิร์ฟเวอร์" });
  }
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "กรอกอีเมลและรหัสผ่านให้ถูกต้อง" });
  }

  const { email, password } = parsed.data;

  try {
    const found = await prisma.user.findUnique({ where: { email } });
    const ok = found
      ? await bcrypt.compare(password, found.passwordHash)
      : false;
    if (!found || !ok) {
      return res.status(401).json({ message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
    }

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: found.id },
      select: publicUserSelect,
    });
    return res.json({ token: signToken(user.id), user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "เกิดข้อผิดพลาดของเซิร์ฟเวอร์" });
  }
});

router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: publicUserSelect,
  });
  if (!user) return res.status(404).json({ message: "ไม่พบผู้ใช้" });
  res.json({ user });
});

export default router;
