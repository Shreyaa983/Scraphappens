import * as achievementService from "./achievement.service.js";

export async function getAllAchievementsHandler(req, res) {
  try {
    const achievements = await achievementService.getAllAchievements();

    res.json({
      success: true,
      achievements,
    });
  } catch (error) {
    console.error("Error fetching achievements:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
}

export async function getUserAchievementsHandler(req, res) {
  try {
    const user_id = req.user.sub; // from JWT middleware

    const achievements = await achievementService.getUserAchievements(user_id);

    res.json({
      success: true,
      achievements,
    });
  } catch (error) {
    console.error("Error fetching user achievements:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
}

export async function getAchievementProgressHandler(req, res) {
  try {
    const user_id = req.user.sub; // from JWT middleware

    const progress = await achievementService.getAchievementProgress(user_id);

    res.json({
      success: true,
      progress,
    });
  } catch (error) {
    console.error("Error fetching achievement progress:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
}

export async function checkAndUnlockAchievementsHandler(req, res) {
  try {
    const user_id = req.user.sub; // from JWT middleware

    const unlockedList = await achievementService.checkAndUnlockAchievements(user_id);

    res.json({
      success: true,
      newly_unlocked: unlockedList,
    });
  } catch (error) {
    console.error("Error unlocking achievements:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
}
