import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import * as achievementController from "../modules/achievements/achievement.controller.js";

const router = Router();

// GET /api/achievements - Get all achievements
router.get("/", achievementController.getAllAchievementsHandler);

// GET /api/achievements/user - Get current user's achievements
router.get("/user/mine", authenticate, achievementController.getUserAchievementsHandler);

// GET /api/achievements/progress - Get current user's progress towards next achievement
router.get("/progress", authenticate, achievementController.getAchievementProgressHandler);

// POST /api/achievements/check - Check and unlock new achievements for user
router.post("/check", authenticate, achievementController.checkAndUnlockAchievementsHandler);

export default router;
