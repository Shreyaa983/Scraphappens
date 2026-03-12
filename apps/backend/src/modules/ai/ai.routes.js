import { Router } from "express";
import { suggest, handleChat, handleProductSuggestions } from "./ai.controller.js";
import { authenticate } from "../../middleware/auth.js";

const router = Router();

router.post("/suggest", authenticate, suggest);
router.post("/chat", handleChat);
router.post("/product-ideas", handleProductSuggestions); // NEW ROUTE

export default router;