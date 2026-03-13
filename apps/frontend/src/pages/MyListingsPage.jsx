import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Edit3,
  Trash2,
  Package,
  MapPin,
  Calendar,
  ShoppingBag,
  Plus,
  Layout,
  Info
} from "lucide-react";
import { getMyMaterials, deleteMaterialById } from "../api";
import { useTranslation } from "../hooks/useTranslation";
import "../styles/my-listings.css";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80";

export default function MyListingsPage({ token }) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);

    const load = async () => {
        try {
            const { materials } = await getMyMaterials(token);
            setListings(materials);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleDelete = async (id) => {
        if (!confirm(t("Are you sure you want to delete this listing? This action cannot be undone."))) return;
        setDeletingId(id);
        try {
            await deleteMaterialById(id, token);
            setListings(prev => prev.filter(l => l.id !== id));
        } catch (err) {
            alert(t("Failed to delete") + ": " + err.message);
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) return (
        <div className="loading-shell" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="spin">📦</div>
            <p>{t("Gathering your materials...")}</p>
        </div>
    );

    return (
        <div className="my-listings-container">
            <header className="my-listings-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <h2 className="my-listings-title">
                        <Layout size={28} color="hsl(var(--primary))" />
                        {t("My Inventory")}
                        <span className="count">{listings.length}</span>
                    </h2>
                    <Link to="/create-listing" className="btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}>
                        <Plus size={18} /> {t("List Material")}
                    </Link>
                </div>
                <p className="my-listings-sub">{t("Manage your posted materials and track their status in the ecosystem.")}</p>
            </header>

            {listings.length === 0 ? (
                <div className="empty-state" style={{ padding: '4rem 2rem' }}>
                    <ShoppingBag size={48} color="#94a3b8" style={{ marginBottom: '1.5rem' }} />
                    <p style={{ fontSize: '1.25rem' }}>{t("Your inventory is empty")}</p>
                    <span style={{ display: 'block', marginBottom: '2rem' }}>{t("Ready to contribute to the circular economy? List your first material today.")}</span>
                    <Link to="/create-listing" className="btn-primary" style={{ textDecoration: 'none', padding: '12px 30px' }}>
                        {t("Create First Listing")}
                    </Link>
                </div>
            ) : (
                <div className="my-listings-grid">
                    {listings.map(item => (
                        <div key={item.id} className="my-listing-card">
                            <div className="my-listing-img-wrap">
                                <img src={item.image_url || FALLBACK_IMAGE} alt={t(item.title)} />
                                {item.condition && <span className="my-listing-status">{t(item.condition)}</span>}
                            </div>

                            <div className="my-listing-body">
                                <div className="my-listing-meta-row">
                                    <span className="my-listing-category">{t(item.category) || t("Uncategorized")}</span>
                                    <span className="my-listing-date">
                                        <Calendar size={12} style={{ marginRight: 4 }} />
                                        {new Date(item.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                    </span>
                                </div>

                                <h3 className="my-listing-title">{t(item.title)}</h3>

                                <div className="my-listing-chips">
                                    {item.quantity && (
                                        <span className="my-listing-chip">
                                            <Package size={14} /> {item.quantity} {t(item.quantity_unit) || "kg"}
                                        </span>
                                    )}
                                    {item.location && (
                                        <span className="my-listing-chip">
                                            <MapPin size={14} /> {t(item.location)}
                                        </span>
                                    )}
                                    {item.is_free ? (
                                        <span className="my-listing-chip" style={{ color: '#059669', background: '#d1fae5', borderColor: '#6ee7b7' }}>{t("Free")}</span>
                                    ) : (
                                        <span className="my-listing-chip" style={{ color: 'hsl(var(--primary))' }}>₹{item.price}</span>
                                    )}
                                </div>

                                <div className="my-listing-actions">
                                    <button
                                        className="action-btn edit-btn"
                                        onClick={() => navigate(`/edit-listing/${item.id}`, { state: { editItem: item } })}
                                    >
                                        <Edit3 size={16} /> {t("Edit")}
                                    </button>
                                    <button
                                        className="action-btn delete-btn"
                                        onClick={() => handleDelete(item.id)}
                                        disabled={deletingId === item.id}
                                    >
                                        {deletingId === item.id ? (
                                            "..."
                                        ) : (
                                            <>
                                                <Trash2 size={16} /> {t("Delete")}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
