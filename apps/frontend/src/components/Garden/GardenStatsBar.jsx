import { useTranslation } from '../../hooks/useTranslation';
// ─── Stats bar shown below the garden canvas ──────────────────────────────
// Switches between personal-garden derived stats and platform-wide stats
// depending on the `globalView` prop.

export default function GardenStatsBar({ globalView, placedTrees }) {
  const { t } = useTranslation();
  const GLOBAL_STATS = [
    { icon: "♻️", label: t("Total Waste Reused"),  value: "12,480 kg" },
    { icon: "📦", label: t("Materials Traded"),    value: "5,680"     },
    { icon: "🌳", label: t("Trees Unlocked"),      value: "8,930"     },
    { icon: "🌿", label: t("CO₂ Reduction"),       value: t("3.2 tons")  },
  ];

  function buildMyStats(placedTrees) {
    const count = placedTrees.length;
    const wasteSaved = count * 15;
    const traded = count * 2;
    const carbon = (count * 0.18).toFixed(1);

    return [
      { icon: "♻️", label: t("Total Waste Reused"), value: `${wasteSaved} kg` },
      { icon: "📦", label: t("Materials Traded"),   value: String(traded) },
      { icon: "🌳", label: t("Trees Unlocked"),     value: String(count) },
      { icon: "🌿", label: t("CO₂ Reduction"),      value: `${carbon} tons` },
    ];
  }

  const stats = globalView ? GLOBAL_STATS : buildMyStats(placedTrees);
  const title = globalView ? t("Global Forest Overview") : t("Impact Stats");
  const description = globalView
    ? t("A snapshot of the platform's collective circular economy impact.")
    : placedTrees.length > 0
      ? t("Your current impact from reuse and successful material exchanges.")
      : t("Start unlocking achievements to collect plants and build your eco-garden.");

  const ACCENTS = ["#4cdf8c", "#f8b26a", "#34d399", "#60a5fa"];

  return (
    <section className={`gsbar-root${globalView ? " gsbar-global" : ""}`}>
      <div className="gsbar-head">
        <div>
          <div className="gsbar-eyebrow">{globalView ? t("Platform impact") : t("Personal impact")}</div>
          <div className="gsbar-heading">{title}</div>
          <p className="gsbar-description">{description}</p>
        </div>
        <div className="gsbar-status-chip">{globalView ? t("Live network view") : t("Synced with your garden")}</div>
      </div>
      <div className="gsbar-cards">
        {stats.map((s, i) => (
          <div key={s.label} className="gsbar-card" style={ACCENTS[i] ? { "--gsbar-accent": ACCENTS[i] } : undefined}>
            <span className="gsbar-icon-wrap">
              <span className="gsbar-icon">{s.icon}</span>
            </span>
            <span className="gsbar-value">{s.value}</span>
            <span className="gsbar-label">{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
