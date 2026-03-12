const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

async function parseLogisticsResponse(response, fallbackMessage) {
  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    const message = data?.error?.message || data?.message || fallbackMessage;
    throw new Error(message);
  }

  return data;
}

function authHeaders(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function getShippingRates({ pickup_pincode, delivery_pincode, weight }, token) {
  const params = new URLSearchParams({
    pickup_pincode: String(pickup_pincode || ""),
    delivery_pincode: String(delivery_pincode || ""),
    weight: String(weight || "1"),
  });

  const response = await fetch(`${API_BASE_URL}/api/shipping/rates?${params.toString()}`, {
    method: "GET",
    headers: authHeaders(token),
  });

  return parseLogisticsResponse(response, "Failed to fetch shipping rates");
}

export async function createShipment(payload, token) {
  const response = await fetch(`${API_BASE_URL}/api/shipping/create`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

  return parseLogisticsResponse(response, "Failed to create shipment");
}

export async function trackShipment(shipmentId, token) {
  const response = await fetch(`${API_BASE_URL}/api/shipping/track/${shipmentId}`, {
    method: "GET",
    headers: authHeaders(token),
  });

  return parseLogisticsResponse(response, "Failed to track shipment");
}

export async function getPickupSchedule(token, options = {}) {
  const params = new URLSearchParams();
  if (options.radius_km) params.set("radius_km", String(options.radius_km));
  if (options.window_hours) params.set("window_hours", String(options.window_hours));

  const suffix = params.toString() ? `?${params.toString()}` : "";
  const response = await fetch(`${API_BASE_URL}/api/shipping/pickups/schedule${suffix}`, {
    method: "GET",
    headers: authHeaders(token),
  });

  return parseLogisticsResponse(response, "Failed to fetch pickup schedule");
}

export async function getLogisticsDashboard(token) {
  const response = await fetch(`${API_BASE_URL}/api/logistics/dashboard`, {
    method: "GET",
    headers: authHeaders(token),
  });

  return parseLogisticsResponse(response, "Failed to fetch logistics dashboard");
}
