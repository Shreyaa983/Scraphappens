import { Router } from "express";
import { login, me, register } from "./auth.controller.js";
import { authenticate } from "../../middleware/auth.js";

const router = Router();

// Register now accepts static address fields and stores them directly
router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticate, me);

export default router;
