import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { 
  ShoppingCart, 
  Trash2, 
  MapPin, 
  Package, 
  Truck, 
  Ticket, 
  CreditCard, 
  ArrowRight, 
  CheckCircle, 
  ShoppingBag,
  Info,
  ChevronRight,
  Clock
} from "lucide-react";
import { getCart, placeOrder, removeCartItem } from "../api";
import { createShipment, getShippingRates } from "../services/logisticsApi";
import "../styles/cart.css";

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

// Dummy functions to prevent errors if Rewards API is not defined globally (mapping to what was there or expected)
const getAchievementProgressApi = () => Promise.resolve({});
const getMyCouponsApi = () => Promise.resolve({ coupons: [] });
const getMyCircularScoreApi = () => Promise.resolve({ score: {} });

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
          // Note: In real app these would be imported from ../api
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
    return (
      <div className="loading-shell">
        <Clock className="spin" style={{ marginBottom: "1rem" }} />
        <p>Loading your cart…</p>
      </div>
    );
  }

  return (
    <div className="cart-page-container">
      {items.length === 0 ? (
        <div className="cart-empty-state">
          <div className="empty-icon">
            <ShoppingBag size={80} strokeWidth={1} />
          </div>
          <h2 className="empty-title">Your cart is empty</h2>
          <p className="empty-text">Looks like you haven't added any materials to your cart yet.</p>
          <Link to="/" className="btn-primary">
            Explore Marketplace <ArrowRight size={18} style={{ marginLeft: 8 }} />
          </Link>
        </div>
      ) : (
        <>
          <div className="cart-items-section">
            <div className="section-header" style={{ marginBottom: "1.5rem" }}>
              <h2 style={{ display: "flex", alignItems: "center", gap: "12px", margin: 0 }}>
                <ShoppingCart size={28} /> Cart <span className="count">({items.length})</span>
              </h2>
              <p style={{ color: "var(--color-text-secondary)", marginTop: "4px" }}>Items you are preparing to order.</p>
            </div>

            {items.map((item) => (
              <div key={item.id} className="cart-item-card">
                <div className="cart-item-image">
                  <img src={item.image_url || FALLBACK_IMAGE} alt={item.title} />
                </div>
                <div className="cart-item-details">
                  <div className="cart-item-header">
                    <h4 className="cart-item-title">{item.title}</h4>
                  </div>
                  <div className="cart-item-meta">
                    <div className="cart-meta-chip">
                      <Package size={14} /> 
                      <span>Requested: {item.quantity}</span>
                    </div>
                    <div className="cart-meta-chip">
                      <Info size={14} />
                      <span>Available: {item.available_quantity ?? "—"} {item.quantity_unit || ""}</span>
                    </div>
                    {item.location && (
                      <div className="cart-meta-chip">
                        <MapPin size={14} />
                        <span>{item.location}</span>
                      </div>
                    )}
                  </div>
                  <div className="cart-item-actions">
                    <button
                      className="remove-item-btn"
                      onClick={() => handleRemove(item.id)}
                    >
                      <Trash2 size={16} /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="checkout-sidebar">
            <div className="summary-card">
              <h3 className="summary-title">
                <ShoppingCart size={20} /> Order Summary
              </h3>

              {/* Delivery Address Section */}
              <div className="summary-section">
                <div className="section-label">
                  <MapPin size={16} /> Delivery Address
                </div>
                {receiverDisplayAddress ? (
                  <div className="address-preview">
                    <strong>{user?.name || "Member"}</strong>
                    <p>{receiverAddress.line}</p>
                    <p>{receiverAddress.city}, {receiverAddress.state} - {receiverAddress.pincode}</p>
                  </div>
                ) : (
                  <p className="mini-note error-text">Address unavailable. Please update profile address.</p>
                )}
              </div>

              {/* Shipping Section */}
              <div className="summary-section">
                <div className="section-label">
                  <Truck size={16} /> Shipping Method
                </div>
                
                <button
                  type="button"
                  className="btn-secondary fetch-rates-btn"
                  onClick={handleFetchShippingRates}
                  disabled={shippingRatesLoading || !receiverDisplayAddress}
                >
                  {shippingRatesLoading ? (
                    <><Clock size={16} className="spin" /> Updating...</>
                  ) : (
                    <>Calculate Shipping</>
                  )}
                </button>

                {shippingRates.length > 0 ? (
                  <div className="rates-container">
                    {shippingRates.map((rate, index) => (
                      <label 
                        key={`${rate.courier}-${index}`} 
                        className={`rate-option ${selectedCourierIndex === index ? "selected" : ""}`}
                      >
                        <input
                          type="radio"
                          checked={selectedCourierIndex === index}
                          onChange={() => setSelectedCourierIndex(index)}
                        />
                        <div className="rate-details">
                          <span className="rate-name">{rate.courier}</span>
                          <span className="rate-price-eta">₹{rate.price} • {rate.eta}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="address-preview">
                    <p className="mini-note">Click "Calculate Shipping" to see available options.</p>
                  </div>
                )}
                {shippingFallbackMessage && <p className="mini-note" style={{ marginTop: 8 }}>{shippingFallbackMessage}</p>}
              </div>

              {/* Coupons & Rewards Section */}
              <div className="summary-section">
                <div className="section-label">
                  <Ticket size={16} /> Rewards & Coupons
                </div>
                
                <div className="coupon-progress-wrapper">
                  <div className="progress-info">
                    <span>{couponProgress.nextLabel}</span>
                    <span>{couponProgress.percent.toFixed(0)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${couponProgress.percent}%` }} />
                  </div>
                  <p className="mini-note">
                    {couponProgress.currentPlants}/{couponProgress.targetPlants} plants planted
                  </p>
                </div>

                {couponWallet.length > 0 && (
                  <div className="coupon-grid">
                    {couponWallet.map((coupon) => (
                      <label 
                        key={coupon.code} 
                        className={`rate-option ${selectedCouponCode === coupon.code ? "selected" : ""}`}
                        style={{ padding: "8px 12px" }}
                      >
                        <input
                          type="radio"
                          name="coupon-select"
                          checked={selectedCouponCode === coupon.code}
                          onChange={() => setSelectedCouponCode(coupon.code)}
                        />
                        <div className="rate-details">
                          <span className="rate-name">{coupon.code}</span>
                          <span className="rate-price-eta">
                            Bonus unlocked via {coupon.type?.replaceAll("_", " ") || "activity"}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                <div style={{ marginTop: "12px" }}>
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter manual coupon"
                    style={{ fontSize: "0.85rem", padding: "8px 12px" }}
                  />
                </div>
              </div>

              {/* Payment Section */}
              <div className="summary-section">
                <div className="section-label">
                  <CreditCard size={16} /> Payment Method
                </div>
                <div className="payment-grid">
                  <label className={`payment-option ${paymentMethod === "upi" ? "selected" : ""}`}>
                    <input
                      type="radio"
                      name="payment-method"
                      checked={paymentMethod === "upi"}
                      onChange={() => setPaymentMethod("upi")}
                    />
                    <span className="rate-name">UPI (PhonePe, GPay)</span>
                  </label>
                  <label className={`payment-option ${paymentMethod === "card" ? "selected" : ""}`}>
                    <input
                      type="radio"
                      name="payment-method"
                      checked={paymentMethod === "card"}
                      onChange={() => setPaymentMethod("card")}
                    />
                    <span className="rate-name">Credit / Debit Card</span>
                  </label>
                </div>
              </div>

              {message && (
                <div className={`message ${message.includes("success") ? "success" : "error"}`} style={{ fontSize: "0.85rem" }}>
                  {message}
                </div>
              )}

              <button
                type="button"
                className="btn-primary place-order-btn"
                onClick={handlePlaceOrder}
                disabled={placing || !receiverDisplayAddress}
              >
                {placing ? (
                  <><Clock size={18} className="spin" /> Processing...</>
                ) : (
                  <>Place Order <ChevronRight size={18} /></>
                )}
              </button>

              {orderConfirmation && (
                <div className="confirmation-card">
                  <h4 style={{ color: "#166534", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <CheckCircle size={18} /> Order Confirmed!
                  </h4>
                  <div className="conf-row">
                    <span className="conf-label">Shipment ID:</span>
                    <span className="conf-value">{orderConfirmation.shipmentId}</span>
                  </div>
                  <div className="conf-row">
                    <span className="conf-label">Tracking ID:</span>
                    <span className="conf-value">{orderConfirmation.trackingId}</span>
                  </div>
                  <div className="conf-row">
                    <span className="conf-label">Courier:</span>
                    <span className="conf-value">{orderConfirmation.courier}</span>
                  </div>
                  <div className="conf-row">
                    <span className="conf-label">Delivery:</span>
                    <span className="conf-value">{orderConfirmation.eta}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
