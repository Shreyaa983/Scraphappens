import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requireBuyer } from "../middleware/roleMiddleware.js";
import { addToCart, addToCartBatch, getCart, removeCartItem } from "../controllers/cartController.js";

const router = Router();

// Cart operations are buyer-only
router.post("/add", authenticate, requireBuyer, addToCart);
router.post("/add-batch", authenticate, requireBuyer, addToCartBatch);
router.get("/", authenticate, requireBuyer, getCart);
router.delete("/:id", authenticate, requireBuyer, removeCartItem);

export default router;


