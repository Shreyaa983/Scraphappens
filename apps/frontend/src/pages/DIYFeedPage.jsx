import { useEffect, useMemo, useState } from "react";
import { getDiyPosts } from "../api";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80";

function DiyCard({ post, onOpen }) {
  return (
    <article className="diy-feed-card" onClick={() => onOpen(post)}>
      <div className="diy-feed-card-image-wrap">
        <img src={post.main_image_url || FALLBACK_IMAGE} alt={post.title} className="diy-feed-card-image" />
        {post.waste_saved ? <span className="diy-impact-chip">{post.waste_saved}</span> : null}
      </div>
      <div className="diy-feed-card-body">
        <div className="diy-feed-card-top">
          <span className="diy-mini-label">DIY idea</span>
          <h3>{post.title}</h3>
        </div>
        <p>{post.description}</p>
        <div className="diy-feed-card-meta">
          <div>
            <span>Estimated cost</span>
            <strong>{post.estimated_cost || "₹0-₹500"}</strong>
          </div>
          <button type="button" className="diy-open-button">
            View project
          </button>
        </div>
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
    () => posts.filter((post) => String(post.estimated_cost || "").includes("₹0")).length,
    [posts]
  );

  return (
    <div className="diy-feed-shell">
      <section className="diy-hero-panel">
        <div className="diy-hero-copy">
          <span className="eyebrow">Buyer-only inspiration</span>
          <h2>Explore ready-made DIY reuse ideas and build with materials from the marketplace.</h2>
          <p>
            These static inspiration posts are seeded into the database so buyers can browse projects, estimate spend in rupees,
            open material links, and share completed builds under each idea.
          </p>
          <div className="diy-hero-actions">
            <div className="diy-inline-note">
              <strong>Seeded inspiration library</strong>
              <span>Posts are preloaded on the backend so the DIY feature is testable without AI generation.</span>
            </div>
          </div>
        </div>

        <div className="diy-stats-grid">
          <div className="diy-stat-card">
            <span>Total inspirations</span>
            <strong>{totalProjects}</strong>
          </div>
          <div className="diy-stat-card">
            <span>Zero-cost builds</span>
            <strong>{zeroCostProjects}</strong>
          </div>
          <div className="diy-stat-card">
            <span>Difficulty range</span>
            <strong>Easy-Medium</strong>
          </div>
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
