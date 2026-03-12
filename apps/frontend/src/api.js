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

export async function getMaterialById(id) {
  const response = await fetch(`${API_BASE_URL}/api/materials/${id}`);
  return parseResponse(response, "Failed to fetch material");
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

export async function getDiyPosts(token) {
  const response = await fetch(`${API_BASE_URL}/api/diy`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseResponse(response, "Failed to load DIY inspiration");
}

export async function generateDiyPost(token, materialName) {
  const response = await fetch(`${API_BASE_URL}/api/diy/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(materialName ? { material_name: materialName } : {}),
  });
  return parseResponse(response, "Failed to generate DIY inspiration");
}

export async function getDiyPostById(id, token) {
  const response = await fetch(`${API_BASE_URL}/api/diy/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseResponse(response, "Failed to load DIY project");
}

export async function getDiyPostResults(id, token) {
  const response = await fetch(`${API_BASE_URL}/api/diy/${id}/results`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseResponse(response, "Failed to load DIY results");
}

export async function createDiyResultWithFile(id, formData, token) {
  const response = await fetch(`${API_BASE_URL}/api/diy/${id}/result`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  return parseResponse(response, "Failed to post DIY result");
}

export async function getAchievementProgressApi(token) {
  const response = await fetch(`${API_BASE_URL}/api/achievements/progress`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseResponse(response, "Failed to load achievement progress");
}

export async function getMyCouponsApi(token) {
  const response = await fetch(`${API_BASE_URL}/api/coupons`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseResponse(response, "Failed to load coupon wallet");
}

export async function getMyCircularScoreApi(token) {
  const response = await fetch(`${API_BASE_URL}/api/reputation/my-score`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseResponse(response, "Failed to load circular score");
}

export async function submitReviewApi(payload, token) {
  const response = await fetch(`${API_BASE_URL}/api/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return parseResponse(response, "Failed to submit review");
}

export async function getProductSuggestions(productName) {
  const response = await fetch(`${API_BASE_URL}/api/ai/product-ideas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productName })
  });
  return parseResponse(response, "Failed to fetch AI suggestions");
}

export async function createCommunityPost(payload, token) {
  const response = await fetch(`${API_BASE_URL}/api/community/post`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return parseResponse(response, "Failed to create community post");
}

export async function createCommunityPostWithFile(formData, token) {
  const response = await fetch(`${API_BASE_URL}/api/community/post`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  return parseResponse(response, "Failed to create community post");
}

export async function getCommunityPosts(token) {
  const response = await fetch(`${API_BASE_URL}/api/community`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseResponse(response, "Failed to load community feed");
}

export async function addResultComment(resultId, payload, token) {
  const response = await fetch(`${API_BASE_URL}/api/results/${resultId}/comment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return parseResponse(response, "Failed to add comment");
}

export async function getResultComments(resultId, token) {
  const response = await fetch(`${API_BASE_URL}/api/results/${resultId}/comments`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseResponse(response, "Failed to load comments");
}
