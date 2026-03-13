import { sql } from "../db/client.js";
import {
  clearCartForUser,
  deleteCartItemById,
  findCartItemByUserAndMaterial,
  getCartItemsForUser,
  getRawCartItemsForUser,
  insertCartItem,
  updateCartItemQuantity,
} from "../models/cartModel.js";

async function addSingleCartItem({ userId, material_id, quantity }) {
  if (!material_id || !quantity) {
    const error = new Error("material_id and quantity are required");
    error.statusCode = 400;
    throw error;
  }

  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty <= 0) {
    const error = new Error("quantity must be a positive number");
    error.statusCode = 400;
    throw error;
  }

  const [material] = await sql`
      SELECT id, quantity
      FROM materials
      WHERE id = ${material_id}
    `;
  if (!material) {
    const error = new Error("Material not found");
    error.statusCode = 404;
    throw error;
  }

  const existing = await findCartItemByUserAndMaterial(userId, material_id);
  const desiredQuantity = existing ? existing.quantity + qty : qty;

  if (material.quantity !== null && desiredQuantity > material.quantity) {
    const error = new Error("Requested quantity exceeds available stock");
    error.statusCode = 400;
    throw error;
  }

  if (existing) {
    return updateCartItemQuantity({ id: existing.id, quantity: desiredQuantity, userId });
  }

  return insertCartItem({ userId, materialId: material_id, quantity: qty });
}

// POST /api/cart/add
export async function addToCart(req, res) {
  try {
    const userId = req.user.sub;
    const { material_id, quantity } = req.body;
    const saved = await addSingleCartItem({ userId, material_id, quantity });
    return res.status(200).json({ item: saved });
  } catch (error) {
    console.error("Error adding to cart:", error);
    return res.status(error.statusCode || 500).json({ message: error.message || "Failed to add to cart" });
  }
}

// POST /api/cart/add-batch
export async function addToCartBatch(req, res) {
  try {
    const userId = req.user.sub;
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "items must be a non-empty array" });
    }

    const results = [];
    for (const item of items) {
      const saved = await addSingleCartItem({
        userId,
        material_id: item?.material_id,
        quantity: item?.quantity,
      });
      results.push(saved);
    }

    return res.status(200).json({ items: results });
  } catch (error) {
    console.error("Error adding batch to cart:", error);
    return res.status(error.statusCode || 500).json({ message: error.message || "Failed to add batch to cart" });
  }
}

// GET /api/cart
export async function getCart(req, res) {
  try {
    const items = await getCartItemsForUser(req.user.sub);
    return res.status(200).json({ items });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return res.status(500).json({ message: "Failed to fetch cart" });
  }
}

// DELETE /api/cart/:id
export async function removeCartItem(req, res) {
  try {
    const deleted = await deleteCartItemById({ id: req.params.id, userId: req.user.sub });
    if (!deleted) {
      return res.status(404).json({ message: "Cart item not found" });
    }
    return res.status(200).json({ message: "Removed from cart" });
  } catch (error) {
    console.error("Error removing cart item:", error);
    return res.status(500).json({ message: "Failed to remove cart item" });
  }
}

// Helper for orders: safely load cart rows with joined material stock
export async function loadCartForOrder(userId) {
  const rows = await getRawCartItemsForUser(userId);
  return rows;
}

// Helper for orders: clear after successful place order
export async function clearUserCart(userId) {
  await clearCartForUser(userId);
}


