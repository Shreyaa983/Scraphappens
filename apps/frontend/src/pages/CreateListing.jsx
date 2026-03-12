import { useState, useEffect } from "react";
import { useLocation, useParams, useNavigate, Link } from "react-router-dom";
import { 
  ArrowLeft, 
  Package, 
  Tag, 
  Layers, 
  MapPin, 
  IndianRupee, 
  Truck, 
  Leaf, 
  Image as ImageIcon, 
  FileText, 
  CheckCircle,
  Clock,
  Layout
} from "lucide-react";
import { createMaterial, updateMaterial, getMaterialById } from "../api";
import { categories, conditions } from "../data/mockData";
import "../styles/listing-form.css";

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
      if (onBack) onBack(); else navigate(-1);
    } catch (err) {
      setError(err.message || "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="listing-form-container">
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          className="nav-button nav-button-secondary"
          onClick={() => { if (onBack) onBack(); else navigate(-1); }}
        >
          <ArrowLeft size={16} /> Back
        </button>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link to="/marketplace" className="nav-button nav-button-secondary" style={{ textDecoration: 'none' }}>
             Marketplace
          </Link>
        </div>
      </div>

      <div className="listing-form-card">
        <header className="listing-form-header">
          <h2 className="listing-form-title">
            <Layout size={24} color="hsl(var(--primary))" />
            {isEdit ? "Edit Your Listing" : "List New Material"}
          </h2>
          {isEdit && <span className="gsbar-status-chip">Editing ID: #{editItem?.id || id}</span>}
        </header>

        {fetching && (
          <div className="loading-shell">
            <Clock className="spin" style={{ marginBottom: '1rem' }} />
            <p>Loading listing details...</p>
          </div>
        )}

        {error && (
          <div className="message error" style={{ marginBottom: '2rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="listing-form-grid">
          {/* Title */}
          <div className="field-group full-width">
            <label className="field-label"><Tag size={16} /> Material Title *</label>
            <input 
              required 
              name="title" 
              className="listing-input"
              value={form.title} 
              onChange={handleChange} 
              placeholder="e.g., Reclaimed Oak Planks, Industrial Steel Pipes" 
            />
          </div>

          {/* Material Type */}
          <div className="field-group">
            <label className="field-label"><Layers size={16} /> Material Type</label>
            <input 
              name="material_type" 
              className="listing-input"
              value={form.material_type} 
              onChange={handleChange} 
              placeholder="e.g., Wood, Fabric, Metal" 
            />
          </div>

          {/* Location */}
          <div className="field-group">
            <label className="field-label"><MapPin size={16} /> Location / City</label>
            <input 
              name="location" 
              className="listing-input"
              value={form.location} 
              onChange={handleChange} 
              placeholder="e.g., Mumbai, Maharashtra" 
            />
          </div>

          {/* Category */}
          <div className="field-group">
            <label className="field-label"><Package size={16} /> Category</label>
            <select name="category" className="listing-select" value={form.category} onChange={handleChange}>
              {categories.filter(c => c !== "All").map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Condition */}
          <div className="field-group">
            <label className="field-label"><CheckCircle size={16} /> Condition</label>
            <select name="condition" className="listing-select" value={form.condition} onChange={handleChange}>
              {conditions.filter(c => c !== "All").map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Quantity */}
          <div className="field-group">
            <label className="field-label"><Layers size={16} /> Available Quantity</label>
            <div className="unit-input-group">
              <input
                type="number"
                name="quantity"
                className="listing-input"
                min="0"
                value={form.quantity}
                onChange={handleChange}
                placeholder="0.00"
              />
              <select
                name="quantity_unit"
                className="listing-select"
                value={form.quantity_unit}
                onChange={handleChange}
              >
                <option value="kg">kg</option>
                <option value="units">units</option>
                <option value="litres">litres</option>
                <option value="meters">meters</option>
                <option value="tons">tons</option>
              </select>
            </div>
          </div>

          {/* Delivery Option */}
          <div className="field-group">
            <label className="field-label"><Truck size={16} /> Delivery Option</label>
            <select name="delivery_option" className="listing-select" value={form.delivery_option} onChange={handleChange}>
              <option value="pickup_only">Pickup Only</option>
              <option value="delivery_available">Delivery Available</option>
            </select>
          </div>

          {/* Price */}
          <div className="field-group">
            <label className="field-label"><IndianRupee size={16} /> Expected Price (₹)</label>
            <div className="field-input-wrapper">
              <input
                type="number"
                name="price"
                className="listing-input"
                min="0"
                value={form.price}
                onChange={handleChange}
                placeholder="0.00"
                disabled={form.is_free}
              />
            </div>
          </div>

          {/* Free Toggle */}
          <div className="field-group">
            <label className="field-label">Pricing Type</label>
            <label className="checkbox-field">
              <input
                type="checkbox"
                name="is_free"
                checked={form.is_free}
                onChange={handleChange}
              />
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Mark as Free / Donation</span>
            </label>
          </div>

          {/* Sustainability Impact */}
          <div className="field-group full-width">
            <label className="field-label"><Leaf size={16} /> Sustainability Impact</label>
            <input
              name="sustainability_impact"
              className="listing-input"
              value={form.sustainability_impact}
              onChange={handleChange}
              placeholder="e.g., Saves 8 kg of waste from landfill"
            />
          </div>

          {/* Image URL */}
          <div className="field-group full-width">
            <label className="field-label"><ImageIcon size={16} /> Material Image URL</label>
            <input 
              type="url" 
              name="image_url" 
              className="listing-input"
              value={form.image_url} 
              onChange={handleChange} 
              placeholder="https://images.unsplash.com/your-image-url" 
            />
          </div>

          {/* Description */}
          <div className="field-group full-width">
            <label className="field-label"><FileText size={16} /> Detailed Description</label>
            <textarea 
              name="description" 
              className="listing-textarea"
              value={form.description} 
              onChange={handleChange} 
              rows="5" 
              placeholder="Describe the material source, exact dimensions, quality, and possible reuse ideas..." 
            />
          </div>

          {/* Submit */}
          <div className="form-actions full-width">
            <button
              type="submit"
              className="btn-primary publish-btn"
              disabled={loading}
            >
              {loading ? (
                <><Clock size={18} className="spin" /> {isEdit ? "Saving..." : "Publishing..."}</>
              ) : (
                <>{isEdit ? "Update Listing" : "Publish Material"}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

