import { useState, useEffect } from "react";
import { getMyMaterials, deleteMaterialById } from "../api";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80";

export default function MyListingsPage({ token, onEdit }) {
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
        if (!confirm("Delete this listing?")) return;
        setDeletingId(id);
        try {
            await deleteMaterialById(id, token);
            setListings(prev => prev.filter(l => l.id !== id));
        } catch (err) {
            alert("Failed to delete: " + err.message);
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) return <div className="loading-shell">Loading your listings…</div>;

    return (
        <div className="my-listings-page">
            <div className="my-listings-header">
                <h3>My Listings <span className="count">({listings.length})</span></h3>
                <p className="my-listings-sub">Only you can see, edit, or delete your listings here.</p>
            </div>

            {listings.length === 0 ? (
                <div className="empty-state">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="1.5">
                        <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
                    </svg>
                    <p>No listings yet.</p>
                    <span>Head to the Marketplace and click "List Material" to post one.</span>
                </div>
            ) : (
                <div className="my-listings-grid">
                    {listings.map(item => (
                        <div key={item.id} className="my-listing-card">
                            <div className="my-listing-img">
                                <img src={item.image_url || FALLBACK_IMAGE} alt={item.title} />
                                {item.condition && <span className="condition-badge">{item.condition}</span>}
                            </div>
                            <div className="my-listing-body">
                                <div className="my-listing-meta-top">
                                    {item.category && <span className="category-chip" style={{ position: "static", fontSize: "0.75rem" }}>{item.category}</span>}
                                    <span className="my-listing-date">
                                        {new Date(item.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                    </span>
                                </div>
                                <h4>{item.title}</h4>
                                {item.description && <p className="card-desc">{item.description.slice(0, 80)}{item.description.length > 80 ? "…" : ""}</p>}
                                <div className="card-footer-meta">
                                    {item.quantity && <div className="meta-item"><span>📦 {item.quantity} {item.quantity_unit || "kg"}</span></div>}
                                    {item.location && <div className="meta-item"><span>📍 {item.location}</span></div>}
                                </div>
                                <div className="my-listing-actions">
                                    <button className="my-listing-edit-btn" onClick={() => onEdit(item)}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                        </svg>
                                        Edit
                                    </button>
                                    <button
                                        className="my-listing-delete-btn"
                                        onClick={() => handleDelete(item.id)}
                                        disabled={deletingId === item.id}
                                    >
                                        {deletingId === item.id ? "Deleting…" : (
                                            <>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                                                </svg>
                                                Delete
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
