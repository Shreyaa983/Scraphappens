import { createCommunityPostWithFile, getCommunityPosts } from "../api";
import { useTranslation } from "../hooks/useTranslation";

export default function CommunityPage({ token, user }) {
  const { t } = useTranslation();
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
        if (!cancelled) setError(err.message || t("Failed to load community feed"));
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
        setError(t("Please choose an image to upload."));
        return;
      }
      const formData = new FormData();
      formData.append("image", form.imageFile);
      if (form.caption) formData.append("caption", form.caption);

      const resp = await createCommunityPostWithFile(formData, token);
      setPosts((prev) => [resp.result, ...prev]);
      setForm({ imageFile: null, caption: "" });
    } catch (err) {
      setError(err.message || t("Failed to share post"));
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
            <span className="nav-logo-text">{t("Best Out of Waste")}</span>
          </div>
        </div>
      </header>

      <section className="listings-section">
        <div className="dashboard-card" style={{ marginBottom: 24 }}>
          <h4>{t("Share Your Build")}</h4>
          {error && (
            <div className="message" style={{ marginBottom: 12 }}>
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="diy-result-form">
            <label>
              {t("Image")}
              <input
                required
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => handleChange("imageFile", e.target.files?.[0] || null)}
              />
            </label>
            <label>
              {t("Caption")}
              <textarea
                rows={3}
                value={form.caption}
                onChange={(e) => handleChange("caption", e.target.value)}
                placeholder={t("Describe how you transformed waste into something useful…")}
              />
            </label>
            <button type="submit" className="submit-button">
              {t("Share to Community")}
            </button>
          </form>
        </div>

        <div className="dashboard-card">
          <h4>{t("Community Feed")}</h4>
          {loading ? (
            <div className="loading-shell">{t("Loading community posts...")}</div>
          ) : posts.length === 0 ? (
            <p>{t("No community posts yet. Be the first to share your build!")}</p>
          ) : (
            <div className="community-results-grid">
              {posts.map((post) => (
                <article key={post.id} className="community-result-card">
                  {post.image_url && (
                    <img src={post.image_url} alt={post.caption || "Community result"} />
                  )}
                  <div className="community-result-body">
                    <p className="community-result-caption">{t(post.caption)}</p>
                    <p className="community-result-meta">
                      {t("Posted by")} {post.user_name || t("Buyer")} {t("on")}{" "}
                      {new Date(post.created_at).toLocaleDateString()}
                      {post.diy_title ? ` · ${t("Inspired by")} ${t(post.diy_title)}` : null}
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


