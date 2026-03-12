import { Html } from "@react-three/drei";

export default function TreeAchievementPopup({ achievement, treeLabel }) {
  const achievementName = typeof achievement === "string" ? achievement : achievement?.name || achievement?.title || "Achievement Unlocked";
  const materialSummary = typeof achievement === "object" ? achievement?.materialSummary : null;
  const impactDisplay = typeof achievement === "object" ? achievement?.impact?.display : null;

  return (
    <Html distanceFactor={10} center>
      <div className="tree-achievement-popup">
        <p>🏆 {achievementName}</p>
        <p>Plant: {treeLabel}</p>
        {materialSummary ? <p>Material Reused: {materialSummary}</p> : null}
        {impactDisplay ? <p>Impact: {impactDisplay}</p> : null}
      </div>
    </Html>
  );
}
