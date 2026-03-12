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

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.urlencoded({ extended: true }));
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
app.use("/api", logisticsRoutes);

export default app;
