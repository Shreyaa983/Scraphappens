import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

// ─── Simple low-poly tree (trunk + cone foliage) ───────────────────────────

function SimpleTree({ position, height = 1.8, color = "#2d8a4e" }) {
  return (
    <group position={position}>
      {/* Trunk */}
      <mesh position={[0, height * 0.2, 0]}>
        <cylinderGeometry args={[0.07, 0.11, height * 0.4, 6]} />
        <meshStandardMaterial color="#5c3317" roughness={0.9} />
      </mesh>

      {/* Lower foliage */}
      <mesh position={[0, height * 0.62, 0]}>
        <coneGeometry args={[height * 0.28, height * 0.55, 8]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>

      {/* Upper foliage tip */}
      <mesh position={[0, height * 0.92, 0]}>
        <coneGeometry args={[height * 0.16, height * 0.38, 7]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
    </group>
  );
}

// ─── A cluster of trees representing one foreign garden ────────────────────

function ForeignGardenCluster({ cx, cz, trees }) {

  const TILE_SIZE = 14.5;

  return (
    <group position={[cx, 0, cz]}>

      {/* Grass tile */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[TILE_SIZE, TILE_SIZE]} />
        <meshStandardMaterial color="#3e7b39" roughness={0.9} />
      </mesh>

      {/* Border edge */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <ringGeometry args={[TILE_SIZE / 2 + 0.3, TILE_SIZE / 2 + 0.5, 32]} />
        <meshStandardMaterial color="#2f5f2c" />
      </mesh>

      {/* Trees */}
      {trees.map((t, i) => (
        <SimpleTree
          key={i}
          position={[t.dx, 0, t.dz]}
          height={t.h}
          color={t.color}
        />
      ))}

    </group>
  );
}

// ─── User's personal garden trees (simplified for global view) ─────────────

const PERSONAL_TREE_COLORS = {
  plant1: "#4caf73",
  plant2: "#2e7d44",
  plant3: "#66bb6a",
  plant4: "#8bc34a",
  plant5: "#26a65b",
};

function PersonalGardenTrees({ placedTrees }) {
  return (
    <>
      {placedTrees.map((tree) => (
        <SimpleTree
          key={tree.id}
          position={[tree.x * 2 - 6, 0, tree.z * 2 - 6]}
          height={2.6}
          color={PERSONAL_TREE_COLORS[tree.treeType] || "#4caf73"}
        />
      ))}
    </>
  );
}

// ─── Large ground plane ────────────────────────────────────────────────────

function GlobalGround() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]} receiveShadow>
      <planeGeometry args={[110, 110]} />
      <meshStandardMaterial color="#3a6130" roughness={0.97} />
    </mesh>
  );
}

// ─── Subtle grid overlay ───────────────────────────────────────────────────

function GroundGrid() {
  return <gridHelper args={[110, 55, "#2c4e26", "#2c4e26"]} position={[0, 0.01, 0]} />;
}

// ─── User garden highlight patch ───────────────────────────────────────────

function GardenPatch() {
  return (
    <>
      {/* Slightly brighter inner patch */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[14.5, 14.5]} />
        <meshStandardMaterial color="#4a7a40" roughness={0.9} />
      </mesh>

      {/* Glowing border ring using a wireframe box */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <ringGeometry args={[7.5, 8.0, 4, 1, Math.PI / 4]} />
        <meshStandardMaterial color="#5af078" emissive="#3cff6b" emissiveIntensity={0.6} transparent opacity={0.5} />
      </mesh>
    </>
  );
}

// ─── "My Garden" label floating in 3D ─────────────────────────────────────

function GardenLabel() {
  return (
    <Html position={[-1, 0.4, 8.5]} center>
      <div className="garden-world-label">📍 My Garden</div>
    </Html>
  );
}

// ─── Smooth camera zoom-out animation ─────────────────────────────────────

function CameraAnimator() {
  const { camera } = useThree();
  const progressRef = useRef(0);
  const startPosRef = useRef(new THREE.Vector3(10, 12, 12));
  const targetPos = new THREE.Vector3(0, 52, 14);

  useFrame(() => {
    if (progressRef.current >= 1) return;
    progressRef.current = Math.min(1, progressRef.current + 0.011);

    // Ease-out cubic
    const t = 1 - Math.pow(1 - progressRef.current, 3);
    camera.position.lerpVectors(startPosRef.current, targetPos, t);
    camera.lookAt(0, 0, 0);
  });

  return null;
}

// ─── Pre-generate stable foreign cluster data (seeded RNG) ────────────────

function seededRandom(seed) {
  let s = seed >>> 0;
  return function () {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function buildForeignClusters(count = 24) {
  const rng = seededRandom(7);
  const COLORS = [
    "#2d8a4e",
    "#1b6e3a",
    "#3a9657",
    "#266b3a",
    "#4aaa60",
    "#1e7a3e",
    "#358f55",
    "#255c38",
  ];

  const clusters = [];

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + rng() * 0.7;
    const radius = 18 + rng() * 40;
    const cx = Math.cos(angle) * radius;
    const cz = Math.sin(angle) * radius;

    const activity = rng();
    const treeCount =
      activity < 0.33
        ? 2 + Math.floor(rng() * 2)
        : activity < 0.66
          ? 4 + Math.floor(rng() * 2)
          : 6 + Math.floor(rng() * 2);

    const trees = [];
    for (let j = 0; j < treeCount; j++) {
      const a = (j / treeCount) * Math.PI * 2 + rng() * 1.3;
      const r = 0.5 + rng() * 1.8;
      trees.push({
        dx: Math.cos(a) * r,
        dz: Math.sin(a) * r,
        h: 1.2 + rng() * 1.6,
        color: COLORS[Math.floor(rng() * COLORS.length)],
      });
    }

    clusters.push({ id: i, cx, cz, trees });
  }

  return clusters;
}

// Evaluated once at module load — stable across re-renders
const FOREIGN_CLUSTERS = buildForeignClusters(24);

// ─── Main exported component ───────────────────────────────────────────────

export default function GlobalForestScene({ placedTrees }) {
  return (
    <div className="global-forest-canvas">
      <Canvas shadows camera={{ position: [10, 12, 12], fov: 52 }}>
        {/* Lighting */}
        <ambientLight intensity={1.0} />
        <directionalLight
          position={[25, 40, 15]}
          intensity={1.6}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <hemisphereLight skyColor="#87ceab" groundColor="#2d5a27" intensity={0.5} />

        {/* Atmospheric fog */}
        <fog attach="fog" args={["#6fa86a", 50, 95]} />

        {/* Camera zoom-out animation */}
        <CameraAnimator />

        {/* Terrain */}
        <GlobalGround />
        <GroundGrid />
        <GardenPatch />
        <GardenLabel />

        {/* User's personal garden trees */}
        <PersonalGardenTrees placedTrees={placedTrees} />

        {/* Foreign gardens scattered around the world */}
        {FOREIGN_CLUSTERS.map((cluster) => (
          <ForeignGardenCluster
            key={cluster.id}
            cx={cluster.cx}
            cz={cluster.cz}
            trees={cluster.trees}
          />
        ))}

        {/* Limited orbit — observation only */}
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          minPolarAngle={0.05}
          maxPolarAngle={Math.PI / 5}
          maxAzimuthAngle={Math.PI / 10}
          minAzimuthAngle={-Math.PI / 10}
          enableDamping
          dampingFactor={0.07}
        />
      </Canvas>
    </div>
  );
}
