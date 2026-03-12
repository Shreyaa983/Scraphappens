import { sql } from "../../db/client.js";
import * as badgeModel from "../../models/badgeModel.js";

export async function calculateCircularScore(userId) {
  // Get user's reputation stats
  const userResult = await sql`
    SELECT
      average_rating,
      total_exchanges,
      total_waste_reused_kg,
      trees_planted,
      review_count
    FROM users
    WHERE id = ${userId}
  `;

  if (userResult.length === 0) {
    return null;
  }

  const user = userResult[0];

  // Calculate reputation score (0-100)
  // Components:
  // - Rating (0-30 points): (average_rating / 5) * 30
  // - Exchanges (0-30 points): min((total_exchanges / 50) * 30, 30)
  // - Waste Reused (0-20 points): min((total_waste_reused_kg / 500) * 20, 20)
  // - Trees Planted (0-20 points): min((trees_planted / 25) * 20, 20)

  const ratingScore = Math.min(((user.average_rating || 0) / 5) * 30, 30);
  const exchangeScore = Math.min(((user.total_exchanges || 0) / 50) * 30, 30);
  const wasteScore = Math.min(((user.total_waste_reused_kg || 0) / 500) * 20, 20);
  const treeScore = Math.min(((user.trees_planted || 0) / 25) * 20, 20);

  const totalScore = ratingScore + exchangeScore + wasteScore + treeScore;

  // Get badges
  const badges = await badgeModel.getBadgesForUser(userId);

  return {
    circular_score: Math.round(totalScore),
    rating: user.average_rating || 0,
    items_reused: user.total_exchanges || 0,
    waste_saved_kg: user.total_waste_reused_kg || 0,
    trees_planted: user.trees_planted || 0,
    badges: badges.map((b) => b.badge_name),
    score_breakdown: {
      rating_score: Math.round(ratingScore),
      exchange_score: Math.round(exchangeScore),
      waste_score: Math.round(wasteScore),
      tree_score: Math.round(treeScore),
    },
  };
}

export async function getTopSuppliers(limit = 10) {
  const suppliers = await sql`
    SELECT
      id,
      name,
      email,
      average_rating,
      total_exchanges,
      total_waste_reused_kg,
      trees_planted,
      review_count
    FROM users
    WHERE role = 'supplier' AND total_exchanges > 0
    ORDER BY average_rating DESC, total_exchanges DESC
    LIMIT ${limit}
  `;

  return await Promise.all(
    suppliers.map(async (supplier) => ({
      ...supplier,
      circular_score: (await calculateCircularScore(supplier.id)).circular_score,
    }))
  );
}

export async function updateUserReputationAfterOrder(sellerId, extras) {
  // extras can include waste_reused_kg, waste_reused_units_type
  const wasteKg = extras?.waste_reused_kg || 0;

  // Increment exchanges and waste reused
  const result = await sql`
    UPDATE users
    SET
      total_exchanges = total_exchanges + 1,
      total_waste_reused_kg = total_waste_reused_kg + ${wasteKg}
    WHERE id = ${sellerId}
    RETURNING total_exchanges, total_waste_reused_kg
  `;

  return result[0];
}

export async function incrementBuyerTreeCount(buyerId) {
  const result = await sql`
    UPDATE users
    SET trees_planted = trees_planted + 1
    WHERE id = ${buyerId}
    RETURNING trees_planted
  `;

  return result[0]?.trees_planted || 1;
}
