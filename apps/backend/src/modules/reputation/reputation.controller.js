import * as reputationService from "./reputation.service.js";

export async function getCircularScoreHandler(req, res) {
  try {
    const { user_id } = req.params || req.user.sub;

    const score = await reputationService.calculateCircularScore(user_id || req.user.sub);

    if (!score) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      success: true,
      score,
    });
  } catch (error) {
    console.error("Error calculating circular score:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
}

export async function getTopSuppliersHandler(req, res) {
  try {
    const { limit } = req.query;

    const suppliers = await reputationService.getTopSuppliers(parseInt(limit) || 10);

    res.json({
      success: true,
      suppliers,
    });
  } catch (error) {
    console.error("Error fetching top suppliers:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
}

export async function getCurrentUserCircularScoreHandler(req, res) {
  try {
    const user_id = req.user.sub; // from JWT middleware

    const score = await reputationService.calculateCircularScore(user_id);

    if (!score) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      success: true,
      score,
    });
  } catch (error) {
    console.error("Error calculating current user circular score:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
}
