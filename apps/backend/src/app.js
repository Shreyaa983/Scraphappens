import express from "express";
import cors from "cors";
import authRoutes from "./modules/auth/auth.routes.js";
import protectedRoutes from "./modules/protected/protected.routes.js";
import aiRoutes from "./modules/ai/ai.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/protected", protectedRoutes);
app.use("/api/ai", aiRoutes);

export default app;
