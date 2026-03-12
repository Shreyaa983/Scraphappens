// Placeholder Shiprocket integration service.
// In the future, this module will call real Shiprocket APIs.

export function createShipment(orderData) {
  const {
    order,
    items,
    buyer,
    pickupLocation = {
      address: "Default ScrapHappens Hub",
      city: "Mumbai",
      pincode: "400001",
      country: "India",
    },
  } = orderData;

  const payload = {
    order_id: order.id,
    order_date: order.created_at,
    pickup_location: pickupLocation,
    buyer: {
      id: buyer.id,
      name: buyer.name,
      email: buyer.email,
      address: order.shipping_address,
    },
    products: items.map((item) => ({
      material_id: item.material_id,
      name: item.material_title,
      quantity: item.quantity,
      seller_id: item.seller_id,
    })),
  };

  return {
    prepared: true,
    provider: "shiprocket",
    payload,
    message: "Shiprocket payload prepared (mock). Integration to be implemented.",
  };
}


