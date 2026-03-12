import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import * as reputationController from "../modules/reputation/reputation.controller.js";

const router = Router();

// GET /api/reputation/my-score - Get current user's circular score
router.get("/my-score", authenticate, reputationController.getCurrentUserCircularScoreHandler);

// GET /api/reputation/score/:user_id - Get circular score for a specific user
router.get("/score/:user_id", reputationController.getCircularScoreHandler);

// GET /api/reputation/top-suppliers - Get top suppliers by reputation
router.get("/top-suppliers", reputationController.getTopSuppliersHandler);

export default router;
