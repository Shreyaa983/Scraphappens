import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";

// ─── Constants ───────────────────────────────────────────────────────────────
// TILE_SIZE matches the ~12 WU footprint of the user's 6×6 GrassTile garden
const TILE_SIZE = 12;
const TILE_SPACING = 14; // 2 WU breathing room between tiles

// ─── Seeded deterministic helpers ────────────────────────────────────────────
function seededInt(a, b, max) {
  return Math.abs((a * 127 + b * 311 + 17) % max);
}

const GARDEN_NAMES = [
  "ReCircle Lab",
  "EcoReuse Collective",
  "GreenLoop Community",
  "Anna's Circular Garden",
  "CircularCo",
  "EcoNest Hub",
  "ScrapSpace Studio",
  "ReuseHub",
  "GreenForge",
  "EcoLoop Studio",
  "ClimateGrowers",
  "UrbanReuse Co",
  "MaterialsCycle",
  "ScrapHappy Crew",
  "Zero-Waste Lab",
  "BioCycle Depot",
  "OpenReuse Network",
  "RepairFirst Collective",
  "TerraLoop Garden",
  "NatureCircle Hub",
];

const IMPACT_TYPES = [
  { label: "Waste Reused", unit: "kg", min: 40, max: 480 },
  { label: "Materials Circulated", unit: "kg", min: 60, max: 520 },
  { label: "Carbon Saved", unit: "tons", min: 0.4, max: 5.8 },
  { label: "Items Reused", unit: "items", min: 20, max: 340 },
];

function getTileData(x, z) {
  const nameIdx = seededInt(x + 5, z + 5, GARDEN_NAMES.length);
  const impactIdx = seededInt(x + 3, z + 7, IMPACT_TYPES.length);
  const imp = IMPACT_TYPES[impactIdx];
  const range = imp.max - imp.min;
  const rawValue = imp.min + seededInt(x + 1, z + 2, Math.floor(range));
  const displayValue =
    imp.unit === "tons"
      ? (imp.min + (seededInt(x + 1, z + 2, 100) / 100) * range).toFixed(1)
      : Math.round(rawValue);
  return {
    name: GARDEN_NAMES[nameIdx],
    statLabel: imp.label,
    statValue: `${displayValue} ${imp.unit}`,
  };
}

// ─── Tree colors ──────────────────────────────────────────────────────────────
const TREE_COLORS = ["#2e7d32", "#3f9a46", "#57b85d", "#2c6b3a", "#67c56d", "#4a8f50"];

// ─── Single low-poly tree (Lambert for perf across 81 tiles) ─────────────────
function TinyTree({ position, height, color }) {
  return (
    <group position={position}>
      <mesh position={[0, height * 0.22, 0]}>
        <cylinderGeometry args={[0.09, 0.15, height * 0.44, 6]} />
        <meshLambertMaterial color="#6a3b1a" />
      </mesh>
      <mesh position={[0, height * 0.64, 0]}>
        <coneGeometry args={[height * 0.3, height * 0.58, 7]} />
        <meshLambertMaterial color={color} />
      </mesh>
    </group>
  );
}

// ─── Cluster of 2–6 trees per tile ───────────────────────────────────────────
function TreeCluster({ tileX, tileZ }) {
  const trees = useMemo(() => {
    const base = Math.abs(tileX * 97 + tileZ * 53) + 11;
    const count = 2 + (base % 5);
    const result = [];
    for (let i = 0; i < count; i++) {
      const angle = ((base + i * 47) % 360) * (Math.PI / 180);
      const r = 0.7 + ((base + i * 19) % 10) * 0.32;
      const h = 0.9 + ((base + i * 13) % 9) * 0.22;
      result.push({
        id: i,
        x: Math.cos(angle) * r,
        z: Math.sin(angle) * r,
        h,
        color: TREE_COLORS[(base + i) % TREE_COLORS.length],
      });
    }
    return result;
  }, [tileX, tileZ]);

  return (
    <>
      {trees.map((t) => (
        <TinyTree key={t.id} position={[t.x, 0, t.z]} height={t.h} color={t.color} />
      ))}
    </>
  );
}

// ─── Individual garden tile with hover interaction ────────────────────────────
function GardenTile({ tileX, tileZ, isCenter }) {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef();
  const liftRef = useRef(0);
  const scaleRef = useRef(1);

  const data = useMemo(
    () => (isCenter ? null : getTileData(tileX, tileZ)),
    [tileX, tileZ, isCenter]
  );

  useFrame(() => {
    if (!groupRef.current) return;
    const targetLift = hovered ? 0.45 : 0;
    const targetScale = hovered ? 1.06 : 1;
    liftRef.current += (targetLift - liftRef.current) * 0.12;
    scaleRef.current += (targetScale - scaleRef.current) * 0.12;
    groupRef.current.position.y = liftRef.current;
    groupRef.current.scale.setScalar(scaleRef.current);
  });

  const baseColor = isCenter ? "#4a7a40" : "#3e7b39";
  const borderColor = isCenter ? "#3cff6b" : "#2f5f2c";
  const borderOpacity = isCenter ? 0.85 : 0.55;

  return (
    <group
      ref={groupRef}
      position={[tileX * TILE_SPACING, 0, tileZ * TILE_SPACING]}
      onPointerEnter={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerLeave={() => setHovered(false)}
    >
      {/* Grass base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[TILE_SIZE, TILE_SIZE]} />
        <meshLambertMaterial color={baseColor} />
      </mesh>

      {/* Decorative border ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[TILE_SIZE / 2 + 0.1, TILE_SIZE / 2 + 0.4, 32]} />
        <meshBasicMaterial color={borderColor} transparent opacity={borderOpacity} />
      </mesh>

      {/* Square identity ring for center tile */}
      {isCenter && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[TILE_SIZE / 2 - 0.5, TILE_SIZE / 2 + 0.7, 4, 1, Math.PI / 4]} />
          <meshBasicMaterial color="#3cff6b" transparent opacity={0.45} />
        </mesh>
      )}

      {/* Hover glow overlay */}
      {hovered && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <planeGeometry args={[TILE_SIZE, TILE_SIZE]} />
          <meshBasicMaterial color="#7dff9e" transparent opacity={0.15} />
        </mesh>
      )}

      {/* Tree cluster — omit center (user's real 3D trees render there) */}
      {!isCenter && <TreeCluster tileX={tileX} tileZ={tileZ} />}

      {/* "My Garden" label on center */}
      {isCenter && (
        <Html position={[0, 2.2, 0]} center distanceFactor={28}>
          <div className="global-grid-my-label">📍 My Garden</div>
        </Html>
      )}

      {/* Hover stat popup */}
      {!isCenter && hovered && data && (
        <Html position={[0, 4.5, 0]} center distanceFactor={28}>
          <div className="global-grid-popup">
            <div className="global-grid-popup-name">{data.name}</div>
            <div className="global-grid-popup-divider" />
            <div className="global-grid-popup-stat-label">{data.statLabel}</div>
            <div className="global-grid-popup-stat-value">{data.statValue}</div>
          </div>
        </Html>
      )}
    </group>
  );
}

// ─── 4×4 grid ────────────────────────────────────────────────────────────────
export default function GlobalGrid() {
  const tiles = [];
  // −1 to +2 on each axis = 4 tiles, (0,0) is the user's center garden
  for (let x = -1; x <= 2; x++) {
    for (let z = -1; z <= 2; z++) {
      tiles.push(
        <GardenTile
          key={`${x}-${z}`}
          tileX={x}
          tileZ={z}
          isCenter={x === 0 && z === 0}
        />
      );
    }
  }

  return <>{tiles}</>;
}