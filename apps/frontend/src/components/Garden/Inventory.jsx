export default function Inventory({ onDragStart }) {
  return (
    <div
      style={{
        position: "absolute",
        top: 20,
        left: 20,
        background: "#1e1e1e",
        padding: 20,
        borderRadius: 10,
        color: "white"
      }}
    >
      <h3>Unlocked Plants</h3>

      <div
        draggable
        onDragStart={(e) => onDragStart(e, "tree")}
        style={{
          fontSize: 40,
          cursor: "grab",
          filter: "drop-shadow(0 0 10px #00ff88)"
        }}
      >
        🌳
      </div>
    </div>
  );
}