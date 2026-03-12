import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, Polyline, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function getAngle(from, to) {
  const dy = to[0] - from[0];
  const dx = to[1] - from[1];
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

function makeTruckIcon(angleDeg = 0, iconUrl = null) {
  const adjustedAngle = angleDeg - 130; // Adjust so 0° points up

  if (iconUrl) {
    return L.divIcon({
      className: "truck-div-icon",
      html: `<div class=\"truck-wrap\" style=\"transform: rotate(${adjustedAngle}deg);\"><img src=\"${iconUrl}\" alt=\"truck\"/></div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
  }

  return L.divIcon({
    className: "truck-div-icon",
    html: `<div class="truck-wrap truck-emoji" style="transform: rotate(${adjustedAngle}deg);">🚚</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function statusToStageIndex(statusText, stopsCount) {
  const status = String(statusText || "").toLowerCase();
  if (stopsCount <= 1) return 0;

  if (status.includes("pickup")) return 0;
  if (status.includes("transit")) return Math.min(1, stopsCount - 1);
  if (status.includes("out")) return Math.max(0, stopsCount - 2);
  if (status.includes("deliver")) return stopsCount - 1;
  return 0;
}

export default function TrackingMap({ stops = [], currentStatus, truckIconUrl }) {
  const routeCoords = useMemo(() => stops.map((stop) => stop.coords), [stops]);
  const [truckPos, setTruckPos] = useState(routeCoords[0] || null);
  const [angle, setAngle] = useState(0);

  useEffect(() => {
    if (!routeCoords.length) {
      return;
    }

    if (routeCoords.length === 1) {
      setTruckPos(routeCoords[0]);
      setAngle(0);
      return;
    }

    const targetStage = statusToStageIndex(currentStatus, routeCoords.length);
    const finalSegmentIndex = Math.max(0, Math.min(targetStage, routeCoords.length - 2));

    let segmentIndex = 0;
    let segmentProgress = 0;
    let rafId = null;
    let pauseUntil = 0;

    const step = () => {
      const from = routeCoords[segmentIndex];
      const to = routeCoords[segmentIndex + 1] || from;

      const now = performance.now();
      if (now < pauseUntil) {
        rafId = requestAnimationFrame(step);
        return;
      }

      segmentProgress += 0.012;
      if (segmentProgress >= 1) {
        segmentProgress = 0;
        if (segmentIndex < finalSegmentIndex) {
          segmentIndex += 1;
          pauseUntil = now + 400;
        } else {
          setTruckPos(to);
          setAngle(getAngle(from, to));
          return;
        }
      }

      const lat = from[0] + (to[0] - from[0]) * segmentProgress;
      const lng = from[1] + (to[1] - from[1]) * segmentProgress;
      setTruckPos([lat, lng]);
      setAngle(getAngle(from, to));

      rafId = requestAnimationFrame(step);
    };

    setTruckPos(routeCoords[0]);
    rafId = requestAnimationFrame(step);

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [routeCoords, currentStatus]);

  if (!routeCoords.length) {
    return null;
  }

  const pickup = stops[0];
  const destination = stops[stops.length - 1];
  const mapCenter = truckPos || routeCoords[0];

  return (
    <div className="tracking-map-shell">
      <MapContainer center={mapCenter} zoom={6} scrollWheelZoom style={{ height: "320px", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Polyline positions={routeCoords} color="#22c55e" weight={4} opacity={0.8} />

        {stops.map((stop, index) => (
          <Marker key={`${stop.name}-${index}`} position={stop.coords}>
            <Popup>
              <strong>{stop.name}</strong>
              <div>{stop.status || "Transit Point"}</div>
              {index === 0 ? <div>Pickup Location</div> : null}
              {index === stops.length - 1 ? <div>Delivery Destination</div> : null}
              {index > 0 && index < stops.length - 1 ? <div>Transit Hub</div> : null}
            </Popup>
          </Marker>
        ))}

        {truckPos ? (
          <Marker position={truckPos} icon={makeTruckIcon(angle, truckIconUrl)}>
            <Popup>Shipment truck is moving</Popup>
          </Marker>
        ) : null}
      </MapContainer>

      <div className="tracking-map-legend">
        <span>Pickup: {pickup?.name || "—"}</span>
        <span>Destination: {destination?.name || "—"}</span>
      </div>
    </div>
  );
}
