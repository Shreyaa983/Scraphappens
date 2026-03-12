import React, { useState, useEffect } from "react";
import SuggestionCard from "../components/SuggestionCard";

function TrustBadge({ grade }) {
  return <span className={`trust-badge trust-badge-${grade.toLowerCase()}`}>Grade {grade}</span>;
}

export default function ProductDetailPage({ product, user, onBack, onCheckout }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const isSeller = user && (user.role === "seller" || user.role === "supplier");
  const canEdit = isSeller && user.email === product.ownerEmail;

  useEffect(() => {
    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/ai/product-ideas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productName: product.name })
        });
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      } catch (err) {
        console.error("Failed to fetch AI suggestions", err);
      } finally {
        setLoading(false);
      }
    };

    if (product.name) fetchSuggestions();
  }, [product.name]);

  return (
    <div className="page-stack">
      <div className="page-toolbar">
        <button type="button" className="nav-button nav-button-secondary" onClick={onBack}>← Back to Marketplace</button>
      </div>

      <section className="detail-layout">
        <div className="detail-gallery">
          <img src={product.gallery[0]} alt={product.name} className="detail-hero-image" />
          <div className="detail-thumbnail-row">
            {product.gallery.map((image, index) => (
              <img key={image} src={image} alt={`${product.name} ${index + 1}`} className="detail-thumb" />
            ))}
          </div>
        </div>

        <div className="dashboard-card detail-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Product detail</span>
              <h3>{product.name}</h3>
            </div>
            <TrustBadge grade={product.trustGrade} />
          </div>

          {/* ... Existing Product Info ... */}
          <p className="detail-subtext">{product.category} · {product.condition}</p>

          <div className="cta-row">
            <button className="submit-button" onClick={() => onCheckout(product)}>Buy Now</button>
          </div>
        </div>
      </section>

      {/* --- NEW AI SUGGESTIONS SECTION --- */}
      <section className="ai-suggestions-section" style={{ marginTop: "2rem" }}>
        <h4 style={{ marginBottom: "1rem" }}>✨ AI Upcycling Ideas for this item</h4>
        {loading ? (
          <p>Generating creative ideas...</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            {suggestions.map((text, index) => (
              <SuggestionCard key={index} text={text} index={index} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}