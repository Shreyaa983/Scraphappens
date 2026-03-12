import { Link } from "react-router-dom";

export default function InventoryPanel({ plants, selectedPlantId, onSelectPlant }) {
  return (
    <aside className="inventory-panel">
      <h3>Unlocked Plants</h3>

      <div className="inventory-list">
        {plants.length === 0 ? (
          <p className="inventory-empty">
            No plants yet. <Link to="/" className="inline-link-button">Browse marketplace</Link> to find materials and earn rewards.
          </p>
        ) : (
          plants.map((plant) => (
            <div
              key={plant.id}
              className={`inventory-item ${plant.isNew ? "inventory-item-new" : ""} ${selectedPlantId === plant.id ? "inventory-item-selected" : ""}`}
              draggable
              role="button"
              tabIndex={0}
              onDragStart={(event) => {
                event.dataTransfer.setData("text/plain", String(plant.id));
                onSelectPlant(plant.id);
              }}
              onClick={() => onSelectPlant(plant.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelectPlant(plant.id);
                }
              }}
            >
              <div className="inventory-item-main">
                <span className="inventory-emoji">{plant.icon || "🌳"}</span>
                <div className="inventory-copy">
                  <span className="inventory-label">{plant.label || "Tree"}</span>
                  {plant.isAchievementPlant ? (
                    <span className="inventory-subcopy">New Achievement Plant</span>
                  ) : null}
                </div>
              </div>

              {plant.isNew ? <span className="inventory-badge">✨ {plant.badgeText || "NEW"}</span> : null}

              <div className="inventory-tooltip">
                <strong>{plant.label || "Tree"}</strong>
                <span>Unlocked by:</span>
                <span>{plant.achievement}</span>
                {plant.achievementDetails?.materialSummary ? (
                  <>
                    <span>Material reused:</span>
                    <span>{plant.achievementDetails.materialSummary}</span>
                  </>
                ) : null}
                {plant.achievementDetails?.impact?.display ? (
                  <>
                    <span>Impact:</span>
                    <span>{plant.achievementDetails.impact.display}</span>
                  </>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
