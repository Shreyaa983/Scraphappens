import { useEffect, useState } from "react";
import { getMyOrdersApi, getSellerOrdersApi } from "../api";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80";

export function BuyerOrdersPage({ token }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  return (
    <div className="my-listings-page">
      <div className="my-listings-header">
        <h3>My Orders <span className="count">({orders.length})</span></h3>
        <p className="my-listings-sub">Orders you have placed as a buyer.</p>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">
          <p>No orders yet.</p>
          <span>Add items to your cart and place an order from the marketplace.</span>
        </div>
      ) : (
        <div className="my-listings-grid">
          {orders.map((order) => (
            <div key={order.id} className="my-listing-card">
              <div className="my-listing-body">
                <div className="my-listing-meta-top">
                  <span className="category-chip" style={{ position: "static", fontSize: "0.75rem" }}>
                    Order #{order.id.slice(0, 8)}
                  </span>
                  <span className="my-listing-date">
                    {new Date(order.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <h4>Status: {order.status}</h4>
                <p className="card-desc">
                  Shipping to: {order.shipping_address || "—"}
                </p>
                <div className="card-footer-meta">
                  <div className="meta-item">
                    <span>{order.items.length} item(s)</span>
                  </div>
                </div>
                <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                  {order.items.map((it) => (
                    <div key={it.id} className="market-card" style={{ padding: 10, borderRadius: 10 }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <img
                          src={it.image_url || FALLBACK_IMAGE}
                          alt={it.material_title}
                          style={{ width: 52, height: 52, borderRadius: 12, objectFit: "cover" }}
                        />
                        <div>
                          <p style={{ margin: 0, fontWeight: 600 }}>{it.material_title}</p>
                          <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>
                            Qty: {it.quantity} · Seller: {it.seller.name}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
          <span>Once buyers place orders on your listings, they will appear here.</span>
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
                <h4>{item.material.title}</h4>
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


