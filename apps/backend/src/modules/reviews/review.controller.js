import * as reviewService from "./review.service.js";

export async function submitReviewHandler(req, res) {
  try {
    const { order_id, seller_id, star_rating, comment, delivery_experience_rating, material_quality_rating } =
      req.body;
    const buyer_id = req.user.sub; // from JWT middleware

    if (!order_id || !seller_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!star_rating || star_rating < 1 || star_rating > 5) {
      return res.status(400).json({ error: "Star rating must be between 1 and 5" });
    }

    // Check if buyer can leave review
    const canReview = await reviewService.canLeaveReview(buyer_id, order_id);
    if (!canReview) {
      return res.status(403).json({ error: "Cannot leave review for this order" });
    }

    const review = await reviewService.submitReview({
      order_id,
      buyer_id,
      seller_id,
      star_rating,
      comment,
      delivery_experience_rating: delivery_experience_rating || star_rating,
      material_quality_rating: material_quality_rating || star_rating,
    });

    res.status(201).json({
      success: true,
      review,
    });
  } catch (error) {
    console.error("Error submitting review:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
}

export async function getSupplierReviewsHandler(req, res) {
  try {
    const { seller_id } = req.params;

    if (!seller_id) {
      return res.status(400).json({ error: "Missing seller_id" });
    }

    const reviews = await reviewService.getSupplierReviews(seller_id);

    res.json({
      success: true,
      reviews,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
}

export async function getSupplierStatsHandler(req, res) {
  try {
    const { seller_id } = req.params;

    if (!seller_id) {
      return res.status(400).json({ error: "Missing seller_id" });
    }

    const stats = await reviewService.getSupplierStats(seller_id);

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Error fetching supplier stats:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
}
