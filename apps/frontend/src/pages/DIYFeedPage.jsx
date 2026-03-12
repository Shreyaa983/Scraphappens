import { useEffect, useMemo, useState } from "react";
import { getDiyPosts } from "../api";
import { Coins, Activity, Trash2 } from "lucide-react";
import "../styles/diy.css";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80";

function DiyCard({ post, onOpen }) {
  const isAI = post.is_ai_generated || false;

  return (
    <article className="diy-card" onClick={() => onOpen(post)}>
      <div className="diy-card-image-wrap">
        <img 
          src={post.main_image_url || FALLBACK_IMAGE} 
          alt={post.title} 
          className="diy-card-image" 
        />
        {isAI && <span className="diy-ai-label">AI Generated</span>}
      </div>
      <div className="diy-card-body">
        <h3 className="diy-card-title">{post.title}</h3>
        <p className="diy-card-desc">{post.description}</p>
        
        <div className="diy-card-meta">
          <div className="diy-meta-item">
            <span className="diy-meta-label">
              <Coins size={12} style={{ marginRight: 4 }} />
              Estimated Cost
            </span>
            <span className="diy-meta-value">{post.estimated_cost || "Rs. 0"}</span>
          </div>
          <div className="diy-meta-item">
            <span className="diy-meta-label">
              <Activity size={12} style={{ marginRight: 4 }} />
              Difficulty
            </span>
            <span className="diy-meta-value">{post.difficulty || "Easy"}</span>
          </div>
          <div className="diy-meta-item">
            <span className="diy-meta-label">
              <Trash2 size={12} style={{ marginRight: 4 }} />
              Waste Saved
            </span>
            <span className="diy-meta-value">{post.waste_saved || "N/A"}</span>
          </div>
        </div>

        <button type="button" className="diy-card-button">
          View Project
        </button>
      </div>
    </article>
  );
}

export default function DIYFeedPage({ token, onOpenProject }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await getDiyPosts(token);
        if (!cancelled) {
          setPosts(response.posts || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load DIY inspiration");
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
  }, [token]);

  const totalProjects = posts.length;
  const zeroCostProjects = useMemo(
    () => posts.filter((post) => 
      String(post.estimated_cost || "").includes("Rs. 0") || 
      String(post.estimated_cost || "").includes("₹0")
    ).length,
    [posts]
  );

  return (
    <div className="diy-feed-shell">
      <header className="diy-page-header">
        <h1>DIY Inspiration</h1>
        <p>Explore creative reuse projects built from marketplace materials. Build them yourself and share your results with the community.</p>
      </header>

      <section className="diy-stats-container">
        <div className="diy-stat-card">
          <span className="diy-stat-label">Total Inspirations</span>
          <span className="diy-stat-value">{totalProjects}</span>
        </div>
        <div className="diy-stat-card">
          <span className="diy-stat-label">Zero-Cost Builds</span>
          <span className="diy-stat-value">{zeroCostProjects}</span>
        </div>
        <div className="diy-stat-card">
          <span className="diy-stat-label">Difficulty Range</span>
          <span className="diy-stat-value">Easy – Medium</span>
        </div>
      </section>

      {error ? <div className="message diy-message-box">{error}</div> : null}

      {loading ? (
        <div className="loading-shell">Loading DIY ideas...</div>
      ) : posts.length === 0 ? (
        <div className="diy-empty-state">
          <h3>No DIY posts are available yet</h3>
          <p>The backend seed should populate this feed automatically when the table is empty.</p>
        </div>
      ) : (
        <section className="diy-feed-grid">
          {posts.map((post) => (
            <DiyCard key={post.id} post={post} onOpen={onOpenProject} />
          ))}
        </section>
      )}
    </div>
  );
}
