import { sql } from "../db/client.js";

export async function createReview(reviewData) {
  const {
    order_id,
    buyer_id,
    seller_id,
    star_rating,
    comment,
    delivery_experience_rating,
    material_quality_rating,
  } = reviewData;

  const result = await sql`
    INSERT INTO reviews (
      order_id, buyer_id, seller_id, star_rating, comment,
      delivery_experience_rating, material_quality_rating
    ) VALUES (
      ${order_id}, ${buyer_id}, ${seller_id}, ${star_rating}, ${comment},
      ${delivery_experience_rating}, ${material_quality_rating}
    )
    RETURNING *;
  `;
  return result[0];
}

export async function getReviewsBySupplier(sellerId) {
  const rows = await sql`
    SELECT
      r.*,
      u.name AS buyer_name
    FROM reviews r
    JOIN users u ON r.buyer_id = u.id
    WHERE r.seller_id = ${sellerId}
    ORDER BY r.created_at DESC;
  `;
  return rows;
}

export async function getReviewById(reviewId) {
  const result = await sql`
    SELECT * FROM reviews WHERE id = ${reviewId};
  `;
  return result[0] || null;
}

export async function getReviewByOrderId(orderId) {
  const result = await sql`
    SELECT * FROM reviews WHERE order_id = ${orderId};
  `;
  return result[0] || null;
}

export async function getSupplierStats(sellerId) {
  const result = await sql`
    SELECT
      COUNT(DISTINCT r.order_id) AS total_reviews,
      AVG(r.star_rating) AS average_rating,
      AVG(r.delivery_experience_rating) AS avg_delivery_rating,
      AVG(r.material_quality_rating) AS avg_quality_rating
    FROM reviews r
    WHERE r.seller_id = ${sellerId};
  `;
  return result[0] || {
    total_reviews: 0,
    average_rating: 0,
    avg_delivery_rating: 0,
    avg_quality_rating: 0,
  };
}
