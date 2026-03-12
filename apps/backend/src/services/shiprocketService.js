const SHIPROCKET_BASE_URL = "https://apiv2.shiprocket.in/v1/external";

const shipmentsStore = [];
const pickupRequestsStore = [];

const FALLBACK_RATE = {
  courier: "Delhivery",
  price: 80,
  eta: "2 days",
};

function nowIso() {
  return new Date().toISOString();
}

function normalizePincode(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 6);
}

function safeNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function buildHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.SHIPROCKET_TOKEN || ""}`,
  };
}

function hasToken() {
  return Boolean(process.env.SHIPROCKET_TOKEN);
}

function buildServiceError(code, message, status = 500, details = undefined) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  error.details = details;
  return error;
}

async function shiprocketRequest(path, options = {}) {
  if (!hasToken()) {
    throw buildServiceError("TOKEN_MISSING", "Shiprocket token is missing", 401);
  }

  const response = await fetch(`${SHIPROCKET_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...buildHeaders(),
      ...(options.headers || {}),
    },
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw buildServiceError("TOKEN_EXPIRED", "Shiprocket token expired or invalid", 401, data);
    }

    throw buildServiceError("SHIPROCKET_REQUEST_FAILED", data?.message || "Shiprocket request failed", response.status, data);
  }

  return data;
}

function parseAddress(address, defaults = {}) {
  if (!address) {
    return {
      name: defaults.name || "Unknown",
      line1: defaults.line1 || "Address line",
      city: defaults.city || "Mumbai",
      state: defaults.state || "Maharashtra",
      country: defaults.country || "India",
      pincode: normalizePincode(defaults.pincode) || "400001",
      phone: defaults.phone || "9999999999",
      email: defaults.email || "noreply@scraphappens.local",
      lat: null,
      lng: null,
    };
  }

  if (typeof address === "string") {
    return {
      name: defaults.name || "User Address",
      line1: address,
      city: defaults.city || "Mumbai",
      state: defaults.state || "Maharashtra",
      country: defaults.country || "India",
      pincode: normalizePincode(defaults.pincode) || "400001",
      phone: defaults.phone || "9999999999",
      email: defaults.email || "noreply@scraphappens.local",
      lat: null,
      lng: null,
    };
  }

  return {
    name: address.name || defaults.name || "User Address",
    line1: address.line1 || address.address || defaults.line1 || "Address line",
    city: address.city || defaults.city || "Mumbai",
    state: address.state || defaults.state || "Maharashtra",
    country: address.country || defaults.country || "India",
    pincode: normalizePincode(address.pincode || defaults.pincode) || "400001",
    phone: String(address.phone || defaults.phone || "9999999999"),
    email: address.email || defaults.email || "noreply@scraphappens.local",
    lat: Number.isFinite(Number(address.lat)) ? Number(address.lat) : null,
    lng: Number.isFinite(Number(address.lng)) ? Number(address.lng) : null,
  };
}

function estimateCoordinatesFromPincode(pincode) {
  const numeric = safeNumber(pincode, 400001);
  const lat = 8 + ((numeric % 9000) / 9000) * 20;
  const lng = 68 + ((Math.floor(numeric / 7) % 10000) / 10000) * 28;
  return { lat, lng };
}

function getCoordinates(address) {
  if (address?.lat !== null && address?.lng !== null) {
    return { lat: address.lat, lng: address.lng };
  }
  return estimateCoordinatesFromPincode(address?.pincode);
}

function haversineKm(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(x));
}

function toEtaDaysString(value) {
  const days = safeNumber(value, 2);
  return `${Math.max(1, Math.round(days))} days`;
}

function mapRateRows(rows) {
  return rows.map((row) => ({
    courier: row?.courier_name || "Unknown Courier",
    price: safeNumber(row?.freight_charge, 0),
    eta: toEtaDaysString(row?.estimated_delivery_days),
  }));
}

function formatDateForShiprocket(dateInput = new Date()) {
  const date = new Date(dateInput);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function generateMockShipmentId(orderId) {
  return `ship_${String(orderId).replace(/[^a-zA-Z0-9]/g, "").slice(0, 10)}_${Date.now()}`;
}

function upsertShipmentStore(record) {
  const idx = shipmentsStore.findIndex((entry) => entry.shipment_id === record.shipment_id);
  if (idx >= 0) {
    shipmentsStore[idx] = { ...shipmentsStore[idx], ...record };
  } else {
    shipmentsStore.push(record);
  }
}

function addPickupRequestFromShipment(shipmentRecord) {
  pickupRequestsStore.push({
    pickup_request_id: `pickup_req_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    shipment_id: shipmentRecord.shipment_id,
    supplier_address: shipmentRecord.supplier_address,
    receiver_address: shipmentRecord.receiver_address,
    supplier_name: shipmentRecord.supplier_address.name,
    material_name: shipmentRecord.material_name,
    weight: shipmentRecord.weight,
    scheduled_at: shipmentRecord.pickup_datetime || shipmentRecord.created_at,
    status: "pending",
  });
}

function parseCreateShipmentInput(input) {
  if (input?.order && input?.items && input?.buyer) {
    const firstItem = input.items[0] || {};
    const totalWeight = input.items.reduce((sum, item) => sum + safeNumber(item.quantity, 0), 0) || 1;
    return {
      order_id: input.order.id,
      supplier_address: input.pickupLocation || {
        name: "Supplier Hub",
        address: "Default ScrapHappens Hub",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
        phone: "9999999999",
      },
      receiver_address: {
        name: input.buyer.name || "Receiver",
        address: input.order.shipping_address,
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
        phone: "9999999999",
        email: input.buyer.email,
      },
      material_name: firstItem.material_title || "Reusable Material",
      weight: totalWeight,
      price: safeNumber(input.order?.total_amount, 0),
      pickup_datetime: input.order?.created_at,
    };
  }

  return input || {};
}

function buildAdhocOrderPayload(input) {
  const supplier = parseAddress(input.supplier_address, {
    name: "Supplier",
    pincode: input.pickup_pincode,
  });
  const receiver = parseAddress(input.receiver_address, {
    name: "Receiver",
    pincode: input.delivery_pincode,
  });

  const orderId = String(input.order_id || `order_${Date.now()}`);
  const materialName = input.material_name || "Reusable Material";
  const weight = Math.max(0.1, safeNumber(input.weight, 1));
  const price = Math.max(0, safeNumber(input.price, 0));

  return {
    order_id: orderId,
    order_date: formatDateForShiprocket(input.pickup_datetime || new Date()),
    pickup_location: supplier.name,
    channel_id: "",
    comment: "Circular economy material transfer",
    billing_customer_name: receiver.name,
    billing_last_name: "",
    billing_address: receiver.line1,
    billing_city: receiver.city,
    billing_pincode: receiver.pincode,
    billing_state: receiver.state,
    billing_country: receiver.country,
    billing_email: receiver.email,
    billing_phone: receiver.phone,
    shipping_is_billing: true,
    shipping_customer_name: receiver.name,
    shipping_last_name: "",
    shipping_address: receiver.line1,
    shipping_city: receiver.city,
    shipping_pincode: receiver.pincode,
    shipping_country: receiver.country,
    shipping_state: receiver.state,
    shipping_email: receiver.email,
    shipping_phone: receiver.phone,
    order_items: [
      {
        name: materialName,
        sku: `SKU-${orderId}`,
        units: 1,
        selling_price: price,
      },
    ],
    payment_method: "Prepaid",
    sub_total: price,
    length: 10,
    breadth: 10,
    height: 10,
    weight,
    __internal: {
      supplier,
      receiver,
      materialName,
      weight,
      price,
      pickupDateTime: input.pickup_datetime || nowIso(),
    },
  };
}

export async function getShippingRates({ pickup_pincode, delivery_pincode, weight }) {
  const pickup = normalizePincode(pickup_pincode);
  const delivery = normalizePincode(delivery_pincode);
  const safeWeight = Math.max(0.1, safeNumber(weight, 0));

  if (pickup.length !== 6 || delivery.length !== 6) {
    throw buildServiceError("INVALID_PINCODE", "pickup_pincode and delivery_pincode must be valid 6-digit pincodes", 400);
  }

  if (safeWeight <= 0) {
    throw buildServiceError("INVALID_WEIGHT", "weight must be greater than 0", 400);
  }

  try {
    const data = await shiprocketRequest(
      `/courier/serviceability?pickup_postcode=${pickup}&delivery_postcode=${delivery}&cod=0&weight=${safeWeight}`,
      { method: "GET" }
    );

    const rows = data?.data?.available_courier_companies || [];
    if (!rows.length) {
      throw buildServiceError("COURIER_UNAVAILABLE", "No courier available for this route", 404);
    }

    return {
      rates: mapRateRows(rows),
      fallbackUsed: false,
    };
  } catch (error) {
    if (error.code === "INVALID_PINCODE" || error.code === "INVALID_WEIGHT" || error.code === "COURIER_UNAVAILABLE" || error.code === "TOKEN_EXPIRED") {
      throw error;
    }

    return {
      rates: [FALLBACK_RATE],
      fallbackUsed: true,
      fallbackReason: error.message,
    };
  }
}

export async function createShipment(rawInput) {
  const normalizedInput = parseCreateShipmentInput(rawInput);
  const payload = buildAdhocOrderPayload(normalizedInput);

  try {
    const data = await shiprocketRequest("/orders/create/adhoc", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const shipmentId = data?.shipment_id || data?.shipment_details?.shipment_id || generateMockShipmentId(payload.order_id);
    const trackingId = data?.awb_code || data?.tracking_id || data?.shipment_details?.awb_code || null;

    const shipmentRecord = {
      shipment_id: String(shipmentId),
      order_id: payload.order_id,
      tracking_id: trackingId,
      shipment_status: "created",
      current_location: payload.__internal.supplier.city,
      expected_delivery: data?.expected_delivery_date || null,
      supplier_address: payload.__internal.supplier,
      receiver_address: payload.__internal.receiver,
      material_name: payload.__internal.materialName,
      weight: payload.__internal.weight,
      price: payload.__internal.price,
      pickup_datetime: payload.__internal.pickupDateTime,
      created_at: nowIso(),
      provider: "shiprocket",
      fallbackUsed: false,
    };

    upsertShipmentStore(shipmentRecord);
    addPickupRequestFromShipment(shipmentRecord);

    return shipmentRecord;
  } catch (error) {
    if (error.code === "TOKEN_EXPIRED") {
      throw error;
    }

    const fallbackShipment = {
      shipment_id: generateMockShipmentId(payload.order_id),
      order_id: payload.order_id,
      tracking_id: `trk_${Date.now()}`,
      shipment_status: "created",
      current_location: payload.__internal.supplier.city,
      expected_delivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      supplier_address: payload.__internal.supplier,
      receiver_address: payload.__internal.receiver,
      material_name: payload.__internal.materialName,
      weight: payload.__internal.weight,
      price: payload.__internal.price,
      pickup_datetime: payload.__internal.pickupDateTime,
      created_at: nowIso(),
      provider: "mock",
      fallbackUsed: true,
      fallbackReason: error.message,
    };

    upsertShipmentStore(fallbackShipment);
    addPickupRequestFromShipment(fallbackShipment);
    return fallbackShipment;
  }
}

export async function trackShipment({ shipment_id }) {
  const shipmentId = String(shipment_id || "").trim();
  if (!shipmentId) {
    throw buildServiceError("INVALID_SHIPMENT_ID", "shipment_id is required", 400);
  }

  const existing = shipmentsStore.find((entry) => String(entry.shipment_id) === shipmentId);

  try {
    const query = existing?.tracking_id
      ? `/courier/track?awb=${encodeURIComponent(existing.tracking_id)}`
      : `/courier/track?shipment_id=${encodeURIComponent(shipmentId)}`;

    const data = await shiprocketRequest(query, { method: "GET" });
    const trackRoot = data?.tracking_data || data?.data || {};
    const shipmentTrack = trackRoot?.shipment_track?.[0] || trackRoot?.shipment_track || {};

    const result = {
      shipment_status: shipmentTrack?.current_status || shipmentTrack?.status || existing?.shipment_status || "in_transit",
      current_location: shipmentTrack?.current_location || shipmentTrack?.location || existing?.current_location || "In transit",
      expected_delivery: shipmentTrack?.etd || existing?.expected_delivery || null,
      fallbackUsed: false,
    };

    if (existing) {
      upsertShipmentStore({ ...existing, ...result });
    }

    return result;
  } catch (error) {
    if (error.code === "TOKEN_EXPIRED") {
      throw error;
    }

    return {
      shipment_status: existing?.shipment_status || "in_transit",
      current_location: existing?.current_location || "Mumbai Hub",
      expected_delivery: existing?.expected_delivery || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      fallbackUsed: true,
      fallbackReason: error.message,
    };
  }
}

export function getPendingPickupRequests() {
  return pickupRequestsStore.filter((entry) => entry.status === "pending");
}

function withinTimeWindowHours(aIso, bIso, hours) {
  const a = new Date(aIso).getTime();
  const b = new Date(bIso).getTime();
  return Math.abs(a - b) <= hours * 60 * 60 * 1000;
}

export function schedulePickupBatches({ radiusKm = 5, windowHours = 24 } = {}) {
  const pending = getPendingPickupRequests();
  const used = new Set();
  const batches = [];

  for (let i = 0; i < pending.length; i += 1) {
    if (used.has(i)) {
      continue;
    }

    const seed = pending[i];
    const seedCoords = getCoordinates(seed.supplier_address);
    const grouped = [seed];
    used.add(i);

    for (let j = i + 1; j < pending.length; j += 1) {
      if (used.has(j)) {
        continue;
      }

      const candidate = pending[j];
      const candidateCoords = getCoordinates(candidate.supplier_address);
      const distance = haversineKm(seedCoords, candidateCoords);
      const sameWindow = withinTimeWindowHours(seed.scheduled_at, candidate.scheduled_at, windowHours);

      if (distance <= radiusKm && sameWindow) {
        grouped.push(candidate);
        used.add(j);
      }
    }

    const batchId = `pickup_${String(batches.length + 1).padStart(3, "0")}`;
    const receiverName = seed.receiver_address?.name || "Recycler Hub";
    const optimizedRoute = [...grouped.map((entry) => entry.supplier_name), receiverName];

    grouped.forEach((entry) => {
      const idx = pickupRequestsStore.findIndex((item) => item.pickup_request_id === entry.pickup_request_id);
      if (idx >= 0) {
        pickupRequestsStore[idx] = { ...pickupRequestsStore[idx], status: "scheduled", batch_id: batchId };
      }
    });

    batches.push({
      batch_id: batchId,
      pickups: grouped.map((entry) => ({
        supplier: entry.supplier_name,
        material: entry.material_name,
      })),
      optimized_route: optimizedRoute,
    });
  }

  return batches;
}

export function getLogisticsDashboardMetrics() {
  const totalShipments = shipmentsStore.length;
  const activeDeliveries = shipmentsStore.filter(
    (entry) => !["delivered", "cancelled"].includes(String(entry.shipment_status || "").toLowerCase())
  ).length;
  const scheduledPickups = pickupRequestsStore.filter((entry) => entry.status === "scheduled").length;
  const wasteMovedKg = shipmentsStore.reduce((sum, entry) => sum + safeNumber(entry.weight, 0), 0);

  return {
    total_shipments: totalShipments,
    active_deliveries: activeDeliveries,
    scheduled_pickups: scheduledPickups,
    waste_moved_kg: Number(wasteMovedKg.toFixed(2)),
  };
}


