import { useEffect, useMemo, useState } from "react";
import { createDiyResultWithFile, getDiyPostById, getDiyPostResults } from "../api";

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
          setError(err.message || "Failed to load DIY project");
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
      setError("Please choose an image to upload.");
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
      setError(err.message || "Failed to post result");
    } finally {
      setSharing(false);
    }
  }

  if (loading) {
    return <div className="loading-shell">Loading DIY project...</div>;
  }

  if (!post) {
    return (
      <div className="diy-empty-state">
        <h3>DIY project not found</h3>
        <p>The inspiration card may have been removed or failed to load.</p>
        <button className="nav-button nav-button-secondary" type="button" onClick={onBack}>
          Back to DIY feed
        </button>
      </div>
    );
  }

  return (
    <div className="diy-detail-shell">
      <div className="page-toolbar">
        <button type="button" className="nav-button nav-button-secondary" onClick={onBack}>
          Back to DIY feed
        </button>
      </div>

      {error ? <div className="message diy-message-box">{error}</div> : null}

      <section className="diy-detail-grid">
        <div className="diy-detail-visual">
          <img src={resolveAssetUrl(post.main_image_url)} alt={post.title} className="diy-detail-image" />
          <div className="diy-detail-overlay-card">
            <span className="diy-mini-label">AI-generated inspiration</span>
            <h2>{post.title}</h2>
            <p>{post.description}</p>
          </div>
        </div>

        <div className="diy-detail-content">
          <div className="diy-detail-summary">
            <div>
              <span>Estimated cost</span>
              <strong>{post.estimated_cost || "Rs. 0-500"}</strong>
            </div>
            <div>
              <span>Waste saved</span>
              <strong>{post.waste_saved || "Reusable material diverted from waste"}</strong>
            </div>
          </div>

          <div className="diy-panel">
            <h3>Step-by-step instructions</h3>
            <ol className="diy-step-list">
              {steps.map((step, index) => (
                <li key={`${post.id}-${index}`}>{step}</li>
              ))}
            </ol>
          </div>

          <div className="diy-panel">
            <div className="diy-panel-head">
              <h3>Materials required</h3>
              <span>Open a direct listing when available, otherwise search the marketplace</span>
            </div>
            <div className="diy-material-list">
              {(post.materials || []).map((material) => (
                <button
                  key={material.id}
                  type="button"
                  className="diy-material-pill"
                  onClick={() => {
                    if (material.marketplace_material_id) {
                      onOpenMaterial(material.marketplace_material_id);
                      return;
                    }
                    onSearchMaterial(material.material_name);
                  }}
                >
                  <span>{material.material_name}</span>
                  <small>
                    {[material.quantity_required, material.material_category].filter(Boolean).join(" • ") || "Search marketplace"}
                  </small>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="diy-community-layout">
        <div className="diy-panel">
          <div className="diy-panel-head">
            <h3>Post Your Result</h3>
            <span>Upload a photo and a short caption after you build the project.</span>
          </div>
          <form onSubmit={handlePostResult} className="diy-result-form">
            <label>
              Result image
              <input
                required
                type="file"
                accept="image/*"
                onChange={(event) => handleFormChange("imageFile", event.target.files?.[0] || null)}
              />
            </label>
            <label>
              Caption
              <textarea
                rows={4}
                value={form.caption}
                onChange={(event) => handleFormChange("caption", event.target.value)}
                placeholder="Tell buyers what worked well, what you changed, and how you reused the material."
              />
            </label>
            <button type="submit" className="submit-button" disabled={sharing}>
              {sharing ? "Posting result..." : "Post Your Result"}
            </button>
          </form>
        </div>

        <div className="diy-panel">
          <div className="diy-panel-head">
            <h3>Community Builds</h3>
            <span>See how buyers adapted the same AI inspiration in their own way.</span>
          </div>
          {results.length === 0 ? (
            <div className="diy-results-empty">
              <p>No builds have been shared yet.</p>
              <span>Your project could be the first one shown here.</span>
            </div>
          ) : (
            <div className="diy-results-grid">
              {results.map((result) => (
                <article key={result.id} className="diy-result-card">
                  <img src={resolveAssetUrl(result.image_url)} alt={result.caption || "DIY build result"} className="diy-result-image" />
                  <div className="diy-result-body">
                    <p>{result.caption || "Shared a finished build."}</p>
                    <span>
                      {result.user_name || "Buyer"} · {new Date(result.created_at).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
