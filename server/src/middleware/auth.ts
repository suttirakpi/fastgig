import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";

export interface AuthRequest extends Request {
  userId?: number;
}

export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "ต้องเข้าสู่ระบบก่อน" });
  }
  try {
    const payload = jwt.verify(
      header.slice(7),
      config.jwtSecret,
    ) as jwt.JwtPayload;
    req.userId = Number(payload.sub);
    next();
  } catch {
    res.status(401).json({ message: "โทเคนไม่ถูกต้องหรือหมดอายุ" });
  }
}
