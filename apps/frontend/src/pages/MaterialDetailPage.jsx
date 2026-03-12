import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { addToCart, getProductSuggestions, getMaterialById } from "../api";
import SuggestionCard from "../components/SuggestionCard";
import ARModelViewer from "../components/ARModelViewer";

const FALLBACK_IMAGE =
    "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80";

const THUMB_FALLBACKS = [
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=400&q=70",
    "https://images.unsplash.com/photo-1564760055775-d63b17a55c44?auto=format&fit=crop&w=400&q=70",
    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=400&q=70",
];

function conditionToGrade(condition) {
    const map = { Excellent: "A", Good: "B", Fair: "C", Poor: "D" };
    return map[condition] ?? condition?.charAt(0) ?? "—";
}

export default function MaterialDetailPage({ material: initialMaterial, user, onBack, onEdit, onViewSupplier }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [material, setMaterial] = useState(initialMaterial);
    const [loading, setLoading] = useState(!initialMaterial && !!id);
    const [quantity, setQuantity] = useState(1);
    const [message, setMessage] = useState("");
    const [adding, setAdding] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [fetchingSuggestions, setFetchingSuggestions] = useState(false);
    const [showARModal, setShowARModal] = useState(false);

    useEffect(() => {
        if (!material && id) {
            const fetchMaterial = async () => {
                try {
                    setLoading(true);
                    const data = await getMaterialById(id);
                    setMaterial(data.material);
                } catch (err) {
                    console.error("Failed to fetch material", err);
                    setMessage("Failed to load material details.");
                } finally {
                    setLoading(false);
                }
            };
            fetchMaterial();
        }
    }, [id, material]);

    const handleBack = () => {
        if (onBack) onBack();
        else navigate(-1);
    };

    if (loading) return <div className="loading-shell">Loading material details...</div>;
    if (!material) return <div className="loading-shell">Material not found.</div>;
    if (!material) return null;

    const isOwner = user && String(material.listed_by) === String(user.id);
    const heroImg = material.image_url || FALLBACK_IMAGE;
    const grade = conditionToGrade(material.condition);

    const subtitle = [material.category, material.condition, material.location]
        .filter(Boolean)
        .join(" · ");

    const formattedDate = material.created_at
        ? new Date(material.created_at).toLocaleDateString("en-IN", {
            day: "numeric", month: "short", year: "numeric",
        })
        : null;

    const thumbLabels = [
        material.material_type || material.category || "Material",
        material.condition || "Grade",
        "Reuse Ready",
    ];


    const handleGetSuggestions = async () => {
        if (!material.title) return;
        setFetchingSuggestions(true);
        try {
            const data = await getProductSuggestions(material.title);
            setSuggestions(data.suggestions || []);
        } catch (err) {
            console.error("Failed to fetch AI suggestions", err);
            setMessage("Error fetching AI suggestions. Please check if backend is running.");
        } finally {
            setFetchingSuggestions(false);
        }
    };

    const handleAddToCart = async () => {
        setMessage("");
        const token = localStorage.getItem("token") || "";
        if (!token) {
            setMessage("Please log in to add items to your cart.");
            return;
        }
        if (!material.quantity || quantity <= 0) {
            setMessage("Invalid quantity selected.");
            return;
        }
        if (quantity > material.quantity) {
            setMessage("Requested quantity exceeds available stock.");
            return;
        }
        try {
            setAdding(true);
            await addToCart({ material_id: material.id, quantity }, token);
            setMessage("Added to cart.");
        } catch (err) {
            setMessage(err.message || "Failed to add to cart.");
        } finally {
            setAdding(false);
        }
    };

    return (
        <div className="detail-page">
            {/* Back button */}
            <button className="detail-back-btn" onClick={handleBack}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Back
            </button>

            <div className="detail-split">
                {/* ── LEFT: gallery ── */}
                <div className="detail-gallery">
                    <div className="detail-hero">
                        <img src={heroImg} alt={material.title} />
                        <div className="detail-hero-label">
                            {material.material_type || material.title}
                        </div>
                    </div>
                    <div className="detail-thumbs">
                        {THUMB_FALLBACKS.map((src, i) => (
                            <div key={i} className="detail-thumb">
                                <img src={material.image_url || src} alt={thumbLabels[i]} />
                                <span className="detail-thumb-label">{thumbLabels[i]}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── RIGHT: info panel ── */}
                <div className="detail-info">
                    <div className="detail-info-top">
                        <span className="detail-tag">Product detail</span>
                        {material.condition && (
                            <span className="detail-grade-badge">Grade {grade}</span>
                        )}
                    </div>

                    <h2 className="detail-title">{material.title}</h2>
                    {subtitle && <p className="detail-subtitle">{subtitle}</p>}

                    {/* Price badge */}
                    <div style={{ marginBottom: 16 }}>
                        {material.is_free ? (
                            <span style={{ fontSize: "1.6rem", fontWeight: 700, color: "#22c55e" }}>Free</span>
                        ) : material.price ? (
                            <span style={{ fontSize: "1.6rem", fontWeight: 700, color: "#f0fdf4" }}>
                                &#8377;{Number(material.price).toLocaleString("en-IN")}
                            </span>
                        ) : (
                            <span style={{ fontSize: "1rem", color: "#9ca3af" }}>Price not listed</span>
                        )}
                    </div>
                    <div className="detail-card">
                        <p className="detail-card-heading">Digital Material Passport</p>
                        <div className="detail-passport-grid">
                            <div>
                                <span className="detail-passport-label">Origin</span>
                                <span className="detail-passport-value">{material.location || "—"}</span>
                            </div>
                            <div>
                                <span className="detail-passport-label">
                                    {formattedDate ? "Listed" : "Category"}
                                </span>
                                <span className="detail-passport-value">
                                    {formattedDate || material.category || "—"}
                                </span>
                            </div>
                            {material.quantity && (
                            <div>
                                <span className="detail-passport-label">Quantity</span>
                                <span className="detail-passport-value">
                                    {material.quantity} {material.quantity_unit || "kg"}
                                </span>
                            </div>
                        )}
                            {material.material_type && (
                                <div>
                                    <span className="detail-passport-label">Material</span>
                                    <span className="detail-passport-value">{material.material_type}</span>
                                </div>
                            )}
                            {material.delivery_option && (
                                <div>
                                    <span className="detail-passport-label">Delivery</span>
                                    <span className="detail-passport-value">
                                        {material.delivery_option === "delivery_available" ? "Delivery Available" : "Pickup Only"}
                                    </span>
                                </div>
                            )}
                            {material.sustainability_impact && (
                                <div style={{ gridColumn: "span 2" }}>
                                    <span className="detail-passport-label">Sustainability Impact</span>
                                    <span className="detail-passport-value">{material.sustainability_impact}</span>
                                </div>
                            )}
                        </div>

                        {material.description && (
                            <div className="detail-passport-report">
                                <span className="detail-passport-label" style={{ display: "block", marginBottom: 6 }}>
                                    Description
                                </span>
                                <p className="detail-passport-desc">{material.description}</p>
                            </div>
                        )}
                    </div>

                    {/* Seller Info */}
                    <div className="detail-card">
                        <p className="detail-card-heading">Seller Info</p>
                        <p className="detail-seller-name">
                            {isOwner ? `${user.name} (you)` : "Verified Seller"}
                        </p>
                        <p className="detail-seller-sub">Listed on ScrapHappens · Circular Marketplace</p>
                    </div>

                    {/* Actions */}
                    <div className="detail-actions">
                        {isOwner ? (
                            <button className="detail-btn-primary" onClick={() => onEdit ? onEdit(material) : navigate(`/edit-listing/${material.id}`, { state: { editItem: material } })}>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                                Edit Listing
                            </button>
                        ) : (
                            <>
                                <div style={{ flex: 1, display: "flex", gap: 8 }}>
                                    <input
                                        type="number"
                                        min="1"
                                        max={material.quantity || undefined}
                                        value={quantity}
                                        onChange={(e) => setQuantity(Number(e.target.value) || 1)}
                                        style={{ maxWidth: 110 }}
                                    />
                                    <button className="detail-btn-primary" type="button" onClick={handleAddToCart} disabled={adding}>
                                        {adding ? "Adding…" : "Add to Cart"}
                                    </button>
                                </div>
                                <button
                                    className="detail-btn-secondary"
                                    type="button"
                                    onClick={() => setShowARModal(true)}
                                    style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="3" width="18" height="18" rx="2" />
                                        <path d="M9 11l3 3L22 4" />
                                    </svg>
                                    View in AR
                                </button>
                                <button
                                    className="detail-btn-secondary"
                                    type="button"
                                    onClick={() => onViewSupplier?.(material.listed_by || material.seller_id)}
                                    disabled={!material.listed_by && !material.seller_id}
                                >
                                    View Supplier
                                </button>
                            </>
                        )}
                    </div>

                    {message && (
                        <p className="message" style={{ marginTop: 10 }}>
                            {message}
                        </p>
                    )}
                </div>
            </div>

            {/* AR Modal */}
            <ARModelViewer
              material={material}
              isOpen={showARModal}
              onClose={() => setShowARModal(false)}
            />

            {/* --- AI SUGGESTIONS SECTION --- */}
            <section className="ai-suggestions-section" style={{ 
                marginTop: "4rem", 
                borderTop: "3px solid var(--color-border, #1a1a1a)", 
                paddingTop: "3rem",
                paddingBottom: "4rem",
                position: "relative"
            }}>
                <div style={{ 
                    display: "flex", 
                    flexWrap: "wrap",
                    alignItems: "center", 
                    gap: "24px",
                    marginBottom: "3rem" 
                }}>
                    <h3 style={{ 
                        margin: 0, 
                        color: "#000", 
                        flex: 1, 
                        minWidth: "250px", 
                        fontWeight: 500, 
                        fontSize: "1.8rem",
                        letterSpacing: "-0.5px"
                    }}>
                        AI Upcycling Ideas
                    </h3>
                    
                    {suggestions.length === 0 && !fetchingSuggestions && (
                        <button 
                            className="hero-button" 
                            onClick={handleGetSuggestions}
                            style={{ 
                                padding: "10px 24px", 
                                borderRadius: "14px", 
                                width: "fit-content",
                                fontSize: "0.95rem",
                                whiteSpace: "nowrap",
                                flexShrink: 0
                            }}
                        >
                            Get AI Suggestions
                        </button>
                    )}
                    
                    {suggestions.length > 0 && (
                        <button 
                            className="nav-button nav-button-secondary" 
                            onClick={() => setSuggestions([])}
                            style={{ padding: "8px 16px", fontSize: "0.85rem", width: "auto" }}
                        >
                            Clear Ideas
                        </button>
                    )}
                </div>
                
                {fetchingSuggestions ? (
                    <div className="loading-shell" style={{ margin: "2rem 0", background: "rgba(255,255,255,0.05)" }}>
                        Generating creative ideas using AI...
                    </div>
                ) : suggestions.length > 0 ? (
                    <div style={{ 
                        display: "grid", 
                        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", 
                        gap: "1.5rem" 
                    }}>
                        {suggestions.map((text, index) => (
                            <SuggestionCard key={index} text={text} index={index} />
                        ))}
                    </div>
                ) : (
                    <div style={{ 
                        textAlign: "center", 
                        padding: "3rem", 
                        background: "var(--color-bg-secondary, rgba(255,255,255,0.05))", 
                        borderRadius: "20px",
                        border: "2px dashed var(--color-border, #1a1a1a)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "16px"
                    }}>
                        <p style={{ color: "var(--color-text-secondary, #4a4a4a)", marginBottom: 0, fontSize: "1.1rem", fontWeight: 500 }}>
                            Want to give this material a new life?
                        </p>
                        <p style={{ color: "var(--color-text-light, #6b6b6b)", margin: 0, maxWidth: "500px" }}>
                            Our AI can suggest unique upcycling projects based on the material's properties. Click the button above to get inspired!
                        </p>
                    </div>
                )}
            </section>
        </div>
    );
}

