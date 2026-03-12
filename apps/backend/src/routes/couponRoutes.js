import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import * as couponController from "../modules/coupons/coupon.controller.js";

const router = Router();

// GET /api/coupons - Get user's available coupons
router.get("/", authenticate, couponController.getUserCouponsHandler);

// GET /api/coupons/available - Get available/unused coupons for user
router.get("/available", authenticate, couponController.getAvailableCouponsHandler);

// POST /api/coupons/apply - Apply a coupon to an order
router.post("/apply", authenticate, couponController.applyCouponHandler);

// GET /api/coupons/validate - Validate a coupon code
router.get("/validate", couponController.validateCouponHandler);

export default router;
