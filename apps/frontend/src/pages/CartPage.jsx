import { useEffect, useMemo, useState } from "react";
import { getAchievementProgressApi, getCart, getMyCircularScoreApi, getMyCouponsApi, placeOrder, removeCartItem } from "../api";
import { createShipment, getShippingRates } from "../services/logisticsApi";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80";

const SHIPMENT_BY_ORDER_KEY = "shipmentByOrder";

function parsePincode(input) {
  return String(input || "").replace(/\D/g, "").slice(0, 6);
}

function firstNonEmpty(...values) {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    const normalized = String(value).trim();
    if (normalized) return normalized;
  }
  return "";
}

function estimateWeight(items) {
  const totalQty = (items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  return Math.max(1, totalQty || 1);
}

function loadShipmentMap() {
  try {
    const raw = localStorage.getItem(SHIPMENT_BY_ORDER_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function persistShipmentMap(nextMap) {
  localStorage.setItem(SHIPMENT_BY_ORDER_KEY, JSON.stringify(nextMap));
}

function buildUserAddress(user) {
  if (!user) {
    return {
      line: "",
      city: "",
      state: "",
      country: "India",
      pincode: "",
    };
  }

  const primaryAddress = user.address || user.address_details || user.location || {};
  const profileAddress = user.profile?.address || {};

  return {
    line: firstNonEmpty(
      user.street_address,
      user.streetAddress,
      user.street,
      user.address_line,
      user.line1,
      user.address,
      primaryAddress.street_address,
      primaryAddress.streetAddress,
      primaryAddress.street,
      primaryAddress.address_line,
      primaryAddress.line1,
      primaryAddress.address,
      profileAddress.street_address,
      profileAddress.streetAddress,
      profileAddress.street,
      profileAddress.address_line,
      profileAddress.line1,
      profileAddress.address,
    ),
    city: firstNonEmpty(
      user.city,
      user.town,
      user.district,
      primaryAddress.city,
      primaryAddress.town,
      primaryAddress.district,
      profileAddress.city,
      profileAddress.town,
      profileAddress.district,
    ),
    state: firstNonEmpty(
      user.state,
      user.province,
      primaryAddress.state,
      primaryAddress.province,
      profileAddress.state,
      profileAddress.province,
    ),
    country: firstNonEmpty(
      user.country,
      primaryAddress.country,
      profileAddress.country,
      "India",
    ),
    pincode: parsePincode(
      firstNonEmpty(
        user.pincode,
        user.pin_code,
        user.postal_code,
        user.postalCode,
        user.zip,
        user.zip_code,
        primaryAddress.pincode,
        primaryAddress.pin_code,
        primaryAddress.postal_code,
        primaryAddress.postalCode,
        primaryAddress.zip,
        primaryAddress.zip_code,
        profileAddress.pincode,
        profileAddress.pin_code,
        profileAddress.postal_code,
        profileAddress.postalCode,
        profileAddress.zip,
        profileAddress.zip_code,
      )
    ) || "",
  };
}

function addressToDisplay(address) {
  return [address.line, address.city, address.state, address.country, address.pincode].filter(Boolean).join(", ");
}

function supplierAddressFromItems(items) {
  const first = items?.[0] || {};
  return {
    name: first.seller_name || "Supplier Hub",
    address: first.seller_street_address || first.location || "Supplier address",
    city: first.seller_city || "Mumbai",
    state: first.seller_state || "Maharashtra",
    country: first.seller_country || "India",
    pincode: parsePincode(first.seller_pincode) || "400001",
    lat: Number.isFinite(Number(first.seller_latitude)) ? Number(first.seller_latitude) : undefined,
    lng: Number.isFinite(Number(first.seller_longitude)) ? Number(first.seller_longitude) : undefined,
  };
}

export default function CartPage({ token, user, onOrderPlaced }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [message, setMessage] = useState("");
  const [shippingRates, setShippingRates] = useState([]);
  const [shippingRatesLoading, setShippingRatesLoading] = useState(false);
  const [selectedCourierIndex, setSelectedCourierIndex] = useState(0);
  const [shippingFallbackMessage, setShippingFallbackMessage] = useState("");
  const [orderConfirmation, setOrderConfirmation] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [couponCode, setCouponCode] = useState("");
  const [couponWallet, setCouponWallet] = useState([]);
  const [selectedCouponCode, setSelectedCouponCode] = useState("");
  const [couponProgress, setCouponProgress] = useState({
    currentPlants: 0,
    targetPlants: 5,
    percent: 0,
    nextLabel: "Next coupon milestone",
    currentExchanges: 0,
  });

  const receiverAddress = useMemo(() => buildUserAddress(user), [user]);
  const receiverDisplayAddress = useMemo(() => addressToDisplay(receiverAddress), [receiverAddress]);
  const supplierAddress = useMemo(() => supplierAddressFromItems(items), [items]);

  useEffect(() => {
    async function load() {
      try {
        const { items: rows } = await getCart(token);
        setItems(rows);

        try {
          const [achievementRes, couponsRes, scoreRes] = await Promise.all([
            getAchievementProgressApi(token),
            getMyCouponsApi(token),
            getMyCircularScoreApi(token),
          ]);

          const progress = achievementRes?.progress || {};
          const treesPlanted = Number(scoreRes?.score?.trees_planted || 0);
          const exchanges = Number(progress?.current_exchanges || 0);

          let targetPlants = 5;
          if (treesPlanted >= 25) targetPlants = 50;
          else if (treesPlanted >= 10) targetPlants = 25;
          else if (treesPlanted >= 5) targetPlants = 10;

          const percent = Math.max(0, Math.min(100, (treesPlanted / targetPlants) * 100));
          setCouponProgress({
            currentPlants: treesPlanted,
            targetPlants,
            percent,
            nextLabel: progress?.next_achievement?.name || "Next coupon milestone",
            currentExchanges: exchanges,
          });

          const coupons = couponsRes?.coupons || [];
          setCouponWallet(coupons);
          if (coupons.length > 0) {
            setSelectedCouponCode(coupons[0].code);
          }
        } catch {
          // Keep checkout flow usable even if rewards APIs fail
          setCouponWallet([]);
        }
      } catch (err) {
        console.error("Failed to load cart", err);
        setMessage(err.message || "Failed to load cart");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  async function handleFetchShippingRates() {
    const pickup = parsePincode(supplierAddress.pincode);
    const delivery = parsePincode(receiverAddress.pincode);

    if (!items.length) {
      setMessage("Add at least one cart item to fetch shipping rates.");
      return;
    }

    if (!pickup || !delivery) {
      setMessage("Address pincode missing in profile/supplier data. Please verify saved address fields.");
      return;
    }

    try {
      setShippingRatesLoading(true);
      setShippingFallbackMessage("");
      setMessage("");

      const response = await getShippingRates(
        {
          pickup_pincode: pickup,
          delivery_pincode: delivery,
          weight: estimateWeight(items),
        },
        token
      );

      const rates = response?.rates || [];
      setShippingRates(rates);
      setSelectedCourierIndex(0);

      if (response?.fallback_used) {
        setShippingFallbackMessage("Shipping estimate unavailable. Default courier will be used.");
      }
    } catch {
      setShippingRates([{ courier: "Delhivery", price: 80, eta: "2 days" }]);
      setSelectedCourierIndex(0);
      setShippingFallbackMessage("Shipping estimate unavailable. Default courier will be used.");
    } finally {
      setShippingRatesLoading(false);
    }
  }

  async function handleRemove(id) {
    setMessage("");
    try {
      await removeCartItem(id, token);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      setMessage(err.message || "Failed to remove item");
    }
  }

  async function handlePlaceOrder() {
    if (!items.length) {
      setMessage("Your cart is empty.");
      return;
    }

    const shippingAddress = receiverDisplayAddress;
    if (!shippingAddress) {
      setMessage("Address not available in profile. Please update your account address.");
      return;
    }

    const selectedCourier = shippingRates[selectedCourierIndex] || shippingRates[0] || null;

    try {
      setPlacing(true);
      setMessage("");
      setOrderConfirmation(null);

      const result = await placeOrder(
        {
          shipping_address: shippingAddress,
          payment_method: paymentMethod,
          coupon_code: selectedCouponCode || couponCode || undefined,
        },
        token,
      );

      let shipmentResult = result?.shipment || null;

      try {
        const materialName = items.length > 1 ? `${items[0].title} + ${items.length - 1} more` : (items[0]?.title || "Reusable Material");
        const shipmentPayload = {
          order_id: result?.order?.id,
          supplier_address: {
            name: supplierAddress.name,
            address: supplierAddress.address,
            city: supplierAddress.city,
            state: supplierAddress.state,
            country: supplierAddress.country,
            pincode: parsePincode(supplierAddress.pincode) || "400001",
            phone: "9999999999",
            lat: supplierAddress.lat,
            lng: supplierAddress.lng,
          },
          receiver_address: {
            name: user?.name || "Receiver",
            address: receiverAddress.line || shippingAddress,
            city: receiverAddress.city || "Mumbai",
            state: receiverAddress.state || "Maharashtra",
            country: receiverAddress.country || "India",
            pincode: parsePincode(receiverAddress.pincode) || "400001",
            phone: "9999999998",
            email: user?.email || "receiver@scraphappens.local",
          },
          material_name: materialName,
          weight: estimateWeight(items),
          price: Number(result?.order?.total_amount || 0),
        };

        const shippingCreateResponse = await createShipment(shipmentPayload, token);
        if (shippingCreateResponse?.shipment) {
          shipmentResult = shippingCreateResponse.shipment;
        }
      } catch {
        setShippingFallbackMessage("Shipping estimate unavailable. Default courier will be used.");
      }

      if (result?.order?.id && shipmentResult?.shipment_id) {
        const currentMap = loadShipmentMap();
        currentMap[result.order.id] = {
          shipment_id: shipmentResult.shipment_id,
          tracking_id: shipmentResult.tracking_id,
          courier: selectedCourier?.courier || "Default Courier",
          eta: selectedCourier?.eta || "2 days",
          created_at: new Date().toISOString(),
        };
        persistShipmentMap(currentMap);
      }

      setOrderConfirmation({
        orderId: result?.order?.id,
        shipmentId: shipmentResult?.shipment_id || "Pending",
        trackingId: shipmentResult?.tracking_id || "Pending",
        courier: selectedCourier?.courier || "Default Courier",
        eta: selectedCourier?.eta || "2 days",
      });

      setItems([]);
      setMessage("Order placed successfully. Unlocking your garden reward...");
      if (onOrderPlaced) {
        onOrderPlaced({
          ...result,
          shipment: shipmentResult || result?.shipment,
        });
      }
    } catch (err) {
      setMessage(err.message || "Failed to place order");
    } finally {
      setPlacing(false);
    }
  }

  if (loading) {
    return <div className="loading-shell">Loading your cart…</div>;
  }

  return (
    <div className="my-listings-page">
      <div className="my-listings-header">
        <h3>Cart <span className="count">({items.length})</span></h3>
        <p className="my-listings-sub">Items you are preparing to order.</p>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="1.5">
            <rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8M12 17v4" />
          </svg>
          <p>Your cart is empty.</p>
          <span>Add a material from the marketplace detail page.</span>
        </div>
      ) : (
        <>
          <div className="my-listings-grid">
            {items.map((item) => (
              <div key={item.id} className="my-listing-card">
                <div className="my-listing-img">
                  <img src={item.image_url || FALLBACK_IMAGE} alt={item.title} />
                </div>
                <div className="my-listing-body">
                  <h4>{item.title}</h4>
                  <div className="card-footer-meta">
                    <div className="meta-item">
                      <span>Requested: {item.quantity}</span>
                    </div>
                    <div className="meta-item">
                      <span>Available: {item.available_quantity ?? "—"} {item.quantity_unit || ""}</span>
                    </div>
                    {item.location && (
                      <div className="meta-item">
                        <span>📍 {item.location}</span>
                      </div>
                    )}
                  </div>
                  <div className="my-listing-actions">
                    <button
                      className="my-listing-delete-btn"
                      onClick={() => handleRemove(item.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="dashboard-card" style={{ marginTop: 20 }}>
            <h4 style={{ marginBottom: 8 }}>Checkout Address (from profile)</h4>
            <p className="mini-note">{receiverDisplayAddress || "Address unavailable. Please update profile address."}</p>

            <div className="integration-card" style={{ marginTop: 10 }}>
              <h4>Address Details (DB)</h4>
              <p>Street: {receiverAddress.line || "—"}</p>
              <p>City: {receiverAddress.city || "—"}</p>
              <p>State: {receiverAddress.state || "—"}</p>
              <p>Country: {receiverAddress.country || "—"}</p>
              <p>Pincode: {receiverAddress.pincode || "—"}</p>
            </div>

            <div className="logistics-shipping-options">
              <h4>Shipping Options</h4>

              <div className="logistics-pincode-row">
                <label>
                  Pickup pincode
                  <input value={parsePincode(supplierAddress.pincode)} readOnly />
                </label>
                <label>
                  Delivery pincode
                  <input value={parsePincode(receiverAddress.pincode)} readOnly />
                </label>
              </div>

              <button
                type="button"
                className="nav-button nav-button-secondary"
                onClick={handleFetchShippingRates}
                disabled={shippingRatesLoading || !receiverDisplayAddress}
              >
                {shippingRatesLoading ? "Checking shipping rates…" : "Fetch Shipping Rates"}
              </button>

              {shippingFallbackMessage ? <p className="mini-note">{shippingFallbackMessage}</p> : null}

              {shippingRates.length > 0 ? (
                <div className="logistics-rates-list">
                  {shippingRates.map((rate, index) => (
                    <label key={`${rate.courier}-${index}`} className={`logistics-rate-item ${selectedCourierIndex === index ? "logistics-rate-item-selected" : ""}`}>
                      <input
                        type="radio"
                        checked={selectedCourierIndex === index}
                        onChange={() => setSelectedCourierIndex(index)}
                      />
                      <span>🚚 {rate.courier} — ₹{rate.price} — {rate.eta}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="mini-note">Shipping estimate unavailable. Default courier will be used.</p>
              )}
            </div>

            <div className="integration-card" style={{ marginTop: 12 }}>
              <h4>Coupon Redemption Progress</h4>
              <p className="mini-note">
                Plants progress: {couponProgress.currentPlants}/{couponProgress.targetPlants} plants
              </p>
              <div style={{ width: "100%", height: 10, background: "#1f2937", borderRadius: 999, overflow: "hidden", marginBottom: 8 }}>
                <div
                  style={{
                    width: `${couponProgress.percent}%`,
                    height: "100%",
                    background: "linear-gradient(90deg, #22c55e, #86efac)",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
              <p className="mini-note">{couponProgress.nextLabel} · Reuses: {couponProgress.currentExchanges}</p>

              <h4 style={{ marginTop: 12 }}>Coupon Wallet</h4>
              {couponWallet.length > 0 ? (
                <div className="logistics-rates-list">
                  {couponWallet.map((coupon) => (
                    <label key={coupon.code} className={`logistics-rate-item ${selectedCouponCode === coupon.code ? "logistics-rate-item-selected" : ""}`}>
                      <input
                        type="radio"
                        name="coupon-select"
                        checked={selectedCouponCode === coupon.code}
                        onChange={() => setSelectedCouponCode(coupon.code)}
                      />
                      <span>
                        🎟️ {coupon.code} — {(coupon.type || "coupon").replaceAll("_", " ")}
                        {coupon.value ? ` (${coupon.value}%/₹${coupon.value})` : ""}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="mini-note">No unlocked coupons yet.</p>
              )}

              <div className="logistics-pincode-row" style={{ marginTop: 8 }}>
                <label style={{ width: "100%" }}>
                  Or enter coupon code manually
                  <input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter coupon code"
                  />
                </label>
              </div>
            </div>

            <div className="integration-card" style={{ marginTop: 12 }}>
              <h4>Payment Method</h4>
              <div style={{ display: "grid", gap: 8 }}>
                <label className="logistics-rate-item" style={{ margin: 0 }}>
                  <input
                    type="radio"
                    name="payment-method"
                    checked={paymentMethod === "upi"}
                    onChange={() => setPaymentMethod("upi")}
                  />
                  <span>UPI</span>
                </label>
                <label className="logistics-rate-item" style={{ margin: 0 }}>
                  <input
                    type="radio"
                    name="payment-method"
                    checked={paymentMethod === "card"}
                    onChange={() => setPaymentMethod("card")}
                  />
                  <span>Credit/Debit Card</span>
                </label>
                <label className="logistics-rate-item" style={{ margin: 0 }}>
                  <input
                    type="radio"
                    name="payment-method"
                    checked={paymentMethod === "wallet"}
                    onChange={() => setPaymentMethod("wallet")}
                  />
                  <span>Wallet</span>
                </label>
              </div>
            </div>

            <button
              type="button"
              className="nav-button"
              style={{ marginTop: 12, alignSelf: "flex-start" }}
              onClick={handlePlaceOrder}
              disabled={placing || !receiverDisplayAddress}
            >
              {placing ? "Placing order…" : "Place Order"}
            </button>

            {orderConfirmation ? (
              <div className="integration-card" style={{ marginTop: 16 }}>
                <h4>Order Confirmed</h4>
                <p>Shipment ID: {orderConfirmation.shipmentId}</p>
                <p>Tracking ID: {orderConfirmation.trackingId}</p>
                <p>Courier: {orderConfirmation.courier}</p>
                <p>Estimated Delivery: {orderConfirmation.eta}</p>
              </div>
            ) : null}
          </div>
        </>
      )}

      {message && <p className="message" style={{ marginTop: 16 }}>{message}</p>}
    </div>
  );
}
