// Mock platform-wide sustainability metrics — replace with real API data when available
const PLATFORM_STATS = {
  wasteSaved: "12,480 kg",
  carbonReduction: "3.2 tons",
  treesPlanted: "8,930",
  activeUsers: "1,245",
  organizations: "42",
  circularTransactions: "5,680",
  topMaterials: [
    { name: "Steel", pct: 72, color: "#60a5fa" },
    { name: "Plastic", pct: 58, color: "#34d399" },
    { name: "Wood", pct: 44, color: "#fbbf24" },
    { name: "Glass", pct: 31, color: "#a78bfa" },
    { name: "Fabric", pct: 19, color: "#fb7185" },
  ],
  categories: [
    { label: "Construction", pct: 38 },
    { label: "Electronics", pct: 27 },
    { label: "Textiles", pct: 18 },
    { label: "Packaging", pct: 17 },
  ],
};

function StatCard({ icon, label, value, accent = "#4cdf8c" }) {
  return (
    <div className="gstat-card">
      <span className="gstat-icon">{icon}</span>
      <span className="gstat-value" style={{ color: accent }}>
        {value}
      </span>
      <span className="gstat-label">{label}</span>
    </div>
  );
}

function MaterialBar({ name, pct, color }) {
  return (
    <div className="gstat-matrow">
      <span className="gstat-matname">{name}</span>
      <div className="gstat-matbar-bg">
        <div
          className="gstat-matbar-fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="gstat-matpct">{pct}%</span>
    </div>
  );
}

export default function GlobalStatsPanel({ onBack }) {
  const stats = PLATFORM_STATS;

  return (
    <div className="global-stats-panel">
      {/* Header */}
      <div className="gstat-header">
        <div className="gstat-title-block">
          <h2 className="gstat-title">🌍 Global Circular Impact</h2>
          <p className="gstat-subtitle">
            Every action you take contributes to this living ecosystem
          </p>
        </div>
        <button className="gstat-back-btn" onClick={onBack}>
          ← Back to My Garden
        </button>
      </div>

      {/* Primary stat cards */}
      <div className="gstat-cards-row">
        <StatCard icon="♻️" label="Waste Saved" value={stats.wasteSaved} accent="#4cdf8c" />
        <StatCard
          icon="🌿"
          label="Carbon Reduction"
          value={stats.carbonReduction}
          accent="#86efac"
        />
        <StatCard icon="🌳" label="Trees Planted" value={stats.treesPlanted} accent="#34d399" />
        <StatCard icon="👥" label="Active Users" value={stats.activeUsers} accent="#60a5fa" />
        <StatCard
          icon="🏢"
          label="Organizations"
          value={stats.organizations}
          accent="#a78bfa"
        />
        <StatCard
          icon="🔄"
          label="Circular Transactions"
          value={stats.circularTransactions}
          accent="#fbbf24"
        />
      </div>

      {/* Materials + Categories side by side */}
      <div className="gstat-bottom-row">
        {/* Top reused materials */}
        <div className="gstat-section">
          <h3 className="gstat-section-title">♻️ Most Reused Materials</h3>
          <div className="gstat-mat-list">
            {stats.topMaterials.map((mat) => (
              <MaterialBar key={mat.name} name={mat.name} pct={mat.pct} color={mat.color} />
            ))}
          </div>
        </div>

        {/* Category distribution */}
        <div className="gstat-section">
          <h3 className="gstat-section-title">📦 Category Distribution</h3>
          <div className="gstat-cat-grid">
            {stats.categories.map((cat) => (
              <div className="gstat-cat-item" key={cat.label}>
                <div
                  className="gstat-cat-fill"
                  style={{ height: `${cat.pct * 1.8}px` }}
                />
                <span className="gstat-cat-label">{cat.label}</span>
                <span className="gstat-cat-pct">{cat.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Impact narrative */}
        <div className="gstat-section gstat-narrative">
          <h3 className="gstat-section-title">🌱 Your Contribution</h3>
          <p className="gstat-narrative-text">
            Your personal garden is one node in a growing global circular forest. Each tree you
            plant represents a real sustainability action — reusing materials, completing circular
            transactions, and reducing waste.
          </p>
          <p className="gstat-narrative-text">
            Together, <strong>1,245 users</strong> and <strong>42 organizations</strong> are
            building this ecosystem, one scrap at a time.
          </p>
          <div className="gstat-tagline">
            "My actions grow a global circular forest."
          </div>
        </div>
      </div>
    </div>
  );
}
