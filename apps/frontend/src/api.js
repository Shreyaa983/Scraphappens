const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

async function parseResponse(response, fallbackMessage) {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || fallbackMessage);
  }

  return data;
}

export async function register(payload) {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  return parseResponse(response, "Registration failed");
}

export async function login(payload) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  return parseResponse(response, "Login failed");
}

export async function getCurrentUser(token) {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return parseResponse(response, "Unable to load current user");
}

export async function getMaterials() {
  const response = await fetch(`${API_BASE_URL}/api/materials`);
  return parseResponse(response, "Failed to fetch materials");
}

export async function getMyMaterials(token) {
  const response = await fetch(`${API_BASE_URL}/api/materials/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return parseResponse(response, "Failed to fetch your listings");
}

export async function createMaterial(payload, token) {
  const response = await fetch(`${API_BASE_URL}/api/materials`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
  return parseResponse(response, "Failed to create material");
}

export async function updateMaterial(id, payload, token) {
  const response = await fetch(`${API_BASE_URL}/api/materials/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
  return parseResponse(response, "Failed to update material");
}

export async function deleteMaterialById(id, token) {
  const response = await fetch(`${API_BASE_URL}/api/materials/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  return parseResponse(response, "Failed to delete material");
}

// Cart APIs
export async function addToCart({ material_id, quantity }, token) {
  const response = await fetch(`${API_BASE_URL}/api/cart/add`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ material_id, quantity }),
  });
  return parseResponse(response, "Failed to add to cart");
}

export async function getCart(token) {
  const response = await fetch(`${API_BASE_URL}/api/cart`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseResponse(response, "Failed to load cart");
}

export async function removeCartItem(id, token) {
  const response = await fetch(`${API_BASE_URL}/api/cart/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseResponse(response, "Failed to remove cart item");
}

// Orders APIs
export async function placeOrder(payload, token) {
  const response = await fetch(`${API_BASE_URL}/api/orders/place`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return parseResponse(response, "Failed to place order");
}

export async function getMyOrdersApi(token) {
  const response = await fetch(`${API_BASE_URL}/api/orders/my-orders`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseResponse(response, "Failed to load your orders");
}

export async function getSellerOrdersApi(token) {
  const response = await fetch(`${API_BASE_URL}/api/orders/seller-orders`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseResponse(response, "Failed to load seller orders");
}

