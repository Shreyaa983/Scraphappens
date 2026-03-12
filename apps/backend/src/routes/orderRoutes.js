import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { getMyOrders, getSellerOrders, placeOrder } from "../controllers/orderController.js";

const router = Router();

router.post("/place", authenticate, placeOrder);
router.get("/my-orders", authenticate, getMyOrders);
router.get("/seller-orders", authenticate, getSellerOrders);

export default router;


