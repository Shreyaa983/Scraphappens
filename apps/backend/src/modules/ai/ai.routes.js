import { Router } from "express";
import { suggest } from "./ai.controller.js";
import { authenticate } from "../../middleware/auth.js";

const router = Router();

router.post("/suggest", authenticate, suggest);

export default router;
