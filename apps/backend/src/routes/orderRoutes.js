import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requireBuyer, requireSeller } from "../middleware/roleMiddleware.js";
import { getMyOrders, getSellerOrders, placeOrder } from "../controllers/orderController.js";

const router = Router();

// Buyers place orders & view their own
router.post("/place", authenticate, requireBuyer, placeOrder);
router.get("/my-orders", authenticate, requireBuyer, getMyOrders);

// Sellers view seller orders
router.get("/seller-orders", authenticate, requireSeller, getSellerOrders);

export default router;


