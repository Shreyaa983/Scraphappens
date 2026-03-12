import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth.js";
import { Roles } from "../../types/roles.js";

const router = Router();

router.get("/supplier-only", authenticate, authorize(Roles.SUPPLIER), (req, res) => {
  res.status(200).json({ message: `Welcome supplier ${req.user.name}` });
});

router.get("/buyer-only", authenticate, authorize(Roles.BUYER), (req, res) => {
  res.status(200).json({ message: `Welcome buyer ${req.user.name}` });
});

router.get("/volunteer-only", authenticate, authorize(Roles.VOLUNTEER), (req, res) => {
  res.status(200).json({ message: `Welcome volunteer ${req.user.name}` });
});

export default router;
