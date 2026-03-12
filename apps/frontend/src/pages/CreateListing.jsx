import { useState, useEffect } from "react";
import { useLocation, useParams, useNavigate, Link } from "react-router-dom";
import { createMaterial, updateMaterial, getMaterialById } from "../api";
import { categories, conditions } from "../data/mockData";

export default function CreateListing({ user, token, editItem: propEditItem, onBack }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [editItem, setEditItem] = useState(propEditItem || location.state?.editItem || null);
  const isEdit = Boolean(id || editItem);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!editItem && !!id);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: editItem?.title || "",
    description: editItem?.description || "",
    material_type: editItem?.material_type || "",
    category: editItem?.category || (categories[1] ?? ""),
    condition: editItem?.condition || (conditions[1] ?? ""),
    quantity: editItem?.quantity || "",
    quantity_unit: editItem?.quantity_unit || "kg",
    location: editItem?.location || "",
    image_url: editItem?.image_url || "",
    price: editItem?.price || "",
    is_free: editItem?.is_free || false,
    delivery_option: editItem?.delivery_option || "pickup_only",
    sustainability_impact: editItem?.sustainability_impact || "",
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (isEdit && editItem) {
        await updateMaterial(editItem.id, form, token);
      } else {
        await createMaterial(form, token);
      }
      navigate(-1);
    } catch (err) {
      setError(err.message || "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="marketplace-modern-container">
      <header className="marketplace-top-nav">
        <button
          className="nav-button nav-button-secondary"
          onClick={() => { if (onBack) onBack(); else navigate(-1); }}
          style={{ whiteSpace: "nowrap" }}
        >
          ← Back
        </button>
        <h2 style={{ color: "white", margin: 0, fontSize: "1.3rem" }}>
          {isEdit ? "Edit Listing" : "Create New Listing"}
        </h2>
        <Link to="/" className="nav-button nav-button-secondary" style={{ textDecoration: 'none' }}>Marketplace</Link>
      </header>

      <div className="dashboard-card" style={{ maxWidth: 680, margin: "0 auto", width: "100%" }}>
        {fetching && <div className="loading-shell">Loading listing details...</div>}
        {error && (
          <div style={{ color: "#ef4444", marginBottom: 16, padding: "12px 16px", background: "rgba(239,68,68,0.1)", borderRadius: 10 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 20 }}>
          <label>
            Title *
            <input required name="title" value={form.title} onChange={handleChange} placeholder="e.g., Reclaimed Oak Planks" />
          </label>

          <label>
            Material Type
            <input name="material_type" value={form.material_type} onChange={handleChange} placeholder="e.g., Wood, Fabric, Steel" />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <label>
              Category
              <select name="category" value={form.category} onChange={handleChange}>
                {categories.filter(c => c !== "All").map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              Condition
              <select name="condition" value={form.condition} onChange={handleChange}>
                {conditions.filter(c => c !== "All").map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>

          {/* Quantity + unit selector */}
          <label>
            Quantity
            <div style={{ display: "flex", gap: 10 }}>
              <input
                type="number"
                name="quantity"
                min="1"
                value={form.quantity}
                onChange={handleChange}
                placeholder="e.g., 200"
                style={{ flex: 1 }}
              />
              <select
                name="quantity_unit"
                value={form.quantity_unit}
                onChange={handleChange}
                style={{ width: 90 }}
              >
                <option value="kg">kg</option>
                <option value="units">units</option>
                <option value="litres">litres</option>
                <option value="meters">meters</option>
                <option value="tons">tons</option>
              </select>
            </div>
          </label>

          <label>
            Location / City
            <input name="location" value={form.location} onChange={handleChange} placeholder="e.g., Mumbai" />
          </label>

          {/* Price + free toggle */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <label>
              Price (₹)
              <input
                type="number"
                name="price"
                min="0"
                value={form.price}
                onChange={handleChange}
                placeholder="e.g., 500"
                disabled={form.is_free}
                style={{ opacity: form.is_free ? 0.5 : 1 }}
              />
            </label>
            <label style={{ justifyContent: "center" }}>
              Free / Donate
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                <input
                  type="checkbox"
                  name="is_free"
                  checked={form.is_free}
                  onChange={handleChange}
                  style={{ width: 18, height: 18, accentColor: "#22c55e", cursor: "pointer" }}
                />
                <span style={{ fontSize: "0.88rem", color: "#9ca3af" }}>Mark as free</span>
              </div>
            </label>
          </div>

          <label>
            Delivery Option
            <select name="delivery_option" value={form.delivery_option} onChange={handleChange}>
              <option value="pickup_only">Pickup Only</option>
              <option value="delivery_available">Delivery Available</option>
            </select>
          </label>

          <label>
            Sustainability Impact
            <input
              name="sustainability_impact"
              value={form.sustainability_impact}
              onChange={handleChange}
              placeholder="e.g., Saves 8 kg of waste from landfill"
            />
          </label>

          <label>
            Image URL
            <input type="url" name="image_url" value={form.image_url} onChange={handleChange} placeholder="https://example.com/image.jpg" />
          </label>

          <label>
            Description
            <textarea name="description" value={form.description} onChange={handleChange} rows="4" placeholder="Describe the material, quality, usage…" />
          </label>

          <button
            type="submit"
            className="create-listing-btn"
            disabled={loading}
            style={{ justifySelf: "start", padding: "13px 28px", fontSize: "1rem" }}
          >
            {loading ? (isEdit ? "Saving…" : "Publishing…") : (isEdit ? "Save Changes" : "Publish Listing")}
          </button>
        </form>
      </div>
    </div>
  );
}

