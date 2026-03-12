import { sql } from "../db/client.js";

export async function createCoupon(couponData) {
  const { code, type, value, description, expires_at } = couponData;

  const result = await sql`
    INSERT INTO coupons (code, type, value, description, expires_at)
    VALUES (${code}, ${type}, ${value}, ${description}, ${expires_at})
    RETURNING *;
  `;
  return result[0];
}

export async function getCouponByCode(code) {
  const result = await sql`
    SELECT * FROM coupons WHERE code = ${code};
  `;
  return result[0] || null;
}

export async function getCouponById(couponId) {
  const result = await sql`
    SELECT * FROM coupons WHERE id = ${couponId};
  `;
  return result[0] || null;
}

export async function getUserCoupons(userId) {
  const rows = await sql`
    SELECT
      cw.id AS wallet_id,
      c.*,
      cw.unlocked_at,
      cw.is_used,
      cw.used_on_order_id
    FROM coupon_wallet cw
    JOIN coupons c ON cw.coupon_id = c.id
    WHERE cw.user_id = ${userId} AND cw.is_used = FALSE
    ORDER BY cw.unlocked_at DESC;
  `;
  return rows;
}

export async function unlockCoupon(userId, couponId) {
  const result = await sql`
    INSERT INTO coupon_wallet (user_id, coupon_id)
    VALUES (${userId}, ${couponId})
    ON CONFLICT DO NOTHING
    RETURNING *;
  `;
  return result[0] || null;
}

export async function applyCoupon(walletId, orderId) {
  const result = await sql`
    UPDATE coupon_wallet
    SET is_used = TRUE, used_on_order_id = ${orderId}
    WHERE id = ${walletId}
    RETURNING *;
  `;
  return result[0] || null;
}

export async function getCouponWalletEntry(userId, couponId) {
  const result = await sql`
    SELECT * FROM coupon_wallet
    WHERE user_id = ${userId} AND coupon_id = ${couponId}
    LIMIT 1;
  `;
  return result[0] || null;
}
