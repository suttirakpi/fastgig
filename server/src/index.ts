import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config } from "./config";
import authRouter from "./routes/auth";
import jobsRouter from "./routes/jobs";
import notificationsRouter from "./routes/notifications";
import pointsRouter from "./routes/points";
const app = express();

app.use(helmet());
app.use(cors({ origin: config.clientOrigin }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", app: "FastGig API" });
});

// จำกัดการยิง register/login กันเดารหัสผ่าน
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "ลองใหม่อีกครั้งภายหลัง" },
});
app.use("/api/auth", authLimiter, authRouter);

app.use("/api/jobs", jobsRouter);
app.use("/api/notifications", notificationsRouter);

app.use("/api/points", pointsRouter);

app.use((_req, res) => res.status(404).json({ message: "ไม่พบเส้นทางนี้" }));

app.listen(config.port, () => {
  console.log(`API running on http://localhost:${config.port}`);
});
