import { Router } from "express";
import { suggest, handleChat } from "./ai.controller.js"; // Added handleChat here
import { authenticate } from "../../middleware/auth.js";

const router = Router();

router.post("/suggest", authenticate, suggest);
router.post("/chat", handleChat); // No 'authenticate' here so it matches your chatbot flow

export default router;