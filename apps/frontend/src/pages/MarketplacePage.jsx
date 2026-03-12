import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getMaterials } from "../api";
import { categories, conditions } from "../data/mockData";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80";
const POLL_INTERVAL = 10000; // 10 seconds — real-time updates

function ProductCard({ product, onSelect }) {
  return (
    <article className="product-card-v3" onClick={() => onSelect(product)}>
      <div className="card-image-content">
        <img src={product.image_url || FALLBACK_IMAGE} alt={product.title} />
        {product.condition && <span className="condition-badge">{product.condition}</span>}
        {product.category && <span className="category-chip">{product.category}</span>}
      </div>
      <div className="card-body-content">
        <h4>{product.title}</h4>
        {product.description && (
          <p className="card-desc">
            {product.description.slice(0, 72)}{product.description.length > 72 ? "…" : ""}
          </p>
        )}
        <div className="card-footer-meta">
          {product.quantity && (
            <div className="meta-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
              <span>{product.quantity} kg</span>
            </div>
          )}
          {product.location && (
            <div className="meta-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
              <span>{product.location}</span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default function MarketplacePage({ user, filters, onFilterChange, onSelectProduct, onCreateClick }) {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCondition, setActiveCondition] = useState("All");
  const pollRef = useRef(null);

  const fetchListings = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const { materials } = await getMaterials();
      setProducts(materials);
    } catch (err) {
      console.error("Failed to load materials", err);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  // Initial load + poll every 10s for real-time updates
  useEffect(() => {
    fetchListings(true);
    pollRef.current = setInterval(() => fetchListings(false), POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, []);

  const isSearching = filters.search.trim().length > 0;

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const q = filters.search.toLowerCase();
      const searchMatch = !q ||
        (product.title || "").toLowerCase().includes(q) ||
        (product.category || "").toLowerCase().includes(q) ||
        (product.description || "").toLowerCase().includes(q) ||
        (product.location || "").toLowerCase().includes(q);
      const categoryMatch = filters.category === "All" || product.category === filters.category;
      const conditionMatch = activeCondition === "All" || product.condition === activeCondition;
      return searchMatch && categoryMatch && conditionMatch;
    });
  }, [products, filters.search, filters.category, activeCondition]);

  return (
    <div className="marketplace-modern-container">

      {/* ── Top bar ── */}
      <header className="marketplace-top-nav">
        <div className="nav-brand-area">
          <div className="nav-logo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
            </svg>
            <span className="nav-logo-text">Circular Market</span>
          </div>
        </div>

        <div className="nav-search-area">
          <div className="modern-search-box">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              value={filters.search}
              onChange={e => onFilterChange("search", e.target.value)}
              placeholder="Search materials, location, category…"
            />
            {isSearching && (
              <button className="search-clear-btn" onClick={() => onFilterChange("search", "")}>✕</button>
            )}
          </div>
        </div>

        <div className="nav-actions-area">
          {user && (user.role === "seller" || user.role === "supplier") && (
            <button className="create-listing-btn" onClick={() => onCreateClick ? onCreateClick() : navigate("/create-listing")}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              List Material
            </button>
          )}
        </div>
      </header>

      {/* ── Inline search results ── */}
      {isSearching ? (
        <div className="search-results-panel">
          <div className="search-results-header">
            <p className="search-results-label">
              Results for <strong>"{filters.search}"</strong> — {filteredProducts.length} found
            </p>
            <button className="clear-search-link" onClick={() => onFilterChange("search", "")}>Clear search</button>
          </div>
          {filteredProducts.length === 0 ? (
            <div className="empty-state">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
              <p>No listings match your search.</p>
              <span>Try a different keyword or browse all listings.</span>
            </div>
          ) : (
            <div className="product-grid-v3">
              {filteredProducts.map(p => (
                <ProductCard 
                  key={p.id} 
                  product={p} 
                  onSelect={(product) => onSelectProduct ? onSelectProduct(product) : navigate(`/material/${product.id}`)} 
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* ── Category pills ── */}
          <nav className="category-pill-nav">
            {categories.map(cat => (
              <button
                key={cat}
                className={`pill-btn ${filters.category === cat ? "active" : ""}`}
                onClick={() => onFilterChange("category", cat)}
              >
                {cat}
              </button>
            ))}
          </nav>

          {/* ── Condition filter row ── */}
          <div className="condition-filter-row">
            <span className="filter-label">Condition:</span>
            {["All", ...conditions.filter(c => c !== "All")].map(cond => (
              <button
                key={cond}
                className={`condition-pill ${activeCondition === cond ? "active" : ""}`}
                onClick={() => setActiveCondition(cond)}
              >
                {cond}
              </button>
            ))}
          </div>

          {/* ── Listings ── */}
          {loading ? (
            <div className="loading-shell">Loading marketplace...</div>
          ) : (
            <section className="listings-section">
              <div className="listings-header">
                <div className="listings-title">
                  <h3>
                    {filters.category !== "All" ? filters.category : "All Listings"}
                    <span className="count"> ({filteredProducts.length})</span>
                  </h3>
                </div>
                <span className="live-indicator">
                  <span className="live-dot" />
                  Live
                </span>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="empty-state">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="1.5">
                    <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
                  </svg>
                  <p>No listings found.</p>
                  <span>Be the first to list a material in this category.</span>
                </div>
              ) : (
                <div className="product-grid-v3">
                  {filteredProducts.map(p => (
                    <ProductCard 
                      key={p.id} 
                      product={p} 
                      onSelect={(product) => onSelectProduct ? onSelectProduct(product) : navigate(`/material/${product.id}`)} 
                    />
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
