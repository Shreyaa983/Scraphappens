import { useState, useEffect } from "react";
import { useLocation, useParams, useNavigate, Link } from "react-router-dom";
import { createMaterial, updateMaterial, getMaterialById } from "../api";
import { categories, conditions } from "../data/mockData";

export default function CreateListing({ user, token }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [editItem, setEditItem] = useState(propEditItem || location.state?.editItem || null);
  const isEdit = Boolean(id || editItem);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!editItem && !!id);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    material_type: "",
    category: (categories[1] ?? ""),
    condition: (conditions[1] ?? ""),
    quantity: "",
    quantity_unit: "kg",
    location: "",
    image_url: "",
  });

  useEffect(() => {
    if (editItem) {
      setForm({
        title: editItem.title || "",
        description: editItem.description || "",
        material_type: editItem.material_type || "",
        category: editItem.category || (categories[1] ?? ""),
        condition: editItem.condition || (conditions[1] ?? ""),
        quantity: editItem.quantity || "",
        quantity_unit: editItem.quantity_unit || "kg",
        location: editItem.location || "",
        image_url: editItem.image_url || "",
      });
    } else if (id) {
      const fetchItem = async () => {
        try {
          setFetching(true);
          const data = await getMaterialById(id);
          setEditItem(data.material);
        } catch (err) {
          setError("Failed to fetch listing details.");
        } finally {
          setFetching(false);
        }
      };
      fetchItem();
    }
  }, [id, editItem]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
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
          onClick={() => navigate(-1)}
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

