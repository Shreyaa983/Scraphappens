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
  const [viewMode, setViewMode] = useState("garden");
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

  const allAchievementPlants = [...placedTrees, ...unlockedPlants];
  const uniqueAchievementMap = new Map();
  allAchievementPlants.forEach((item) => {
    const key = item.achievementId || item.achievement || item.id;
    if (!uniqueAchievementMap.has(key)) {
      uniqueAchievementMap.set(key, {
        achievement: item.achievement || item.achievementDetails?.name || "Circular Action",
        icon: item.icon || "🌱",
        label: item.treeLabel || item.label || "Plant",
      });
    }
  });
  const achievementItems = Array.from(uniqueAchievementMap.values());

  return (
    <div className="garden-page">
      <AchievementPopup achievement={activeAchievement} />

      <section className="garden-top-shell">
        <div className="garden-top-controls">
          <div className="garden-view-toggle" role="tablist" aria-label="Garden views">
            <button
              type="button"
              className={`garden-view-toggle-btn${viewMode === "garden" ? " active" : ""}`}
              onClick={() => setViewMode("garden")}
            >
              Garden View
            </button>
            <button
              type="button"
              className={`garden-view-toggle-btn${viewMode === "achievement" ? " active" : ""}`}
              onClick={() => setViewMode("achievement")}
            >
              Achievement View
            </button>
          </div>

          <button
            type="button"
            className={`global-forest-btn${isGlobalView ? " active" : ""}`}
            onClick={() => {
              setIsGlobalView((prev) => !prev);
              setViewMode("garden");
            }}
          >
            {isGlobalView ? "Back to My Garden" : "Global Forest"}
          </button>
        </div>

        <section className="garden-scene-shell">
          <GardenScene
            placedTrees={placedTrees}
            selectedPlantId={selectedPlantId}
            onTilePlace={placeTree}
            globalView={isGlobalView}
          />

          {viewMode === "achievement" && !isGlobalView ? (
            <div className="achievement-view-overlay">
              <h4>Achievement Plants</h4>
              {achievementItems.length === 0 ? (
                <p>No achievements unlocked yet. Complete sustainable marketplace actions to grow your garden.</p>
              ) : (
                <div className="achievement-view-grid">
                  {achievementItems.map((item, idx) => (
                    <article key={`${item.achievement}-${idx}`} className="achievement-view-item">
                      <span className="achievement-view-icon">{item.icon}</span>
                      <div>
                        <strong>{item.achievement}</strong>
                        <p>{item.label}</p>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </section>
      </section>

      <InventoryPanel
        plants={unlockedPlants}
        selectedPlantId={selectedPlantId}
        onSelectPlant={setSelectedPlantId}
      />

      <section className="garden-scroll-layer">
        <GardenStatsBar globalView={isGlobalView} placedTrees={placedTrees} />

        <section className="garden-charts-shell">
          <header>
            <p className="eyebrow">Impact Charts</p>
            <h3>Your Sustainability Trends</h3>
          </header>
          <div className="garden-chart-grid">
            <article className="garden-chart-card">
              <h4>Materials Reused by Category</h4>
              <div className="mini-bars">
                <div><span>Wood</span><i style={{ width: `${Math.max(25, placedTrees.length * 8)}%` }} /></div>
                <div><span>Metal</span><i style={{ width: `${Math.max(20, placedTrees.length * 6)}%` }} /></div>
                <div><span>Fabric</span><i style={{ width: `${Math.max(18, placedTrees.length * 5)}%` }} /></div>
                <div><span>Plastic</span><i style={{ width: `${Math.max(14, placedTrees.length * 4)}%` }} /></div>
              </div>
            </article>

            <article className="garden-chart-card">
              <h4>Weekly Activity</h4>
              <div className="mini-columns">
                {[2, 4, 3, 5, 6, 4, 7].map((val, idx) => (
                  <span key={idx} style={{ height: `${14 + val * 10}px` }} />
                ))}
              </div>
            </article>

            <article className="garden-chart-card">
              <h4>Achievement Timeline</h4>
              <ul className="timeline-list">
                {achievementItems.slice(0, 5).map((item, idx) => (
                  <li key={`${item.achievement}-${idx}`}>
                    <span>{item.icon}</span>
                    <p>{item.achievement}</p>
                  </li>
                ))}
                {achievementItems.length === 0 ? <li><p>No milestones yet</p></li> : null}
              </ul>
            </article>
          </div>
        </section>
      </section>
    </div>
  );
}