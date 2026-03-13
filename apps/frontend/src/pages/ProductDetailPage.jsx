import SuggestionCard from "../components/SuggestionCard";
import { useTranslation } from "../hooks/useTranslation";

function TrustBadge({ grade }) {
  const { t } = useTranslation();
  return <span className={`trust-badge trust-badge-${grade.toLowerCase()}`}>{t("Grade")} {grade}</span>;
}

export default function ProductDetailPage({ product, user, onBack, onCheckout }) {
  const { t } = useTranslation();
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
        <button type="button" className="nav-button nav-button-secondary" onClick={onBack}>← {t("Back to Marketplace")}</button>
      </div>

      <section className="detail-layout">
        <div className="detail-gallery">
          <img src={product.gallery[0]} alt={t(product.name)} className="detail-hero-image" />
          <div className="detail-thumbnail-row">
            {product.gallery.map((image, index) => (
              <img key={image} src={image} alt={`${t(product.name)} ${index + 1}`} className="detail-thumb" />
            ))}
          </div>
        </div>

        <div className="dashboard-card detail-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">{t("Product detail")}</span>
              <h3>{t(product.name)}</h3>
            </div>
            <TrustBadge grade={product.trustGrade} />
          </div>

          {/* ... Existing Product Info ... */}
          <p className="detail-subtext">{t(product.category)} · {t(product.condition)}</p>

          <div className="cta-row">
            <button className="submit-button" onClick={() => onCheckout(product)}>{t("Buy Now")}</button>
          </div>
        </div>
      </section>

      {/* --- AI SUGGESTIONS SECTION --- */}
      <section className="ai-suggestions-section" style={{ 
          marginTop: "4rem", 
          borderTop: "3px solid var(--color-border, #1a1a1a)", 
          paddingTop: "3rem",
          paddingBottom: "4rem"
      }}>
        <h4 style={{ 
            margin: 0, 
            color: "#000", 
            marginBottom: "2.5rem", 
            fontWeight: 500, 
            fontSize: "1.65rem",
            letterSpacing: "-0.5px" 
        }}>
          {t("AI Upcycling Ideas")}
        </h4>
        {loading ? (
          <div className="loading-shell" style={{ margin: "2rem 0", background: "rgba(255,255,255,0.05)" }}>
              {t("Generating creative ideas using AI...")}
          </div>
        ) : suggestions.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem" }}>
            {suggestions.map((text, index) => (
              <SuggestionCard key={index} text={text} index={index} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "2rem", background: "var(--color-bg-secondary, rgba(255,255,255,0.02))", borderRadius: "16px", border: "1px dashed var(--color-border)" }}>
              <p style={{ color: "var(--color-text-secondary)", margin: 0 }}>{t("AI suggestions will appear here once loaded.")}</p>
          </div>
        )}
      </section>
    </div>
  );
}