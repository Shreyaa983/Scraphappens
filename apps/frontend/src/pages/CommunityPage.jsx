import { useEffect, useState } from "react";
import { createCommunityPostWithFile, getCommunityPosts } from "../api";

export default function CommunityPage({ token, user }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ imageFile: null, caption: "" });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const resp = await getCommunityPosts(token);
        if (!cancelled) setPosts(resp.results || []);
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load community feed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  function handleChange(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      if (!form.imageFile) {
        setError("Please choose an image to upload.");
        return;
      }
      const formData = new FormData();
      formData.append("image", form.imageFile);
      if (form.caption) formData.append("caption", form.caption);

      const resp = await createCommunityPostWithFile(formData, token);
      setPosts((prev) => [resp.result, ...prev]);
      setForm({ imageFile: null, caption: "" });
    } catch (err) {
      setError(err.message || "Failed to share post");
    }
  }

  return (
    <div className="marketplace-modern-container">
      <header className="marketplace-top-nav">
        <div className="nav-brand-area">
          <div className="nav-logo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
              <path d="M4 4h16v4H4zM4 10h10v4H4zM4 16h7v4H4z" />
            </svg>
            <span className="nav-logo-text">Best Out of Waste</span>
          </div>
        </div>
      </header>

      <section className="listings-section">
        <div className="dashboard-card" style={{ marginBottom: 24 }}>
          <h4>Share Your Build</h4>
          {error && (
            <div className="message" style={{ marginBottom: 12 }}>
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="diy-result-form">
            <label>
              Image
              <input
                required
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => handleChange("imageFile", e.target.files?.[0] || null)}
              />
            </label>
            <label>
              Caption
              <textarea
                rows={3}
                value={form.caption}
                onChange={(e) => handleChange("caption", e.target.value)}
                placeholder="Describe how you transformed waste into something useful…"
              />
            </label>
            <button type="submit" className="submit-button">
              Share to Community
            </button>
          </form>
        </div>

        <div className="dashboard-card">
          <h4>Community Feed</h4>
          {loading ? (
            <div className="loading-shell">Loading community posts...</div>
          ) : posts.length === 0 ? (
            <p>No community posts yet. Be the first to share your build!</p>
          ) : (
            <div className="community-results-grid">
              {posts.map((post) => (
                <article key={post.id} className="community-result-card">
                  {post.image_url && (
                    <img src={post.image_url} alt={post.caption || "Community result"} />
                  )}
                  <div className="community-result-body">
                    <p className="community-result-caption">{post.caption}</p>
                    <p className="community-result-meta">
                      Posted by {post.user_name || "Buyer"} on{" "}
                      {new Date(post.created_at).toLocaleDateString()}
                      {post.diy_title ? ` · Inspired by ${post.diy_title}` : null}
                    </p>
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


