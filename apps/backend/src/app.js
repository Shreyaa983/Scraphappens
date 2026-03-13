import express from "express";
import cors from "cors";
import authRoutes from "./modules/auth/auth.routes.js";
import protectedRoutes from "./modules/protected/protected.routes.js";
import aiRoutes from "./modules/ai/ai.routes.js";
import materialRoutes from "./routes/materialRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import logisticsRoutes from "./routes/logisticsRoutes.js";
import voiceRoutes from "./modules/voice/voice.routes.js";
import diyRoutes from "./routes/diyRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import achievementRoutes from "./routes/achievementRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import reputationRoutes from "./routes/reputationRoutes.js";
import * as achievementService from "./modules/achievements/achievement.service.js";

const app = express();

// Best effort initialization so the API still boots even if DB setup lags behind.
// Avoid top-level await in serverless runtimes.
achievementService.initializeAchievements().catch((err) => {
  console.warn("Warning: Could not initialize achievements:", err.message);
});

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "https://scraphappens-frontend.vercel.app/",
  "https://scraphappens.vercel.app",
  "http://localhost:5173",
].filter(Boolean);

function isAllowedVercelOrigin(origin) {
  return /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin);
}

app.use(cors({
  credentials: true,
  origin(origin, callback) {
    // Allow server-to-server requests with no origin (e.g., curl, health checks)
    if (!origin) {
      callback(null, true);
      return;
    }

    const normalizedOrigin = origin.endsWith("/") ? origin.slice(0, -1) : origin;
    const isAllowed = allowedOrigins.some((allowedOrigin) => {
      const normalizedAllowed = allowedOrigin.endsWith("/") ? allowedOrigin.slice(0, -1) : allowedOrigin;
      return normalizedAllowed === normalizedOrigin;
    });

    if (isAllowed || isAllowedVercelOrigin(normalizedOrigin)) {
      callback(null, true);
      return;
    }

    callback(new Error("Not allowed by CORS"));
  },
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images
app.use("/uploads", express.static("uploads"));
app.use("/api/voice", voiceRoutes);

app.get("/health", (_, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/protected", protectedRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/achievements", achievementRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/reputation", reputationRoutes);
app.use("/api", logisticsRoutes);
app.use("/api", diyRoutes);

export default app;
