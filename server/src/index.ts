import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config } from "./config";
import authRouter from "./routes/auth";
import jobsRouter from "./routes/jobs";
import notificationsRouter from "./routes/notifications";
import dashboardRouter from "./routes/dashboard";
import pointsRouter from "./routes/points";
import usersRouter from "./routes/users";
import { AVATAR_DIR, AVATAR_URL_PREFIX } from "./lib/uploads";
import matchRouter from "./routes/match";
import chatRouter from "./routes/chat";
import { warmUp } from "./ai/embeddings";

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: config.clientOrigin }));
app.use(express.json());
app.use(
  AVATAR_URL_PREFIX,
  express.static(AVATAR_DIR, { maxAge: "7d", index: false }),
);

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
app.use("/api/dashboard", dashboardRouter);
app.use("/api/users", usersRouter);
app.use("/api/match", matchRouter);
app.use("/api/chat", chatRouter);

app.use((_req, res) => res.status(404).json({ message: "ไม่พบเส้นทางนี้" }));

app.listen(config.port, () => {
  console.log(`API running on http://localhost:${config.port}`);
  warmUp();
});
