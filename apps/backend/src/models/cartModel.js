import { sql } from "../db/client.js";

export async function findCartItemByUserAndMaterial(userId, materialId) {
  const rows = await sql`
    SELECT *
    FROM cart_items
    WHERE user_id = ${userId} AND material_id = ${materialId}
  `;
  return rows[0] || null;
}

export async function insertCartItem({ userId, materialId, quantity }) {
  const rows = await sql`
    INSERT INTO cart_items (user_id, material_id, quantity)
    VALUES (${userId}, ${materialId}, ${quantity})
    RETURNING *
  `;
  return rows[0];
}

export async function updateCartItemQuantity({ id, quantity, userId }) {
  const rows = await sql`
    UPDATE cart_items
    SET quantity = ${quantity}
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING *
  `;
  return rows[0] || null;
}

export async function getCartItemsForUser(userId) {
  const rows = await sql`
    SELECT
      c.id,
      c.material_id,
      c.quantity,
      c.created_at,
      m.title,
      m.image_url,
      m.price,
      m.is_free,
      m.quantity AS available_quantity,
      m.quantity_unit,
      m.location,
      m.listed_by AS seller_id,
      seller.name AS seller_name,
      seller.street_address AS seller_street_address,
      seller.city AS seller_city,
      seller.state AS seller_state,
      seller.country AS seller_country,
      seller.pincode AS seller_pincode,
      seller.latitude AS seller_latitude,
      seller.longitude AS seller_longitude
    FROM cart_items c
    JOIN materials m ON m.id = c.material_id
    LEFT JOIN users seller ON seller.id = m.listed_by
    WHERE c.user_id = ${userId}
    ORDER BY c.created_at DESC
  `;
  return rows;
}

export async function deleteCartItemById({ id, userId }) {
  const rows = await sql`
    DELETE FROM cart_items
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING id
  `;
  return rows[0] || null;
}

export async function getRawCartItemsForUser(userId) {
  const rows = await sql`
    SELECT
      c.id,
      c.material_id,
      c.quantity,
      m.listed_by AS seller_id,
      m.quantity AS available_quantity,
      m.title,
      m.quantity_unit,
      m.category,
      m.material_type
    FROM cart_items c
    JOIN materials m ON m.id = c.material_id
    WHERE c.user_id = ${userId}
    ORDER BY c.created_at
  `;
  return rows;
}

export async function clearCartForUser(userId) {
  await sql`
    DELETE FROM cart_items
    WHERE user_id = ${userId}
  `;
}


