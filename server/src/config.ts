import "dotenv/config";

const secret = process.env.JWT_SECRET;
if (!secret || secret.length < 16) {
  throw new Error("JWT_SECRET ใน .env ต้องมีอย่างน้อย 16 ตัวอักษร");
}

export const config = {
  port: Number(process.env.PORT) || 3000,
  jwtSecret: secret,
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
};
