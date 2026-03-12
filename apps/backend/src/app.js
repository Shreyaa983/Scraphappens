import express from "express";
import cors from "cors";
import authRoutes from "./modules/auth/auth.routes.js";
import protectedRoutes from "./modules/protected/protected.routes.js";
import aiRoutes from "./modules/ai/ai.routes.js";
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

export default app;
