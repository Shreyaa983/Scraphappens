export default function AchievementPopup({ achievement }) {
  if (!achievement) {
    return null;
  }

  return (
    <div className="achievement-popup" role="status" aria-live="polite">
      <p className="achievement-title">🏆 Achievement Unlocked</p>
      <p className="achievement-name">{achievement.name}</p>
      <p className="achievement-reward">You earned {achievement.reward || "a Tree"} {achievement.icon || "🌳"}</p>
      {achievement.description ? <p className="achievement-description">{achievement.description}</p> : null}
    </div>
  );
}
