import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import {
  createMaterialListing,
  deleteMaterialListing,
  getMaterials,
  getMyMaterials,
  getSingleMaterial,
  updateMaterialListing,
} from "../controllers/materialController.js";

const router = Router();

router.post("/", authenticate, createMaterialListing);
router.get("/", getMaterials);
router.get("/me", authenticate, getMyMaterials);
router.get("/:id", getSingleMaterial);
router.put("/:id", authenticate, updateMaterialListing);
router.delete("/:id", authenticate, deleteMaterialListing);

export default router;

