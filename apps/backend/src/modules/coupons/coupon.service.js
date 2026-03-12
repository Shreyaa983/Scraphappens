import * as couponModel from "../../models/couponModel.js";

export async function getUserCoupons(userId) {
  return await couponModel.getUserCoupons(userId);
}

export async function applyCouponToOrder(userId, couponCode, orderId) {
  // Get coupon by code
  const coupon = await couponModel.getCouponByCode(couponCode);
  if (!coupon) {
    throw new Error("Invalid coupon code");
  }

  // Check if coupon has expired
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    throw new Error("Coupon has expired");
  }

  // Get user's coupon wallet entry
  const walletEntry = await couponModel.getCouponWalletEntry(userId, coupon.id);
  if (!walletEntry) {
    throw new Error("This coupon is not unlocked for your account");
  }

  if (walletEntry.is_used) {
    throw new Error("Coupon has already been used");
  }

  // Apply coupon to order
  return await couponModel.applyCoupon(walletEntry.id, orderId);
}

export async function getAvailableCouponsForUser(userId) {
  return await couponModel.getUserCoupons(userId);
}

export async function createAdminCoupon(couponData) {
  return await couponModel.createCoupon(couponData);
}

export async function calculateDiscountAmount(coupon, totalAmount) {
  if (!coupon) return 0;

  switch (coupon.type) {
    case "free_delivery":
      // Assume delivery cost is 50-100 rupees, return 100 for free delivery
      return 100;
    case "delivery_discount":
      // Discount percentage from value field
      return Math.floor((totalAmount * coupon.value) / 100);
    case "marketplace_discount":
      // Discount percentage from value field
      return Math.floor((totalAmount * coupon.value) / 100);
    case "listing_boost":
      // Not a monetary discount
      return 0;
    default:
      return 0;
  }
}
