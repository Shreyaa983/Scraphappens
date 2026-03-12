import { useEffect, useState } from "react";
import { getCart, removeCartItem, placeOrder } from "../api";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80";

export default function CartPage({ token, onOrderPlaced }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [message, setMessage] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const { items: rows } = await getCart(token);
        setItems(rows);
      } catch (err) {
        console.error("Failed to load cart", err);
        setMessage(err.message || "Failed to load cart");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

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
    if (!shippingAddress.trim()) {
      setMessage("Please enter a shipping address.");
      return;
    }
    try {
      setPlacing(true);
      setMessage("");
      await placeOrder({ shipping_address: shippingAddress }, token);
      setItems([]);
      setShippingAddress("");
      setMessage("Order placed successfully.");
      if (onOrderPlaced) onOrderPlaced();
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
            <h4 style={{ marginBottom: 12 }}>Shipping address</h4>
            <textarea
              rows={3}
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              placeholder="Flat, street, city, pincode"
            />
            <button
              type="button"
              className="nav-button"
              style={{ marginTop: 12, alignSelf: "flex-start" }}
              onClick={handlePlaceOrder}
              disabled={placing}
            >
              {placing ? "Placing order…" : "Place Order"}
            </button>
          </div>
        </>
      )}

      {message && <p className="message" style={{ marginTop: 16 }}>{message}</p>}
    </div>
  );
}


