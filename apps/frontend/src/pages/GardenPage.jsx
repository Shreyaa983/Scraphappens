import { useEffect, useState } from "react";
import AchievementPopup from "../components/Garden/AchievementPopup";
import GardenScene from "../components/Garden/GardenScene";
import GardenStatsBar from "../components/Garden/GardenStatsBar";
import InventoryPanel from "../components/Garden/InventoryPanel";
import UnlockAchievementButton from "../components/Garden/UnlockAchievementButton";
import useSound from "../hooks/useSound";
import plantSound from "../asessts/sounds/plant.mp3";

const TREE_VARIANTS = [
  { type: "plant1", label: "Plant 1", icon: "🌳" },
  { type: "plant2", label: "Plant 2", icon: "🌲" },
  { type: "plant3", label: "Plant 3", icon: "🌴" },
  { type: "plant4", label: "Plant 4", icon: "🌵" },
  { type: "plant5", label: "Plant 5", icon: "🌿" }
];

function getRandomVariantNoRepeat(lastType) {
  const candidates = TREE_VARIANTS.filter((variant) => variant.type !== lastType);
  const pool = candidates.length > 0 ? candidates : TREE_VARIANTS;
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}

function createUniqueId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
}

export default function GardenPage() {
  const [unlockedPlants, setUnlockedPlants] = useState([]);
  const [placedTrees, setPlacedTrees] = useState(() => {
    try {
      const savedTrees = localStorage.getItem("gardenTrees");
      return savedTrees ? JSON.parse(savedTrees) : [];
    } catch {
      return [];
    }
  });
  const [selectedPlantId, setSelectedPlantId] = useState(null);
  const [activeAchievement, setActiveAchievement] = useState(null);
  const [lastUnlockedType, setLastUnlockedType] = useState(null);
  const [isGlobalView, setIsGlobalView] = useState(false);
  const playPlantSound = useSound(plantSound);

  useEffect(() => {
    localStorage.setItem("gardenTrees", JSON.stringify(placedTrees));
  }, [placedTrees]);

  useEffect(() => {
    if (!activeAchievement) {
      return undefined;
    }

    const hideTimer = setTimeout(() => {
      setActiveAchievement(null);
    }, 3500);

    return () => clearTimeout(hideTimer);
  }, [activeAchievement]);

  function unlockAchievement() {
    const achievementName = "First Scrap Listed";
    const randomVariant = getRandomVariantNoRepeat(lastUnlockedType);
    const plant = {
      id: createUniqueId(),
      type: randomVariant.type,
      label: randomVariant.label,
      icon: randomVariant.icon,
      achievement: achievementName,
      isNew: true
    };

    setUnlockedPlants((prev) => [...prev, plant]);
    setSelectedPlantId(plant.id);
    setLastUnlockedType(randomVariant.type);
    setActiveAchievement({
      name: achievementName,
      reward: randomVariant.label,
      icon: randomVariant.icon
    });

    setTimeout(() => {
      setUnlockedPlants((prev) => prev.map((item) => (item.id === plant.id ? { ...item, isNew: false } : item)));
    }, 3500);
  }

  function placeTree(x, z) {
    if (!selectedPlantId) {
      return;
    }

    const selectedPlant = unlockedPlants.find((plant) => plant.id === selectedPlantId);
    if (!selectedPlant) {
      return;
    }

    setPlacedTrees((prev) => [
      ...prev,
      {
        id: Date.now(),
        x,
        z,
        plantId: selectedPlantId,
        achievement: selectedPlant.achievement,
        treeType: selectedPlant.type,
        treeLabel: selectedPlant.label,
        icon: selectedPlant.icon
      }
    ]);

    setUnlockedPlants((prev) => prev.filter((plant) => plant.id !== selectedPlantId));
    setSelectedPlantId(null);

    playPlantSound();
  }

  return (
    <div className="garden-page">
      <AchievementPopup achievement={activeAchievement} />

      <div className="garden-layout">
        <InventoryPanel
          plants={unlockedPlants}
          selectedPlantId={selectedPlantId}
          onSelectPlant={setSelectedPlantId}
        />

        <section className="garden-scene-shell">
          {!isGlobalView ? <UnlockAchievementButton onUnlock={unlockAchievement} /> : null}

          <button
            className="global-impact-btn"
            onClick={() => setIsGlobalView((prev) => !prev)}
            title="Toggle global circular forest view"
          >
            {isGlobalView ? "🌱 Back to Garden" : "🌍 Global View"}
          </button>

          <GardenScene
            placedTrees={placedTrees}
            selectedPlantId={selectedPlantId}
            onTilePlace={placeTree}
            globalView={isGlobalView}
          />
        </section>
      </div>

      {/* ── Stats bar below canvas ── */}
      <GardenStatsBar globalView={isGlobalView} placedTrees={placedTrees} />
    </div>
  );
}