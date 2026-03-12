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

// POST /api/cart/add
export async function addToCart(req, res) {
  try {
    const userId = req.user.sub;
    const { material_id, quantity } = req.body;

    if (!material_id || !quantity) {
      return res.status(400).json({ message: "material_id and quantity are required" });
    }

    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({ message: "quantity must be a positive number" });
    }

    const [material] = await sql`
      SELECT id, quantity
      FROM materials
      WHERE id = ${material_id}
    `;
    if (!material) {
      return res.status(404).json({ message: "Material not found" });
    }

    const existing = await findCartItemByUserAndMaterial(userId, material_id);
    const desiredQuantity = existing ? existing.quantity + qty : qty;

    if (material.quantity !== null && desiredQuantity > material.quantity) {
      return res.status(400).json({ message: "Requested quantity exceeds available stock" });
    }

    let saved;
    if (existing) {
      saved = await updateCartItemQuantity({ id: existing.id, quantity: desiredQuantity, userId });
    } else {
      saved = await insertCartItem({ userId, materialId: material_id, quantity: qty });
    }

    return res.status(200).json({ item: saved });
  } catch (error) {
    console.error("Error adding to cart:", error);
    return res.status(500).json({ message: "Failed to add to cart" });
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


