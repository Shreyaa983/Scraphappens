// ─── Stats bar shown below the garden canvas ──────────────────────────────
// Switches between personal-garden derived stats and platform-wide stats
// depending on the `globalView` prop.

const GLOBAL_STATS = [
  { icon: "♻️", label: "Total Waste Reused",  value: "12,480 kg" },
  { icon: "📦", label: "Materials Traded",    value: "5,680"     },
  { icon: "🌳", label: "Trees Unlocked",      value: "8,930"     },
  { icon: "🌿", label: "CO₂ Reduction",       value: "3.2 tons"  },
];

function buildMyStats(placedTrees) {
  const count = placedTrees.length;
  const wasteSaved = count * 15;
  const traded = count * 2;
  const carbon = (count * 0.18).toFixed(1);

  return [
    { icon: "♻️", label: "Total Waste Reused", value: `${wasteSaved} kg` },
    { icon: "📦", label: "Materials Traded",   value: String(traded) },
    { icon: "🌳", label: "Trees Unlocked",     value: String(count) },
    { icon: "🌿", label: "CO₂ Reduction",      value: `${carbon} tons` },
  ];
}

function StatCard({ icon, label, value, accent }) {
  return (
    <div className="gsbar-card" style={accent ? { "--gsbar-accent": accent } : undefined}>
      <span className="gsbar-icon-wrap">
        <span className="gsbar-icon">{icon}</span>
      </span>
      <span className="gsbar-value">{value}</span>
      <span className="gsbar-label">{label}</span>
    </div>
  );
}

export default function GardenStatsBar({ globalView, placedTrees }) {
  const stats = globalView ? GLOBAL_STATS : buildMyStats(placedTrees);
  const title = globalView ? "Global Forest Overview" : "Impact Stats";
  const description = globalView
    ? "A snapshot of the platform's collective circular economy impact."
    : placedTrees.length > 0
      ? "Your current impact from reuse and successful material exchanges."
      : "Start unlocking achievements to collect plants and build your eco-garden.";

  const ACCENTS = ["#4cdf8c", "#f8b26a", "#34d399", "#60a5fa"];

  return (
    <section className={`gsbar-root${globalView ? " gsbar-global" : ""}`}>
      <div className="gsbar-head">
        <div>
          <div className="gsbar-eyebrow">{globalView ? "Platform impact" : "Personal impact"}</div>
          <div className="gsbar-heading">{title}</div>
          <p className="gsbar-description">{description}</p>
        </div>
        <div className="gsbar-status-chip">{globalView ? "Live network view" : "Synced with your garden"}</div>
      </div>
      <div className="gsbar-cards">
        {stats.map((s, i) => (
          <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} accent={ACCENTS[i]} />
        ))}
      </div>
    </section>
  );
}
