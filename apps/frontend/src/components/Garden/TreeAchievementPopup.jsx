import { Html } from "@react-three/drei";

export default function TreeAchievementPopup({ achievement, treeLabel }) {
  return (
    <Html distanceFactor={10} center>
      <div className="tree-achievement-popup">
        <p>🏆 {achievement}</p>
        <p>Unlocked: {treeLabel}</p>
      </div>
    </Html>
  );
}
