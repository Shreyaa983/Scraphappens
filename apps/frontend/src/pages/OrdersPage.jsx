import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyOrdersApi, getSellerOrdersApi } from "../api";
import ReviewForm from "../components/Marketplace/ReviewForm";
import TrackingMap from "../components/Logistics/TrackingMap";
import { buildTrackingRoute, getDefaultFallbackRoute } from "../services/geocodeService";
import { trackShipment } from "../services/logisticsApi";
import truckIconUrl from "../asessts/images/truck.png";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80";

const SHIPMENT_BY_ORDER_KEY = "shipmentByOrder";

function loadShipmentMap() {
  try {
    const raw = localStorage.getItem(SHIPMENT_BY_ORDER_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function buildTimelineSteps(statusText) {
  const status = String(statusText || "").toLowerCase();
  const base = [
    { key: "order_placed", label: "Order Placed", done: true },
    { key: "pickup_scheduled", label: "Pickup Scheduled", done: false },
    { key: "in_transit", label: "In Transit", done: false },
    { key: "out_for_delivery", label: "Out for Delivery", done: false },
    { key: "delivered", label: "Delivered", done: false },
  ];

  if (status.includes("pickup")) {
    base[1].done = true;
  }
  if (status.includes("transit")) {
    base[1].done = true;
    base[2].done = true;
  }
  if (status.includes("out")) {
    base[1].done = true;
    base[2].done = true;
    base[3].done = true;
  }
  if (status.includes("deliver")) {
    base.forEach((step) => {
      step.done = true;
    });
  }

  return base;
}

function normalizeTrackingStops(tracking) {
  const trackRows = tracking?.tracking_data?.shipment_track || tracking?.shipment_track || [];

  if (Array.isArray(trackRows) && trackRows.length > 0) {
    return trackRows.map((entry) => ({
      date: entry.date,
      status: entry.status || tracking?.shipment_status,
      location: entry.location || tracking?.current_location,
      name: entry.location || tracking?.current_location,
    }));
  }

  const fallbackRoute = getDefaultFallbackRoute();
  const finalStatus = tracking?.shipment_status || "In Transit";

  return fallbackRoute.map((stop, index) => ({
    date: null,
    status: index === fallbackRoute.length - 1 ? finalStatus : stop.status,
    location: stop.name,
    name: stop.name,
    coords: stop.coords,
  }));
}

export function BuyerOrdersPage({ token }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trackingByOrder, setTrackingByOrder] = useState({});
  const [trackingLoadingByOrder, setTrackingLoadingByOrder] = useState({});
  const [shipmentMap, setShipmentMap] = useState({});
  const [viewByOrder, setViewByOrder] = useState({});
  const [reviewSubmittedByOrder, setReviewSubmittedByOrder] = useState({});
  const [reviewOpenByOrder, setReviewOpenByOrder] = useState({});

  useEffect(() => {
    setShipmentMap(loadShipmentMap());

    async function load() {
      try {
        const { orders: rows } = await getMyOrdersApi(token);
        setOrders(rows);
      } catch (err) {
        console.error("Failed to load buyer orders", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  if (loading) return <div className="loading-shell">Loading your orders…</div>;

  async function handleTrack(orderId) {
    const shipment = shipmentMap[orderId];
    const shipmentId = shipment?.shipment_id;
    if (!shipmentId) {
      return;
    }

    try {
      setTrackingLoadingByOrder((prev) => ({ ...prev, [orderId]: true }));
      const tracking = await trackShipment(shipmentId, token);

      const routeResult = await buildTrackingRoute(normalizeTrackingStops(tracking));

      setTrackingByOrder((prev) => ({
        ...prev,
        [orderId]: {
          ...tracking,
          courier: shipment?.courier || "Default Courier",
          routeStops: routeResult.stops,
          routeFallbackUsed: routeResult.usedFallback,
        },
      }));
    } catch (error) {
      const routeResult = await buildTrackingRoute(getDefaultFallbackRoute());
      setTrackingByOrder((prev) => ({
        ...prev,
        [orderId]: {
          shipment_status: "Tracking unavailable",
          current_location: "Unknown",
          expected_delivery: "Unknown",
          courier: shipment?.courier || "Default Courier",
          routeStops: routeResult.stops,
          routeFallbackUsed: true,
          error: error.message,
        },
      }));
    } finally {
      setTrackingLoadingByOrder((prev) => ({ ...prev, [orderId]: false }));
    }
  }

  function canShowReviewForm(order) {
    const status = String(order?.status || "").toLowerCase();
    const isDeliveredOrCompleted = status.includes("deliver") || status.includes("complete");
    return isDeliveredOrCompleted && !reviewSubmittedByOrder[order.id] && Array.isArray(order.items) && order.items.length > 0;
  }

  function getStatusMeta(statusText) {
    const status = String(statusText || "").toLowerCase();
    if (status.includes("cancel")) return { label: "Cancelled", className: "status-cancelled" };
    if (status.includes("deliver") || status.includes("complete")) return { label: "Delivered", className: "status-delivered" };
    if (status.includes("ship") || status.includes("transit") || status.includes("out")) return { label: "Shipped", className: "status-shipped" };
    return { label: "Pending", className: "status-pending" };
  }

  return (
    <div className="my-orders-page">
      <div className="my-orders-header">
        <h3>
          My Orders <span className="my-orders-count">({orders.length})</span>
        </h3>
        <p>Track your purchases and leave reviews after delivery.</p>
      </div>

      {orders.length === 0 ? (
        <div className="my-orders-empty">
          <p>You haven't placed any orders yet.</p>
          <Link to="/" className="inline-link-button">Browse Marketplace</Link>
        </div>
      ) : (
        <div className="my-orders-list">
          {orders.map((order) => (
            <article key={order.id} className="order-card">
              {(() => {
                const showReviewForm = canShowReviewForm(order);
                const firstSellerId = order.items?.[0]?.seller?.id;
                const statusMeta = getStatusMeta(order.status);
                const isReviewOpen = Boolean(reviewOpenByOrder[order.id]);
                return (
                  <>
                    <header className="order-card-header">
                      <div>
                        <p className="order-label">Order #{order.id.slice(0, 8)}</p>
                        <p className="order-date">
                          {new Date(order.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <span className={`order-status-badge ${statusMeta.className}`}>Status: {statusMeta.label}</span>
                    </header>

                    <section className="order-card-shipping">
                      <div>
                        <p className="order-section-label">Shipping Address</p>
                        <p className="order-section-value">{order.shipping_address || "—"}</p>
                      </div>
                      <div>
                        <p className="order-section-label">Shipment ID</p>
                        <p className="order-shipment-id">{shipmentMap[order.id]?.shipment_id || "Not attached yet"}</p>
                      </div>
                    </section>

                    <section className="order-products">
                      {order.items.map((it) => (
                        <article key={it.id} className="order-product-row">
                          <img src={it.image_url || FALLBACK_IMAGE} alt={it.material_title} />
                          <div className="order-product-copy">
                            <Link to={`/material/${it.material_id}`} className="order-product-title-link">
                              <h4>{it.material_title}</h4>
                            </Link>
                            <p>Quantity: {it.quantity}</p>
                            <p>Seller: {it.seller.name}</p>
                          </div>
                        </article>
                      ))}
                    </section>

                    <footer className="order-actions">
                      {!showReviewForm ? (
                        <button
                          className="order-action-track"
                          disabled={!shipmentMap[order.id]?.shipment_id || trackingLoadingByOrder[order.id]}
                          onClick={() => handleTrack(order.id)}
                        >
                          {trackingLoadingByOrder[order.id] ? "Tracking…" : "Track Shipment"}
                        </button>
                      ) : (
                        <div className="order-review-eligible">
                          <p>This order has been delivered. Leave a review to help other buyers.</p>
                          <button
                            type="button"
                            className="order-action-review"
                            onClick={() =>
                              setReviewOpenByOrder((prev) => ({ ...prev, [order.id]: !prev[order.id] }))
                            }
                          >
                            {isReviewOpen ? "Hide Review Form" : "Leave Review"}
                          </button>
                        </div>
                      )}
                    </footer>

                    {trackingByOrder[order.id] ? (
                      <section className="order-tracking-panel">
                        <div className="tracking-view-toggle">
                          <button
                            type="button"
                            className={`tracking-toggle-btn ${!viewByOrder[order.id] || viewByOrder[order.id] === "timeline" ? "active" : ""}`}
                            onClick={() => setViewByOrder((prev) => ({ ...prev, [order.id]: "timeline" }))}
                          >
                            Timeline View
                          </button>
                          <button
                            type="button"
                            className={`tracking-toggle-btn ${viewByOrder[order.id] === "map" ? "active" : ""}`}
                            onClick={() => setViewByOrder((prev) => ({ ...prev, [order.id]: "map" }))}
                          >
                            Map View
                          </button>
                        </div>

                        {!viewByOrder[order.id] || viewByOrder[order.id] === "timeline" ? (
                          <>
                            <p>Current Status: {trackingByOrder[order.id].shipment_status || "Unknown"}</p>
                            <p>Courier: {trackingByOrder[order.id].courier || "Default Courier"}</p>
                            <p>Current Location: {trackingByOrder[order.id].current_location || "Unknown"}</p>
                            <p>Estimated Delivery: {trackingByOrder[order.id].expected_delivery || "Unknown"}</p>

                            <div className="logistics-timeline">
                              {buildTimelineSteps(trackingByOrder[order.id].shipment_status).map((step) => (
                                <div key={`${order.id}-${step.key}`} className={`logistics-timeline-step ${step.done ? "done" : ""}`}>
                                  <span className="dot" />
                                  <span>{step.label}</span>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <>
                            {trackingByOrder[order.id].routeFallbackUsed ? (
                              <p className="mini-note">Map route is using fallback coordinates.</p>
                            ) : null}
                            <TrackingMap
                              stops={trackingByOrder[order.id].routeStops || []}
                              currentStatus={trackingByOrder[order.id].shipment_status}
                              truckIconUrl={truckIconUrl}
                            />
                          </>
                        )}

                        {trackingByOrder[order.id].error ? <p className="mini-note">{trackingByOrder[order.id].error}</p> : null}
                      </section>
                    ) : null}

                    {showReviewForm && isReviewOpen ? (
                      <section className="order-review-panel">
                        <h4>Leave Review</h4>
                        <ReviewForm
                          orderId={order.id}
                          sellerId={firstSellerId}
                          token={token}
                          onSubmitted={() => {
                            setReviewSubmittedByOrder((prev) => ({ ...prev, [order.id]: true }));
                            setReviewOpenByOrder((prev) => ({ ...prev, [order.id]: false }));
                          }}
                        />
                      </section>
                    ) : null}
                  </>
                );
              })()}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export function SellerOrdersPage({ token }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { items: rows } = await getSellerOrdersApi(token);
        setItems(rows);
      } catch (err) {
        console.error("Failed to load seller orders", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  if (loading) return <div className="loading-shell">Loading seller orders…</div>;

  return (
    <div className="my-listings-page">
      <div className="my-listings-header">
        <h3>Seller Orders <span className="count">({items.length})</span></h3>
        <p className="my-listings-sub">Orders that include your listed materials.</p>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <p>No seller orders yet.</p>
          <span>Once buyers place orders on your <Link to="/my-listings" className="inline-link-button">listings</Link>, they will appear here.</span>
        </div>
      ) : (
        <div className="my-listings-grid">
          {items.map((item) => (
            <div key={item.id} className="my-listing-card">
              <div className="my-listing-img">
                <img src={item.material.image_url || FALLBACK_IMAGE} alt={item.material.title} />
              </div>
              <div className="my-listing-body">
                <div className="my-listing-meta-top">
                  <span className="category-chip" style={{ position: "static", fontSize: "0.75rem" }}>
                    Order #{item.order_id.slice(0, 8)}
                  </span>
                  <span className="my-listing-date">
                    {new Date(item.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <Link to={`/material/${item.material.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <h4>{item.material.title}</h4>
                </Link>
                <p className="card-desc">
                  Buyer: {item.buyer.name} ({item.buyer.email})
                </p>
                <div className="card-footer-meta">
                  <div className="meta-item">
                    <span>Qty: {item.quantity}</span>
                  </div>
                  <div className="meta-item">
                    <span>Status: {item.status}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
