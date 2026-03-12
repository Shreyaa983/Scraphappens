import { sql } from "../db/client.js";

export async function awardBadge(userId, badge_name) {
  const result = await sql`
    INSERT INTO supplier_badges (user_id, badge_name)
    VALUES (${userId}, ${badge_name})
    ON CONFLICT (user_id, badge_name) DO NOTHING
    RETURNING *;
  `;
  return result[0] || null;
}

export async function getBadgesForUser(userId) {
  const rows = await sql`
    SELECT badge_name, awarded_at FROM supplier_badges
    WHERE user_id = ${userId}
    ORDER BY awarded_at DESC;
  `;
  return rows;
}

export async function removeBadge(userId, badge_name) {
  await sql`
    DELETE FROM supplier_badges
    WHERE user_id = ${userId} AND badge_name = ${badge_name};
  `;
}

export async function checkAndAwardBadges(userId, averageRating, totalExchanges) {
  const badges = [];

  // Verified Circular Supplier: 10+ successful exchanges and rating above 4
  if (totalExchanges >= 10 && averageRating >= 4.0) {
    const result = await awardBadge(userId, "Verified Circular Supplier");
    if (result) badges.push(result);
  }

  // Trusted Circular Partner: high rating and high reuse impact
  if (totalExchanges >= 25 && averageRating >= 4.5) {
    const result = await awardBadge(userId, "Trusted Circular Partner");
    if (result) badges.push(result);
  }

  // Sustainability Leader: very high rating and exchange count
  if (totalExchanges >= 50 && averageRating >= 4.6) {
    const result = await awardBadge(userId, "Sustainability Leader");
    if (result) badges.push(result);
  }

  return badges;
}
