import { sql } from "../db/client.js";

// Initialize default achievements if they don't exist
export async function ensureDefaultAchievements() {
  const achievements = [
    {
      name: "Seed Planter",
      description: "Complete 3 successful reuses",
      required_exchanges: 3,
      reward_type: "delivery_discount",
      reward_value: "5",
      icon_emoji: "🌱",
    },
    {
      name: "Eco Gardener",
      description: "Complete 10 successful reuses",
      required_exchanges: 10,
      reward_type: "free_delivery",
      reward_value: null,
      icon_emoji: "🌿",
    },
    {
      name: "Forest Guardian",
      description: "Complete 25 successful reuses",
      required_exchanges: 25,
      reward_type: "listing_boost",
      reward_value: "7",
      icon_emoji: "🌳",
    },
    {
      name: "Circular Champion",
      description: "Complete 50 successful reuses",
      required_exchanges: 50,
      reward_type: "marketplace_discount",
      reward_value: "10",
      icon_emoji: "♻️",
    },
  ];

  for (const achievement of achievements) {
    await sql`
      INSERT INTO achievements (name, description, required_exchanges, reward_type, reward_value, icon_emoji)
      VALUES (${achievement.name}, ${achievement.description}, ${achievement.required_exchanges}, 
              ${achievement.reward_type}, ${achievement.reward_value}, ${achievement.icon_emoji})
      ON CONFLICT (name) DO NOTHING;
    `;
  }
}

export async function createAchievement(achievementData) {
  const { name, description, required_exchanges, reward_type, reward_value, icon_emoji } = achievementData;

  const result = await sql`
    INSERT INTO achievements (name, description, required_exchanges, reward_type, reward_value, icon_emoji)
    VALUES (${name}, ${description}, ${required_exchanges}, ${reward_type}, ${reward_value}, ${icon_emoji})
    RETURNING *;
  `;
  return result[0];
}

export async function getAchievementById(achievementId) {
  const result = await sql`
    SELECT * FROM achievements WHERE id = ${achievementId};
  `;
  return result[0] || null;
}

export async function getAllAchievements() {
  const rows = await sql`
    SELECT * FROM achievements ORDER BY required_exchanges ASC;
  `;
  return rows;
}

export async function getUserAchievements(userId) {
  const rows = await sql`
    SELECT
      a.*,
      ua.unlocked_at
    FROM user_achievements ua
    JOIN achievements a ON ua.achievement_id = a.id
    WHERE ua.user_id = ${userId}
    ORDER BY a.required_exchanges ASC;
  `;
  return rows;
}

export async function unlockAchievement(userId, achievementId) {
  const result = await sql`
    INSERT INTO user_achievements (user_id, achievement_id)
    VALUES (${userId}, ${achievementId})
    ON CONFLICT (user_id, achievement_id) DO NOTHING
    RETURNING *;
  `;
  return result[0] || null;
}

export async function getUnlockedAchievements(userId) {
  const rows = await sql`
    SELECT achievement_id FROM user_achievements WHERE user_id = ${userId};
  `;
  return rows.map((row) => row.achievement_id);
}

export async function getAvailableAchievements(userId, exchangeCount) {
  const rows = await sql`
    SELECT
      a.*,
      CASE WHEN ua.achievement_id IS NOT NULL THEN TRUE ELSE FALSE END AS is_unlocked
    FROM achievements a
    LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = ${userId}
    WHERE a.required_exchanges <= ${exchangeCount}
    ORDER BY a.required_exchanges ASC;
  `;
  return rows;
}
