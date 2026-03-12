// ─── Stats bar shown below the garden canvas ──────────────────────────────
// Switches between personal-garden derived stats and platform-wide stats
// depending on the `globalView` prop.

const GLOBAL_STATS = [
  { icon: "♻️", label: "Waste Saved",         value: "12,480 kg" },
  { icon: "🌿", label: "Carbon Reduction",     value: "3.2 tons"  },
  { icon: "🌳", label: "Trees Planted",        value: "8,930"     },
  { icon: "👥", label: "Active Users",         value: "1,245"     },
  { icon: "🏢", label: "Organisations",        value: "42"        },
  { icon: "🔄", label: "Transactions",         value: "5,680"     },
];

function buildMyStats(placedTrees) {
  const count     = placedTrees.length;
  const wasteSaved = count * 15;
  const carbon    = (count * 0.18).toFixed(1);
  const achievements = [...new Set(placedTrees.map((t) => t.achievement).filter(Boolean))].length;

  return [
    { icon: "🌳", label: "Trees Planted",      value: String(count)             },
    { icon: "♻️", label: "Waste Saved",        value: `${wasteSaved} kg`        },
    { icon: "🌿", label: "Carbon Offset",      value: `${carbon} tons`          },
    { icon: "🏆", label: "Achievements",       value: String(achievements || 0) },
    { icon: "🌱", label: "Garden Level",       value: count >= 10 ? "Expert" : count >= 5 ? "Growing" : "Seedling" },
    { icon: "⭐", label: "Impact Score",       value: String(count * 22)        },
  ];
}

function StatCard({ icon, label, value, accent }) {
  return (
    <div className="gsbar-card">
      <span className="gsbar-icon">{icon}</span>
      <span className="gsbar-value" style={accent ? { color: accent } : undefined}>{value}</span>
      <span className="gsbar-label">{label}</span>
    </div>
  );
}

export default function GardenStatsBar({ globalView, placedTrees }) {
  const stats = globalView ? GLOBAL_STATS : buildMyStats(placedTrees);

  const ACCENTS = ["#4cdf8c", "#86efac", "#34d399", "#60a5fa", "#a78bfa", "#fbbf24"];

  return (
    <div className={`gsbar-root${globalView ? " gsbar-global" : ""}`}>
      <div className="gsbar-heading">
        {globalView ? "🌍 Global Circular Forest Stats" : "🌱 My Garden Stats"}
      </div>
      <div className="gsbar-cards">
        {stats.map((s, i) => (
          <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} accent={ACCENTS[i]} />
        ))}
      </div>
    </div>
  );
}
