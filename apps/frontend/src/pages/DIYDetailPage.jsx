import { useEffect, useMemo, useState } from "react";
import { 
  createDiyResultWithFile, 
  getDiyPostById, 
  getDiyPostResults 
} from "../api";
import { 
  ArrowLeft, 
  CheckCircle, 
  Clock, 
  Coins, 
  Droplets, 
  Info, 
  Package, 
  Search, 
  Trash2, 
  Upload, 
  Users, 
  Activity
} from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";
import "../styles/diy.css";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=1200&q=80";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

function resolveAssetUrl(url) {
  if (!url) return FALLBACK_IMAGE;
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return `${API_BASE_URL}${url}`;
}

export default function DIYDetailPage({ diyId, token, onBack, onOpenMaterial, onSearchMaterial }) {
  const { t } = useTranslation();
  const [post, setPost] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sharing, setSharing] = useState(false);
  const [form, setForm] = useState({ imageFile: null, caption: "" });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const [postResponse, resultsResponse] = await Promise.all([
          getDiyPostById(diyId, token),
          getDiyPostResults(diyId, token),
        ]);

        if (!cancelled) {
          setPost(postResponse.post);
          setResults(resultsResponse.results || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || t("Failed to load DIY project"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [diyId, token]);

  const steps = useMemo(() => {
    if (!post?.steps) return [];
    try {
      const parsed = JSON.parse(post.steps);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return String(post.steps)
        .split("\n")
        .map((step) => step.trim())
        .filter(Boolean);
    }
  }, [post]);

  function handleFormChange(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handlePostResult(event) {
    event.preventDefault();
    if (!form.imageFile) {
      setError(t("Please choose an image to upload."));
      return;
    }

    setSharing(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("image", form.imageFile);
      if (form.caption) {
        formData.append("caption", form.caption);
      }

      const response = await createDiyResultWithFile(diyId, formData, token);
      setResults((prev) => [response.result, ...prev]);
      setForm({ imageFile: null, caption: "" });
    } catch (err) {
      setError(err.message || t("Failed to post result"));
    } finally {
      setSharing(false);
    }
  }

  if (loading) {
    return (
      <div className="diy-detail-shell">
        <div className="loading-shell">{t("Loading DIY project...")}</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="diy-detail-shell">
        <div className="diy-empty-state">
          <h3>{t("DIY project not found")}</h3>
          <p>{t("The inspiration card may have been removed or failed to load.")}</p>
          <button className="nav-button nav-button-secondary" type="button" onClick={onBack}>
            <ArrowLeft size={16} /> {t("Back to DIY feed")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="diy-detail-shell">
      <button 
        type="button" 
        className="nav-button nav-button-secondary" 
        style={{ marginBottom: '2rem' }} 
        onClick={onBack}
      >
        <ArrowLeft size={16} /> {t("Back to Inspiration")}
      </button>

      {error ? <div className="message diy-message-box">{error}</div> : null}

      <div className="diy-detail-container">
        {/* Visual Header */}
        <section className="diy-detail-hero">
          <div className="diy-card-image-wrap" style={{ aspectRatio: '21/9' }}>
            <img src={resolveAssetUrl(post.main_image_url)} alt={t(post.title)} className="diy-detail-image" />
          </div>
          
          <div className="diy-detail-intro">
            <h1>{t(post.title)}</h1>
            <p>{t(post.description)}</p>
          </div>

          <div className="diy-detail-summary-grid">
            <div className="diy-summary-box">
              <span className="diy-meta-label">
                <Coins size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} /> 
                {t("Estimated Cost")}
              </span>
              <span className="diy-meta-value">{t(post.estimated_cost) || t("Rs. 0")}</span>
            </div>
            <div className="diy-summary-box">
              <span className="diy-meta-label">
                <Trash2 size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} /> 
                {t("Waste Saved")}
              </span>
              <span className="diy-meta-value">{t(post.waste_saved) || t("Eco Impact")}</span>
            </div>
            <div className="diy-summary-box">
              <span className="diy-meta-label">
                <Activity size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} /> 
                {t("Difficulty")}
              </span>
              <span className="diy-meta-value">{t(post.difficulty) || t("Medium")}</span>
            </div>
          </div>
        </section>

        {/* Instructions */}
        <section>
          <h2 className="diy-section-title">
            <Info size={24} color="hsl(var(--primary))" /> 
            {t("Step-by-Step Instructions")}
          </h2>
          <div className="diy-numbered-list">
            {steps.map((step, index) => (
              <div key={`${post.id}-${index}`} className="diy-step-item">
                <div className="diy-step-number">{index + 1}</div>
                <div className="diy-step-content">{t(step)}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Materials Required */}
        <section>
          <h2 className="diy-section-title">
            <Package size={24} color="hsl(var(--primary))" /> 
            {t("Materials Required")}
          </h2>
          <div className="diy-materials-grid">
            {(post.materials || []).map((material) => (
              <div key={material.id} className="diy-material-card">
                <div className="diy-mat-info">
                  <span className="diy-mat-name">{t(material.material_name)}</span>
                  <span className="diy-mat-qty">{t(material.quantity_required) || t("1 unit")}</span>
                  <span className="diy-mat-cat">{t(material.material_category) || t("Uncategorized")}</span>
                </div>
                <button
                  type="button"
                  className="diy-mat-action"
                  onClick={() => {
                    if (material.marketplace_material_id) {
                      onOpenMaterial(material.marketplace_material_id);
                      return;
                    }
                    onSearchMaterial(material.material_name);
                  }}
                >
                  {material.marketplace_material_id ? (
                    <><Package size={14} style={{ marginRight: 6 }} /> {t("Open Listing")}</>
                  ) : (
                    <><Search size={14} style={{ marginRight: 6 }} /> {t("Search Marketplace")}</>
                  )}
                </button>
              </div>
            ))}
            {(!post.materials || post.materials.length === 0) && (
              <div className="diy-empty-gallery">{t("No specific materials listed.")}</div>
            )}
          </div>
        </section>

        {/* Post Your Result */}
        <section className="diy-post-result-card">
          <h2 className="diy-section-title">
            <CheckCircle size={24} color="hsl(var(--primary))" /> 
            {t("Post Your Result")}
          </h2>
          <p style={{ marginBottom: '1.5rem', color: 'hsl(var(--muted-foreground))' }}>
            {t("Tell others what worked well, what you changed, and how you reused the materials.")}
          </p>
          <form onSubmit={handlePostResult} className="diy-result-form">
            <div className="diy-form-group">
              <label className="diy-form-label">{t("Upload Result Image")}</label>
              <input
                required
                type="file"
                accept="image/*"
                className="diy-file-input"
                onChange={(event) => handleFormChange("imageFile", event.target.files?.[0] || null)}
              />
            </div>
            <div className="diy-form-group">
              <label className="diy-form-label">{t("Caption")}</label>
              <textarea
                rows={4}
                className="diy-caption-area"
                value={form.caption}
                onChange={(event) => handleFormChange("caption", event.target.value)}
                placeholder={t("Share your build experience...")}
              />
            </div>
            <button type="submit" className="submit-button" style={{ width: '100%' }} disabled={sharing}>
              {sharing ? (
                <><Clock size={18} className="spin" style={{ marginRight: 8 }} /> {t("Posting...")}</>
              ) : (
                <><Upload size={18} style={{ marginRight: 8 }} /> {t("Post Your Result")}</>
              )}
            </button>
          </form>
        </section>

        {/* Community Builds */}
        <section>
          <h2 className="diy-section-title">
            <Users size={24} color="hsl(var(--primary))" /> 
            {t("Community Builds")}
          </h2>
          <div className="diy-community-grid">
            {results.length === 0 ? (
              <div className="diy-empty-gallery">
                <p>{t("No builds have been shared yet. Your project could be the first!")}</p>
              </div>
            ) : (
              results.map((result) => (
                <article key={result.id} className="diy-build-card">
                  <img 
                    src={resolveAssetUrl(result.image_url)} 
                    alt={t(result.caption) || t("DIY build result")} 
                    className="diy-build-img" 
                  />
                  <div className="diy-build-body">
                    <p className="diy-build-caption">{t(result.caption) || t("Shared a finished build.")}</p>
                    <div className="diy-build-author">
                      <Users size={12} />
                      <span>{result.user_name || t("Buyer")}</span>
                      <span>•</span>
                      <span>{new Date(result.created_at).toLocaleDateString(t("en-IN") === "en-IN" ? "en-IN" : "en-IN")}</span>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
