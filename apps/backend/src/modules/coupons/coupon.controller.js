import * as couponService from "./coupon.service.js";
import * as couponModel from "../../models/couponModel.js";

export async function getUserCouponsHandler(req, res) {
  try {
    const user_id = req.user.sub; // from JWT middleware

    const coupons = await couponService.getUserCoupons(user_id);

    res.json({
      success: true,
      coupons,
    });
  } catch (error) {
    console.error("Error fetching coupons:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
}

export async function applyCouponHandler(req, res) {
  try {
    const user_id = req.user.sub; // from JWT middleware
    const { coupon_code, order_id } = req.body;

    if (!coupon_code || !order_id) {
      return res.status(400).json({ error: "Missing coupon_code or order_id" });
    }

    const result = await couponService.applyCouponToOrder(user_id, coupon_code, order_id);

    res.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Error applying coupon:", error);
    res.status(400).json({ error: error.message || "Internal server error" });
  }
}

export async function getAvailableCouponsHandler(req, res) {
  try {
    const user_id = req.user.sub; // from JWT middleware

    const coupons = await couponService.getAvailableCouponsForUser(user_id);

    res.json({
      success: true,
      coupons,
    });
  } catch (error) {
    console.error("Error fetching available coupons:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
}

export async function validateCouponHandler(req, res) {
  try {
    const { coupon_code } = req.query;

    if (!coupon_code) {
      return res.status(400).json({ error: "Missing coupon_code" });
    }

    const coupon = await couponModel.getCouponByCode(coupon_code);
    if (!coupon) {
      return res.status(404).json({ error: "Invalid coupon code" });
    }

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return res.status(400).json({ error: "Coupon has expired" });
    }

    res.json({
      success: true,
      coupon,
      discount: couponService.calculateDiscountAmount(coupon, 1000), // Base calculation for 1000 rupees
    });
  } catch (error) {
    console.error("Error validating coupon:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
}
