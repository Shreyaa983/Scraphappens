import { useEffect, useState } from "react";
import AchievementPopup from "../components/Garden/AchievementPopup";
import GardenScene from "../components/Garden/GardenScene";
import GardenStatsBar from "../components/Garden/GardenStatsBar";
import InventoryPanel from "../components/Garden/InventoryPanel";
import useSound from "../hooks/useSound";
import plantSound from "../asessts/sounds/plant.mp3";
import {
  consumePendingGardenRewards,
  createPlantFromAchievement,
  createUniqueId,
  loadLastUnlockedType,
  loadStoredPlacedTrees,
  loadStoredUnlockedPlants,
  persistLastUnlockedType,
  persistPlacedTrees,
  persistUnlockedPlants,
} from "../utils/gardenRewards";

export default function GardenPage({ user, pendingAchievement, onPendingAchievementHandled }) {
  const userId = user?.id || user?.sub || "guest";
  const [unlockedPlants, setUnlockedPlants] = useState(() => loadStoredUnlockedPlants(userId));
  const [placedTrees, setPlacedTrees] = useState(() => loadStoredPlacedTrees(userId));
  const [selectedPlantId, setSelectedPlantId] = useState(null);
  const [activeAchievement, setActiveAchievement] = useState(null);
  const [lastUnlockedType, setLastUnlockedType] = useState(() => loadLastUnlockedType(userId));
  const [isGlobalView, setIsGlobalView] = useState(false);
  const playPlantSound = useSound(plantSound);

  function enqueueAchievementPlant(reward, currentStoredTrees, currentStoredPlants, currentLastType) {
    if (!reward) {
      return null;
    }

    const knownAchievementIds = new Set([
      ...currentStoredTrees.map((tree) => tree.achievementId).filter(Boolean),
      ...currentStoredPlants.map((plant) => plant.achievementId).filter(Boolean),
      ...unlockedPlants.map((plant) => plant.achievementId).filter(Boolean),
      ...placedTrees.map((tree) => tree.achievementId).filter(Boolean),
    ]);

    if (reward.id && knownAchievementIds.has(reward.id)) {
      return null;
    }

    const plant = createPlantFromAchievement(reward, currentLastType);
    setUnlockedPlants((prev) => [...prev, plant]);
    setSelectedPlantId(plant.id);
    setLastUnlockedType(plant.type);
    setActiveAchievement({
      name: reward.name,
      reward: reward.reward?.plantLabel,
      icon: reward.reward?.icon,
      description: reward.description,
    });

    window.setTimeout(() => {
      setUnlockedPlants((prev) => prev.map((item) => (item.id === plant.id ? { ...item, isNew: false } : item)));
    }, 3500);

    return plant;
  }

  useEffect(() => {
    const storedTrees = loadStoredPlacedTrees(userId);
    const storedPlants = loadStoredUnlockedPlants(userId);
    let nextLastType = loadLastUnlockedType(userId);
    let nextSelectedPlantId = null;
    let newestAchievement = null;

    const knownAchievementIds = new Set([
      ...storedTrees.map((tree) => tree.achievementId).filter(Boolean),
      ...storedPlants.map((plant) => plant.achievementId).filter(Boolean),
    ]);

    const pendingRewards = consumePendingGardenRewards(userId);
    const incomingPlants = [];

    pendingRewards.forEach((reward) => {
      if (reward?.id && knownAchievementIds.has(reward.id)) {
        return;
      }

      const plant = createPlantFromAchievement(reward, nextLastType);
      nextLastType = plant.type;
      nextSelectedPlantId = plant.id;
      newestAchievement = reward;
      knownAchievementIds.add(plant.achievementId);
      incomingPlants.push(plant);
    });

    setPlacedTrees(storedTrees);
    setUnlockedPlants([...storedPlants, ...incomingPlants]);
    setLastUnlockedType(nextLastType);
    setSelectedPlantId(nextSelectedPlantId);
    setActiveAchievement(
      newestAchievement
        ? {
            name: newestAchievement.name,
            reward: newestAchievement.reward?.plantLabel,
            icon: newestAchievement.reward?.icon,
            description: newestAchievement.description,
          }
        : null
    );
  }, [userId]);

  useEffect(() => {
    if (!pendingAchievement) {
      return;
    }

    enqueueAchievementPlant(
      pendingAchievement,
      loadStoredPlacedTrees(userId),
      loadStoredUnlockedPlants(userId),
      loadLastUnlockedType(userId)
    );

    onPendingAchievementHandled?.();
  }, [pendingAchievement, onPendingAchievementHandled, userId]);

  useEffect(() => {
    persistPlacedTrees(userId, placedTrees);
  }, [placedTrees, userId]);

  useEffect(() => {
    persistUnlockedPlants(userId, unlockedPlants);
  }, [unlockedPlants, userId]);

  useEffect(() => {
    persistLastUnlockedType(userId, lastUnlockedType);
  }, [lastUnlockedType, userId]);

  useEffect(() => {
    if (!activeAchievement) {
      return undefined;
    }

    const hideTimer = setTimeout(() => {
      setActiveAchievement(null);
    }, 3500);

    return () => clearTimeout(hideTimer);
  }, [activeAchievement]);

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
        id: createUniqueId(),
        userId,
        x,
        z,
        position: { x, z },
        plantId: selectedPlantId,
        achievementId: selectedPlant.achievementId,
        achievement: selectedPlant.achievement,
        achievementDetails: selectedPlant.achievementDetails || null,
        treeType: selectedPlant.type,
        treeLabel: selectedPlant.label,
        icon: selectedPlant.icon,
        sourceOrderId: selectedPlant.sourceOrderId || null,
        placedAt: new Date().toISOString()
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
          <div className="garden-scene-toolbar">
            <div className={`garden-mode-pill${isGlobalView ? " garden-mode-pill-global" : ""}`}>
              <span className="garden-mode-pill-icon">{isGlobalView ? "🌍" : "🌱"}</span>
              <div className="garden-mode-pill-copy">
                <strong>{isGlobalView ? "Global Forest" : "My Garden"}</strong>
                <span>
                  {isGlobalView
                    ? "Explore platform-wide impact and connected gardens"
                    : "Place unlocked plants and keep growing your impact"}
                </span>
              </div>
            </div>

            <button
              className={`global-impact-btn${isGlobalView ? " global-impact-btn-active" : ""}`}
              onClick={() => setIsGlobalView((prev) => !prev)}
              title="Toggle between personal garden and global forest view"
            >
              <span className="global-impact-btn-icon">{isGlobalView ? "🌱" : "🌍"}</span>
              <span className="global-impact-btn-copy">
                <strong>{isGlobalView ? "Back to Garden" : "Open Global Forest"}</strong>
                <small>{isGlobalView ? "Return to your personal space" : "See the bigger impact picture"}</small>
              </span>
            </button>
          </div>

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