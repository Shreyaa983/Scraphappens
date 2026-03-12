import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo, useState } from "react";
import grassTileModelUrl from "../../asessts/models/grassTile.glb";

export default function GrassTile({ position, onDrop, canPlace, tileScale = 1 }) {
  const { scene } = useGLTF(grassTileModelUrl);
  const [hovered, setHovered] = useState(false);
  const tile = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    tile.traverse((child) => {
      if (child.isMesh) {
        child.material = child.material.clone();
        child.material.emissive.set(hovered && canPlace ? "#3cff6b" : "#000000");
        child.material.emissiveIntensity = hovered && canPlace ? 0.5 : 0;
      }
    });
  }, [hovered, canPlace, tile]);

  return (
    <primitive
      object={tile}
      position={position}
      scale={tileScale}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onPointerDown={() => {
        if (canPlace) {
          onDrop();
        }
      }}
    />
  );
}

useGLTF.preload(grassTileModelUrl);