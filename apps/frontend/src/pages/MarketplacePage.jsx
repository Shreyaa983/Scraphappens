import { buyerHomeCards, categories, conditions, marketplaceProducts, supplierHomeCards } from "../data/mockData";

function TrustBadge({ grade }) {
  return <span className={`trust-badge trust-badge-${grade.toLowerCase()}`}>Grade {grade}</span>;
}

export default function MarketplacePage({ user, filters, onFilterChange, onSelectProduct }) {
  const filteredProducts = marketplaceProducts.filter((product) => {
    const searchMatch = !filters.search || `${product.name} ${product.category}`.toLowerCase().includes(filters.search.toLowerCase());
    const categoryMatch = filters.category === "All" || product.category === filters.category;
    const conditionMatch = filters.condition === "All" || product.condition === filters.condition;
    const distanceMatch = product.distanceKm <= filters.distance;

    return searchMatch && categoryMatch && conditionMatch && distanceMatch;
  });

  return (
    <div className="page-stack">
      <section className="dashboard-card hero-summary-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Unified Home</span>
            <h3>{user.role === "supplier" ? "Seller View" : user.role === "buyer" ? "Buyer View" : "Community View"}</h3>
          </div>
          <span className="section-tag">Marketplace</span>
        </div>

        {user.role === "supplier" ? (
          <div className="stats-grid stats-grid-inline">
            {supplierHomeCards.map((card) => (
              <article key={card.title} className="stat-card">
                <span>{card.title}</span>
                <strong>{card.value}</strong>
              </article>
            ))}
          </div>
        ) : (
          <div className="dashboard-panels panels-inline">
            {buyerHomeCards.map((card) => (
              <article key={card.title} className="market-card">
                <h4>{card.title}</h4>
                <p>{card.text}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="marketplace-layout">
        <aside className="dashboard-card filter-panel">
          <div className="section-heading">
            <h3>Filters</h3>
            <span className="section-tag">AI + Location</span>
          </div>

          <label>
            Search materials
            <input
              value={filters.search}
              onChange={(event) => onFilterChange("search", event.target.value)}
              placeholder="Try oak, textile, panels..."
            />
          </label>

          <label>
            Category
            <select value={filters.category} onChange={(event) => onFilterChange("category", event.target.value)}>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </label>

          <label>
            Condition
            <select value={filters.condition} onChange={(event) => onFilterChange("condition", event.target.value)}>
              {conditions.map((condition) => (
                <option key={condition} value={condition}>{condition}</option>
              ))}
            </select>
          </label>

          <label>
            Distance radius: {filters.distance} km
            <input
              type="range"
              min="5"
              max="60"
              step="1"
              value={filters.distance}
              onChange={(event) => onFilterChange("distance", Number(event.target.value))}
            />
          </label>

          <div className="mini-note">
            Location-aware filtering is scaffolded here for future Maps/Location API hookup.
          </div>
        </aside>

        <section className="product-grid">
          {filteredProducts.map((product) => (
            <article
              key={product.id}
              className="product-card"
              onClick={() => onSelectProduct(product)}
              onKeyDown={(event) => event.key === "Enter" && onSelectProduct(product)}
              role="button"
              tabIndex={0}
            >
              <img src={product.image} alt={product.name} className="product-image" />
              <div className="product-body">
                <div className="product-header-row">
                  <h3>{product.name}</h3>
                  <TrustBadge grade={product.trustGrade} />
                </div>
                <p>{product.category} · {product.condition}</p>
                <div className="product-meta-row">
                  <span>{product.distanceKm} km away</span>
                  <button type="button" className="inline-link-button">View details</button>
                </div>
              </div>
            </article>
          ))}
        </section>
      </section>
    </div>
  );
}
