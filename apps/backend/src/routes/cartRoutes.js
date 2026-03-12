import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { addToCart, getCart, removeCartItem } from "../controllers/cartController.js";

const router = Router();

router.post("/add", authenticate, addToCart);
router.get("/", authenticate, getCart);
router.delete("/:id", authenticate, removeCartItem);

export default router;


