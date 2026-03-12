import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense } from "react";
import * as THREE from "three";

import GardenGrid from "./GardenGrid";
import Tree from "./Tree";
import GlobalGrid from "../GlobalForest/GlobalGrid";

function CameraTransition({ globalView }) {
  const localTarget = new THREE.Vector3(10, 12, 12);
  // 4×4 grid with spacing=14 spans ~42 WU — camera closer in
  const globalTarget = new THREE.Vector3(7, 48, 44);
  // In global view look at visual center of the 4×4 grid (midpoint of −1..+2 = 0.5 * 14 = 7)
  const lookAtLocal = new THREE.Vector3(0, 0, 0);
  const lookAtGlobal = new THREE.Vector3(7, 0, 7);

  useFrame(({ camera }) => {
    const target = globalView ? globalTarget : localTarget;
    camera.position.lerp(target, 0.03);
    camera.lookAt(globalView ? lookAtGlobal : lookAtLocal);
  });

  return null;
}

export default function GardenScene({ placedTrees, selectedPlantId, onTilePlace, globalView = false }) {

  return (
    <div className="garden-scene-canvas">
      <Canvas camera={{ position: [10, 12, 12], fov: 50 }}>
        <ambientLight intensity={1} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} />
        <CameraTransition globalView={globalView} />

        <Suspense fallback={null}>
          {globalView ? <GlobalGrid /> : null}
          <GardenGrid onTileDrop={onTilePlace} canPlace={!globalView && Boolean(selectedPlantId)} />

          {placedTrees.map((tree) => (
            <Tree
              key={tree.id}
              position={[tree.x * 2 - 6, 0, tree.z * 2 - 6]}
              achievement={tree.achievement}
              treeType={tree.treeType}
              treeLabel={tree.treeLabel}
              animate
            />
          ))}
        </Suspense>

        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minPolarAngle={globalView ? Math.PI / 8 : Math.PI / 4}
          maxPolarAngle={globalView ? Math.PI / 3 : Math.PI / 2.2}
          minAzimuthAngle={globalView ? -Math.PI / 3 : -Infinity}
          maxAzimuthAngle={globalView ? Math.PI / 3 : Infinity}
        />
      </Canvas>
    </div>
  );
}