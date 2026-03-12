import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requireSeller } from "../middleware/roleMiddleware.js";
import {
  createMaterialListing,
  deleteMaterialListing,
  getMaterials,
  getMyMaterials,
  getSingleMaterial,
  updateMaterialListing,
} from "../controllers/materialController.js";

const router = Router();

// Only sellers can create, update, or delete listings
router.post("/", authenticate, requireSeller, createMaterialListing);
router.get("/", getMaterials);
router.get("/me", authenticate, requireSeller, getMyMaterials);
router.get("/:id", getSingleMaterial);
router.put("/:id", authenticate, requireSeller, updateMaterialListing);
router.delete("/:id", authenticate, requireSeller, deleteMaterialListing);

export default router;

