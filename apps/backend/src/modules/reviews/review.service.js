import * as reviewModel from "../../models/reviewModel.js";
import * as badgeModel from "../../models/badgeModel.js";
import { sql } from "../../db/client.js";

export async function submitReview(reviewData) {
  const review = await reviewModel.createReview(reviewData);

  // Update seller's reputation scores
  const stats = await reviewModel.getSupplierStats(reviewData.seller_id);

  if (stats && stats.average_rating) {
    // Get total exchanges count
    const exchangeResult = await sql`
      SELECT COUNT(DISTINCT order_id) as total_exchanges
      FROM reviews
      WHERE seller_id = ${reviewData.seller_id};
    `;

    const exchangeCount = exchangeResult[0]?.total_exchanges || 0;

    // Update user with new reputation scores
    await sql`
      UPDATE users
      SET
        average_rating = ${parseFloat(stats.average_rating)},
        review_count = ${stats.total_reviews}
      WHERE id = ${reviewData.seller_id}
    `;

    // Check and award badges
    await badgeModel.checkAndAwardBadges(
      reviewData.seller_id,
      parseFloat(stats.average_rating),
      exchangeCount
    );
  }

  return review;
}

export async function getSupplierReviews(sellerId) {
  return await reviewModel.getReviewsBySupplier(sellerId);
}

export async function getSupplierStats(sellerId) {
  const stats = await reviewModel.getSupplierStats(sellerId);

  // Get badges for this seller
  const badges = await badgeModel.getBadgesForUser(sellerId);

  return {
    ...stats,
    badges: badges.map((b) => b.badge_name),
  };
}

export async function canLeaveReview(buyerId, orderId) {
  // Check if buyer completed the order
  const orders = await sql`
    SELECT o.id FROM orders o
    WHERE o.id = ${orderId} AND o.buyer_id = ${buyerId}
    AND o.order_status IN ('completed', 'delivered')
    LIMIT 1;
  `;

  if (orders.length === 0) return false;

  // Check if review already exists
  const existing = await reviewModel.getReviewByOrderId(orderId);
  return !existing;
}
