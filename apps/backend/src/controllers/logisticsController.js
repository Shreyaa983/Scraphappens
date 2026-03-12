import {
  createShipment,
  getLogisticsDashboardMetrics,
  getShippingRates,
  schedulePickupBatches,
  trackShipment,
} from "../services/shiprocketService.js";

function parsePositiveNumber(value, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) {
    return fallback;
  }
  return num;
}

function sendServiceError(res, error) {
  return res.status(error.status || 500).json({
    error: {
      code: error.code || "INTERNAL_ERROR",
      message: error.message || "Unexpected error",
      details: error.details || null,
    },
  });
}

// GET /api/shipping/rates
// Step 1: Validate incoming route params and package weight.
// Step 2: Query Shiprocket serviceability API.
// Step 3: Return normalized courier/price/ETA rows with fallback support for demos.
export async function getRates(req, res) {
  const { pickup_pincode, delivery_pincode, weight } = req.query;

  try {
    const result = await getShippingRates({
      pickup_pincode,
      delivery_pincode,
      weight,
    });

    return res.status(200).json({
      rates: result.rates,
      fallback_used: result.fallbackUsed,
      fallback_reason: result.fallbackReason || null,
    });
  } catch (error) {
    return sendServiceError(res, error);
  }
}

// POST /api/shipping/create
// Step 1: Build an ad-hoc Shiprocket order payload from marketplace order data.
// Step 2: Create shipment in Shiprocket.
// Step 3: Store shipment + pickup request in memory with fallback if API is unavailable.
export async function createShipmentHandler(req, res) {
  const {
    order_id,
    supplier_address,
    receiver_address,
    material_name,
    weight,
    price,
    pickup_datetime,
  } = req.body || {};

  if (!order_id || !supplier_address || !receiver_address || !material_name) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "order_id, supplier_address, receiver_address and material_name are required",
      },
    });
  }

  try {
    const shipment = await createShipment({
      order_id,
      supplier_address,
      receiver_address,
      material_name,
      weight: parsePositiveNumber(weight, 1),
      price: Number.isFinite(Number(price)) ? Number(price) : 0,
      pickup_datetime,
    });

    return res.status(201).json({ shipment });
  } catch (error) {
    return sendServiceError(res, error);
  }
}

// GET /api/shipping/track/:shipment_id
// Step 1: Fetch latest tracking state from Shiprocket.
// Step 2: If API fails, return resilient fallback data from local shipment memory.
export async function trackShipmentHandler(req, res) {
  try {
    const tracking = await trackShipment({ shipment_id: req.params.shipment_id });
    return res.status(200).json(tracking);
  } catch (error) {
    return sendServiceError(res, error);
  }
}

// GET /api/shipping/pickups/schedule
// Step 1: Read pending pickups.
// Step 2: Cluster by 5km radius and 24h window (or query overrides).
// Step 3: Return grouped pickup batches and optimized route order.
export async function schedulePickupsHandler(req, res) {
  try {
    const radiusKm = parsePositiveNumber(req.query.radius_km, 5);
    const windowHours = parsePositiveNumber(req.query.window_hours, 24);

    const batches = schedulePickupBatches({ radiusKm, windowHours });

    return res.status(200).json({
      radius_km: radiusKm,
      window_hours: windowHours,
      batches,
    });
  } catch (error) {
    return sendServiceError(res, error);
  }
}

// GET /api/logistics/dashboard
// Returns high-level operational metrics for hackathon demos.
export async function getLogisticsDashboard(req, res) {
  try {
    const metrics = getLogisticsDashboardMetrics();
    return res.status(200).json(metrics);
  } catch (error) {
    return sendServiceError(res, error);
  }
}
