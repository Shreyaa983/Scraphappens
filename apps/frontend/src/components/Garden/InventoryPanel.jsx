import { Link } from "react-router-dom";

export default function InventoryPanel({ plants, selectedPlantId, onSelectPlant }) {
  const hasPlants = plants.length > 0;

  return (
    <section className="inventory-panel">
      {hasPlants ? (
        <>
          <div className="inventory-head">
            <h3>Unlocked Plants</h3>
            <span>Select one and place it on a tile in your garden</span>
          </div>

          <div className="inventory-list inventory-list-horizontal">
            {plants.map((plant) => (
              <article
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
                    <span className="inventory-subcopy">{plant.achievement || "Achievement Reward"}</span>
                  </div>
                </div>

                <button type="button" className="inventory-place-btn" onClick={() => onSelectPlant(plant.id)}>
                  Place in Garden
                </button>
                {plant.isNew ? <span className="inventory-badge">✨ {plant.badgeText || "NEW"}</span> : null}
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className="inventory-empty-collapsed">
          <p>No plants unlocked yet. Browse the marketplace to reuse materials and grow your garden.</p>
          <Link to="/" className="inline-link-button">Browse Marketplace</Link>
        </div>
      )}
    </section>
  );
}
