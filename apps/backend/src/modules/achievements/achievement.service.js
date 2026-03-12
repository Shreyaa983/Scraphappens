import * as achievementModel from "../../models/achievementModel.js";
import * as couponModel from "../../models/couponModel.js";
import { sql } from "../../db/client.js";

export async function initializeAchievements() {
  await achievementModel.ensureDefaultAchievements();
}

export async function getUserAchievements(userId) {
  return await achievementModel.getUserAchievements(userId);
}

export async function checkAndUnlockAchievements(userId) {
  // Get user's exchange count
  const userResult = await sql`
    SELECT total_exchanges FROM users WHERE id = ${userId}
  `;

  if (userResult.length === 0) return [];

  const exchangeCount = userResult[0].total_exchanges || 0;

  // Get all available achievements for this exchange count
  const achievements = await achievementModel.getAvailableAchievements(userId, exchangeCount);

  const unlockedList = [];

  for (const achievement of achievements) {
    if (!achievement.is_unlocked && exchangeCount >= achievement.required_exchanges) {
      // Unlock the achievement
      await achievementModel.unlockAchievement(userId, achievement.id);
      unlockedList.push(achievement);

      // Unlock associated coupon reward
      if (achievement.reward_type && achievement.reward_value) {
        const couponCode = `${achievement.name.toUpperCase().replace(/\s+/g, "_")}_${userId.slice(0, 8)}`;

        // Create or get the coupon
        let coupon = await couponModel.getCouponByCode(couponCode);

        if (!coupon) {
          coupon = await couponModel.createCoupon({
            code: couponCode,
            type: achievement.reward_type,
            value: parseInt(achievement.reward_value) || null,
            description: `Reward for ${achievement.name}: ${achievement.description}`,
            expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year validity
          });
        }

        // Unlock coupon in user's wallet
        await couponModel.unlockCoupon(userId, coupon.id);
      }
    }
  }

  return unlockedList;
}

export async function getAllAchievements() {
  return await achievementModel.getAllAchievements();
}

export async function getAchievementProgress(userId) {
  const userResult = await sql`
    SELECT total_exchanges FROM users WHERE id = ${userId}
  `;

  if (userResult.length === 0) return null;

  const exchangeCount = userResult[0].total_exchanges || 0;
  const achievements = await achievementModel.getAllAchievements();

  return {
    current_exchanges: exchangeCount,
    next_achievement: achievements.find((a) => a.required_exchanges > exchangeCount),
    all_achievements: achievements.map((a) => ({
      ...a,
      progress: Math.min((exchangeCount / a.required_exchanges) * 100, 100),
    })),
  };
}
