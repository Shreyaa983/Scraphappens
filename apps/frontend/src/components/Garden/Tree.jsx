import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import treeModelUrl1 from "../../asessts/models/tree-1.glb";
import treeModelUrl2 from "../../asessts/models/tree-2.glb";
import treeModelUrl3 from "../../asessts/models/tree-3.glb";
import treeModelUrl4 from "../../asessts/models/tree-4.glb";
import treeModelUrl5 from "../../asessts/models/tree-5.glb";
import TreeAchievementPopup from "./TreeAchievementPopup";

const treeVariantConfig = {
  plant1: { yOffset: 4.1, baseScale: 0.48, rotationY: 0, modelUrl: treeModelUrl1 },
  plant2: { yOffset: 3.3, baseScale: 2.54, rotationY: 0.5, modelUrl: treeModelUrl2 },
  plant3: { yOffset: 0.0, baseScale: 0.04, rotationY: 1.1, modelUrl: treeModelUrl3 },
  plant4: { yOffset: 0.25, baseScale: 1.5, rotationY: 1.8, modelUrl: treeModelUrl4 },
  plant5: { yOffset: 0.15, baseScale: 0.43, rotationY: 2.5, modelUrl: treeModelUrl5 }
};

export default function Tree({ position, achievement, treeType, treeLabel, animate = false }) {
  const variant = treeVariantConfig[treeType] || treeVariantConfig.plant1;
  const { scene } = useGLTF(variant.modelUrl);
  const groupRef = useRef(null);
  const currentScaleRef = useRef(animate ? 0.01 : variant.baseScale);
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (!animate || !groupRef.current) {
      return;
    }

    const targetScale = variant.baseScale;
    const nextScale = currentScaleRef.current + (targetScale - currentScaleRef.current) * 0.14;
    currentScaleRef.current = nextScale;
    groupRef.current.scale.set(nextScale, nextScale, nextScale);
  });

  return (
    <group
      ref={groupRef}
      position={[position[0], variant.yOffset, position[2]]}
      scale={currentScaleRef.current}
      rotation={[0, variant.rotationY, 0]}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <primitive object={scene.clone()} />

      {hovered && achievement ? (
        <group position={[0, 2, 0]}>
          <TreeAchievementPopup achievement={achievement} treeLabel={treeLabel || "Tree"} />
        </group>
      ) : null}
    </group>
  );
}

useGLTF.preload(treeModelUrl1);
useGLTF.preload(treeModelUrl2);
useGLTF.preload(treeModelUrl3);
useGLTF.preload(treeModelUrl4);
useGLTF.preload(treeModelUrl5);