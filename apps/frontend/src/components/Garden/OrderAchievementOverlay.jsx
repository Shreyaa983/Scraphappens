export default function OrderAchievementOverlay({ achievement }) {
  if (!achievement) {
    return null;
  }

  return (
    <div className="order-achievement-overlay" role="status" aria-live="polite">
      <div className="order-achievement-card">
        <div className="order-achievement-badge">Order confirmed</div>
        <h3>🏆 {achievement.name || "Achievement Unlocked"}</h3>
        <p>{achievement.description || "Your circular action has earned a new plant."}</p>

        <div className="order-achievement-meta">
          <div className="order-achievement-stat">
            <span>Reward</span>
            <strong>{achievement.reward?.icon || "🌱"} {achievement.reward?.plantLabel || "Circular Sapling"}</strong>
          </div>
          <div className="order-achievement-stat">
            <span>Material reused</span>
            <strong>{achievement.materialSummary || "Reusable material"}</strong>
          </div>
          <div className="order-achievement-stat">
            <span>Impact</span>
            <strong>{achievement.impact?.display || "Circular impact recorded"}</strong>
          </div>
        </div>

        <div className="order-achievement-footer">Redirecting to your garden…</div>
      </div>
    </div>
  );
}
