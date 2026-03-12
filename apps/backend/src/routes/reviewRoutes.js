import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import * as reviewController from "../modules/reviews/review.controller.js";

const router = Router();

// POST /api/reviews - Submit a review for an order
router.post("/", authenticate, reviewController.submitReviewHandler);

// GET /api/reviews/supplier/:seller_id - Get all reviews for a supplier
router.get("/supplier/:seller_id", reviewController.getSupplierReviewsHandler);

// GET /api/reviews/stats/:seller_id - Get supplier statistics
router.get("/stats/:seller_id", reviewController.getSupplierStatsHandler);

export default router;
