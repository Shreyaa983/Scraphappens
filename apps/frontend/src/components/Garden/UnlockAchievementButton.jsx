export default function UnlockAchievementButton({ onUnlock }) {
  return (
    <button type="button" className="unlock-achievement-button" onClick={onUnlock}>
      Unlock Achievement
    </button>
  );
}
