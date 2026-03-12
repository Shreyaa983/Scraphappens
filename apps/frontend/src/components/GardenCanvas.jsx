import { useEffect, useRef } from "react";

function drawFlower(ctx, x, y, color) {
  ctx.save();
  ctx.strokeStyle = "#3f8f58";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 45);
  ctx.stroke();

  ctx.fillStyle = color;
  for (let i = 0; i < 5; i += 1) {
    const angle = (Math.PI * 2 * i) / 5;
    ctx.beginPath();
    ctx.arc(x + Math.cos(angle) * 16, y - 58 + Math.sin(angle) * 16, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#facc15";
  ctx.beginPath();
  ctx.arc(x, y - 58, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawTree(ctx, x, y) {
  ctx.save();
  ctx.fillStyle = "#5b3a29";
  ctx.fillRect(x - 10, y - 85, 20, 85);
  ctx.fillStyle = "#2e7d32";
  ctx.beginPath();
  ctx.arc(x, y - 110, 42, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x - 28, y - 95, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 28, y - 95, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export default function GardenCanvas({ itemsReused, wasteDivertedKg }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#101827");
    gradient.addColorStop(1, "#07150d");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#0f3d1f";
    ctx.fillRect(0, canvas.height - 90, canvas.width, 90);

    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.beginPath();
    ctx.arc(460, 70, 42, 0, Math.PI * 2);
    ctx.fill();

    drawFlower(ctx, 90, 250, itemsReused > 5 ? "#f472b6" : "#93c5fd");
    drawFlower(ctx, 160, 255, itemsReused > 10 ? "#a78bfa" : "#fde68a");
    drawFlower(ctx, 230, 252, wasteDivertedKg > 25 ? "#34d399" : "#fca5a5");

    if (itemsReused > 5) {
      drawFlower(ctx, 310, 248, "#c4b5fd");
    }

    if (wasteDivertedKg > 50) {
      drawTree(ctx, 410, 270);
    }

    ctx.fillStyle = "#e5e7eb";
    ctx.font = "600 18px Inter, Arial, sans-serif";
    ctx.fillText(`Items reused: ${itemsReused}`, 28, 36);
    ctx.fillText(`Waste diverted: ${wasteDivertedKg}kg`, 28, 62);
  }, [itemsReused, wasteDivertedKg]);

  return <canvas ref={canvasRef} width={520} height={280} className="garden-canvas" />;
}
