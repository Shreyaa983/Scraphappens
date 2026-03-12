export default function InventoryPanel({ plants, selectedPlantId, onSelectPlant }) {
  return (
    <aside className="inventory-panel">
      <h3>Unlocked Plants</h3>

      <div className="inventory-list">
        {plants.length === 0 ? (
          <p className="inventory-empty">Unlock an achievement to receive your first plant.</p>
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
              <span className="inventory-emoji">{plant.icon || "🌳"}</span>
              <span className="inventory-label">{plant.label || "Tree"}</span>
              <div className="inventory-tooltip">
                <strong>{plant.label || "Tree"}</strong>
                <span>Unlocked by:</span>
                <span>{plant.achievement}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
