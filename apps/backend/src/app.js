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
await achievementService.initializeAchievements().catch((err) => {
  console.warn("Warning: Could not initialize achievements:", err.message);
});

app.use(cors());
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
