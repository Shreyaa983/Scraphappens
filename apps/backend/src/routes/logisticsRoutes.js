import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import {
  createShipmentHandler,
  getLogisticsDashboard,
  getRates,
  schedulePickupsHandler,
  trackShipmentHandler,
} from "../controllers/logisticsController.js";

const router = Router();

router.get("/shipping/rates", authenticate, getRates);
router.post("/shipping/create", authenticate, createShipmentHandler);
router.get("/shipping/track/:shipment_id", authenticate, trackShipmentHandler);
router.get("/shipping/pickups/schedule", authenticate, schedulePickupsHandler);
router.get("/logistics/dashboard", authenticate, getLogisticsDashboard);

export default router;
