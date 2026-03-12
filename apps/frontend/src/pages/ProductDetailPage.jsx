function TrustBadge({ grade }) {
  return <span className={`trust-badge trust-badge-${grade.toLowerCase()}`}>Grade {grade}</span>;
}

export default function ProductDetailPage({ product, user, onBack, onCheckout }) {
  const canEdit = user.role === "supplier" && user.email === product.ownerEmail;

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

          <p className="detail-subtext">{product.category} · {product.condition} · {product.distanceKm} km away</p>

          <div className="passport-box">
            <h4>Digital Material Passport</h4>
            <div className="passport-grid">
              <div>
                <span>Origin</span>
                <strong>{product.origin}</strong>
              </div>
              <div>
                <span>Age</span>
                <strong>{product.age}</strong>
              </div>
              <div className="passport-report">
                <span>AI Grading Report</span>
                <strong>{product.aiReport}</strong>
              </div>
            </div>
          </div>

          <div className="seller-box">
            <h4>Seller Info</h4>
            <p>{product.sellerName}</p>
            <span>Reliability Score: {product.sellerReliability}</span>
          </div>

          {canEdit ? (
            <button type="button" className="submit-button" onClick={onBack}>Edit Listing</button>
          ) : (
            <div className="cta-row">
              <button type="button" className="submit-button" onClick={() => onCheckout(product)}>
                {user.role === "buyer" ? "Buy Now" : "Request Material"}
              </button>
              <button type="button" className="nav-button nav-button-secondary" onClick={() => onCheckout(product)}>
                Request Material
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
