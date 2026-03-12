import { sql } from "../db/client.js";
import { clearUserCart, loadCartForOrder } from "./cartController.js";
import { createOrder, createOrderItems, getOrdersForBuyer, getOrdersForSeller } from "../models/orderModel.js";
import { createShipment } from "../services/shiprocketService.js";

// POST /api/orders/place
export async function placeOrder(req, res) {
  const buyerId = req.user.sub;
  const { shipping_address } = req.body;

  if (!shipping_address) {
    return res.status(400).json({ message: "shipping_address is required" });
  }

  try {
    const cartRows = await loadCartForOrder(buyerId);
    if (!cartRows.length) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Validate quantities against current stock
    for (const row of cartRows) {
      if (row.available_quantity === null || row.available_quantity < row.quantity) {
        return res.status(400).json({ message: "Requested quantity exceeds available stock" });
      }
    }

    // For now, pricing is not implemented; keep total as 0
    const totalAmount = 0;

    await sql`BEGIN`;
    try {
      const order = await createOrder({ buyerId, totalAmount, shippingAddress: shipping_address });

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
          price: 0,
        })),
      );

      await clearUserCart(buyerId);

      await sql`COMMIT`;

      const shipment = createShipment({
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

      return res.status(201).json({ order, order_items: orderItems, shipment });
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


