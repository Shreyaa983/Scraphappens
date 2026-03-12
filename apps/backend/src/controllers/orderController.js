import { sql } from "../db/client.js";
import { clearUserCart, loadCartForOrder } from "./cartController.js";
import { createOrder, createOrderItems, getOrdersForBuyer, getOrdersForSeller } from "../models/orderModel.js";
import { createShipment } from "../services/shiprocketService.js";
import * as couponService from "../modules/coupons/coupon.service.js";
import * as reputationService from "../modules/reputation/reputation.service.js";
import * as achievementService from "../modules/achievements/achievement.service.js";
import { sendOrderNotification } from "../modules/whatsapp/whatsapp.service.js";

function formatImpactDisplay(value, unit) {
  return `${value} ${unit} waste diverted`;
}

function buildCircularAchievement({ order, cartRows, priorOrderCount }) {
  const safeRows = Array.isArray(cartRows) ? cartRows : [];
  const firstRow = safeRows[0] || {};
  const numericQuantities = safeRows.map((row) => Number(row.quantity) || 0);
  const totalQuantity = numericQuantities.reduce((sum, value) => sum + value, 0);
  const quantityUnit = safeRows.every((row) => row.quantity_unit && row.quantity_unit === safeRows[0]?.quantity_unit)
    ? safeRows[0]?.quantity_unit || "kg"
    : "units";
  const materialSummary = safeRows.length > 1
    ? `${firstRow.title || firstRow.material_type || firstRow.category || "Reusable material"} + ${safeRows.length - 1} more`
    : firstRow.title || firstRow.material_type || firstRow.category || "Reusable material";
  const purchaseCount = priorOrderCount + 1;
  const isFirstPurchase = priorOrderCount === 0;

  return {
    id: `circular_purchase_${order.id}`,
    category: "order_success",
    name: isFirstPurchase ? "♻ First Circular Purchase" : `♻ Circular Purchase #${purchaseCount}`,
    description: "You prevented reusable material from becoming waste.",
    materialSummary,
    orderId: order.id,
    createdAt: order.created_at,
    reward: {
      plantLabel: "Circular Sapling",
      randomize: true,
      icon: "🌱",
      badgeText: "NEW"
    },
    impact: {
      label: "Waste diverted",
      value: totalQuantity,
      unit: quantityUnit,
      display: formatImpactDisplay(totalQuantity, quantityUnit)
    }
  };
}

// POST /api/orders/place
export async function placeOrder(req, res) {
  const buyerId = req.user.sub;
  const { shipping_address, coupon_code, payment_method, delivery_option } = req.body;

  if (!shipping_address) {
    return res.status(400).json({ message: "shipping_address is required" });
  }

  if (!payment_method) {
    return res.status(400).json({ message: "payment_method is required (upi, card, wallet)" });
  }

  try {
    const cartRows = await loadCartForOrder(buyerId);
    const previousOrders = await sql`
      SELECT COUNT(*)::int AS count
      FROM orders
      WHERE buyer_id = ${buyerId}
    `;
    const priorOrderCount = previousOrders[0]?.count || 0;

    if (!cartRows.length) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Validate quantities against current stock
    for (const row of cartRows) {
      if (row.available_quantity === null || row.available_quantity < row.quantity) {
        return res.status(400).json({ message: "Requested quantity exceeds available stock" });
      }
    }

    // Calculate total amount from material prices
    let totalAmount = 0;
    let totalWasteKg = 0;

    for (const row of cartRows) {
      const itemPrice = row.price ? Number(row.price) : 0;
      totalAmount += itemPrice * row.quantity;
      
      // Estimate waste saved (in kg) - can be customized per material
      const estimatedWaste = (row.quantity || 1) * 2; // Estimate 2kg per unit
      totalWasteKg += estimatedWaste;
    }

    // Apply coupon discount if provided
    let couponId = null;
    let discountAmount = 0;

    if (coupon_code) {
      try {
        // Get coupon details and verify it's available for the user
        const coupon = await sql`
          SELECT c.* FROM coupons c
          JOIN coupon_wallet cw ON c.id = cw.coupon_id
          WHERE cw.user_id = ${buyerId} AND c.code = ${coupon_code} AND cw.is_used = FALSE
          LIMIT 1
        `;

        if (coupon.length > 0) {
          const couponData = coupon[0];
          couponId = couponData.id;
          discountAmount = couponService.calculateDiscountAmount(couponData, totalAmount);
        }
      } catch (error) {
        console.warn("Error validating coupon:", error);
        // Continue without coupon if there's an error
      }
    }

    // Final amount after discount
    const finalAmount = Math.max(0, totalAmount - discountAmount);

    await sql`BEGIN`;
    try {
      const order = await createOrder({
        buyerId,
        totalAmount: finalAmount,
        shippingAddress: shipping_address,
        couponId,
        paymentMethod: payment_method,
        deliveryOption: delivery_option || "standard",
      });

      // Decrement inventory with safety check
      for (const row of cartRows) {
        const updated = await sql`
          UPDATE materials
          SET quantity = quantity - ${row.quantity}
          WHERE id = ${row.material_id} AND quantity >= ${row.quantity}
          RETURNING id
        `;

        if (!updated[0]) {
          throw new Error("Insufficient stock while updating inventory");
        }
      }

      const orderItems = await createOrderItems(
        order.id,
        cartRows.map((row) => ({
          material_id: row.material_id,
          seller_id: row.seller_id,
          quantity: row.quantity,
          price: row.price || 0,
        })),
      );

      // Update seller reputation after order
      const uniqueSellers = [...new Set(cartRows.map((r) => r.seller_id))];
      for (const sellerId of uniqueSellers) {
        await reputationService.updateUserReputationAfterOrder(sellerId, {
          waste_reused_kg: totalWasteKg / uniqueSellers.length,
        });

        // Check and award badges for seller
        const userResult = await sql`
          SELECT average_rating, total_exchanges FROM users WHERE id = ${sellerId}
        `;

        if (userResult.length > 0) {
          const user = userResult[0];
          const exchangeCount = (user.total_exchanges || 0) + 1;

          // Check for seller badges
          if (exchangeCount >= 10 && user.average_rating >= 4.0) {
            // Badge eligible
          }
        }
      }

      // Increment buyer tree count
      await reputationService.incrementBuyerTreeCount(buyerId);

      // Check for buyer achievement unlocks
      const unlockedAchievements = await achievementService.checkAndUnlockAchievements(buyerId);

      await clearUserCart(buyerId);

      await sql`COMMIT`;

      // Apply coupon to order after success
      if (coupon_code) {
        try {
          await sql`
            UPDATE coupon_wallet
            SET is_used = TRUE, used_on_order_id = ${order.id}
            WHERE user_id = ${buyerId} AND coupon_id = ${couponId}
          `;
        } catch (error) {
          console.warn("Error marking coupon as used:", error);
        }
      }

      const shipment = await createShipment({
        order,
        items: orderItems.map((oi) => ({
          material_id: oi.material_id,
          quantity: oi.quantity,
          seller_id: oi.seller_id,
          material_title: undefined,
        })),
        buyer: {
          id: req.user.sub,
          name: req.user.name,
          email: req.user.email,
        },
      });


      try {
        console.log(`[WhatsApp] Fetching phone number for buyer ${buyerId}...`);
        const buyerRows = await sql`SELECT phone_number FROM users WHERE id = ${buyerId} LIMIT 1`;
        const buyerPhone = buyerRows[0]?.phone_number;
        console.log(`[WhatsApp] phone_number from DB: "${buyerPhone ?? 'NULL'}"`); 
        if (buyerPhone) {
          const materialSummary = cartRows[0]?.title || cartRows[0]?.material_type || "Scrap Materials";
          console.log(`[WhatsApp] Sending notification to buyer ${buyerId} | phone: ${buyerPhone} | material: ${materialSummary}`);
          await sendOrderNotification(buyerPhone, materialSummary);
          console.log(`[WhatsApp] Notification dispatched successfully.`);
        } else {
          console.warn(`[WhatsApp] Skipping: no phone_number on file for buyer ${buyerId}`);
        }
      } catch (wsError) {
        console.error("[WhatsApp] Notification failed (order still placed):", wsError.message, wsError.stack);
      }

      const achievement = buildCircularAchievement({
        order,
        cartRows,
        priorOrderCount,
      });

      return res.status(201).json({
        order: {
          ...order,
          discount_applied: discountAmount,
          final_amount: finalAmount,
        },
        order_items: orderItems,
        shipment,
        achievement,
        newly_unlocked_achievements: unlockedAchievements,
        tree_planted: true,
      });
    } catch (error) {
      await sql`ROLLBACK`;
      console.error("Error placing order:", error);
      return res.status(500).json({ message: "Failed to place order" });
    }
  } catch (error) {
    console.error("Error before placing order:", error);
    return res.status(500).json({ message: "Failed to place order" });
  }
}

// GET /api/orders/my-orders
export async function getMyOrders(req, res) {
  try {
    const rows = await getOrdersForBuyer(req.user.sub);

    const ordersMap = new Map();
    for (const row of rows) {
      if (!ordersMap.has(row.order_id)) {
        ordersMap.set(row.order_id, {
          id: row.order_id,
          status: row.order_status,
          total_amount: row.total_amount,
          shipping_address: row.shipping_address,
          payment_method: row.payment_method,
          delivery_option: row.delivery_option,
          coupon_id: row.coupon_id,
          created_at: row.created_at,
          items: [],
        });
      }
      ordersMap.get(row.order_id).items.push({
        id: row.order_item_id,
        material_id: row.material_id,
        material_title: row.material_title,
        image_url: row.image_url,
        quantity: row.quantity,
        price: row.price,
        seller: {
          id: row.seller_id,
          name: row.seller_name,
          email: row.seller_email,
        },
      });
    }

    return res.status(200).json({ orders: Array.from(ordersMap.values()) });
  } catch (error) {
    console.error("Error fetching buyer orders:", error);
    return res.status(500).json({ message: "Failed to fetch orders" });
  }
}

// GET /api/orders/seller-orders
export async function getSellerOrders(req, res) {
  try {
    const rows = await getOrdersForSeller(req.user.sub);

    const items = rows.map((row) => ({
      id: row.order_item_id,
      order_id: row.order_id,
      quantity: row.quantity,
      price: row.price,
      status: row.order_status,
      payment_method: row.payment_method,
      delivery_option: row.delivery_option,
      created_at: row.created_at,
      material: {
        id: row.material_id,
        title: row.material_title,
        image_url: row.image_url,
      },
      buyer: {
        id: row.buyer_id,
        name: row.buyer_name,
        email: row.buyer_email,
      },
    }));

    return res.status(200).json({ items });
  } catch (error) {
    console.error("Error fetching seller orders:", error);
    return res.status(500).json({ message: "Failed to fetch seller orders" });
  }
}


