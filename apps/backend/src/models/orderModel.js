import { sql } from "../db/client.js";

export async function createOrder({ buyerId, totalAmount, shippingAddress }) {
  const rows = await sql`
    INSERT INTO orders (buyer_id, total_amount, shipping_address)
    VALUES (${buyerId}, ${totalAmount}, ${shippingAddress})
    RETURNING *
  `;
  return rows[0];
}

export async function createOrderItems(orderId, items) {
  if (!items.length) return [];

  const values = items.map((item) => ({
    order_id: orderId,
    material_id: item.material_id,
    seller_id: item.seller_id,
    quantity: item.quantity,
    price: item.price ?? 0,
  }));

  const rows = await sql`
    INSERT INTO order_items (order_id, material_id, seller_id, quantity, price)
    SELECT
      x.order_id,
      x.material_id,
      x.seller_id,
      x.quantity,
      x.price
    FROM jsonb_to_recordset(${JSON.stringify(values)}::jsonb) AS x(
      order_id uuid,
      material_id uuid,
      seller_id uuid,
      quantity integer,
      price integer
    )
    RETURNING *
  `;

  return rows;
}

export async function getOrdersForBuyer(buyerId) {
  const rows = await sql`
    SELECT
      o.id AS order_id,
      o.order_status,
      o.total_amount,
      o.shipping_address,
      o.created_at,
      oi.id AS order_item_id,
      oi.quantity,
      oi.price,
      m.id AS material_id,
      m.title AS material_title,
      m.image_url,
      u.id AS seller_id,
      u.name AS seller_name,
      u.email AS seller_email
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    JOIN materials m ON m.id = oi.material_id
    JOIN users u ON u.id = oi.seller_id
    WHERE o.buyer_id = ${buyerId}
    ORDER BY o.created_at DESC, oi.id
  `;

  return rows;
}

export async function getOrdersForSeller(sellerId) {
  const rows = await sql`
    SELECT
      oi.id AS order_item_id,
      oi.order_id,
      oi.quantity,
      oi.price,
      o.order_status,
      o.created_at,
      m.id AS material_id,
      m.title AS material_title,
      m.image_url,
      u.id AS buyer_id,
      u.name AS buyer_name,
      u.email AS buyer_email
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    JOIN materials m ON m.id = oi.material_id
    JOIN users u ON u.id = o.buyer_id
    WHERE oi.seller_id = ${sellerId}
    ORDER BY o.created_at DESC, oi.id
  `;

  return rows;
}


