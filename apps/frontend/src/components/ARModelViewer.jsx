import { useEffect, useRef } from "react";
import "@google/model-viewer/dist/model-viewer.min.js";
import couchModel from "../asessts/models/couch.glb";

// Material-to-model mapping
const MODEL_MAP = {
  "couch": couchModel,
  "sofa": couchModel,
  "seating": couchModel,
  "furniture": couchModel,
  "chair": couchModel,
  "table": couchModel,
  "wooden": couchModel,
};

// Fallback model
const DEFAULT_MODEL = couchModel;

function getModelForMaterial(material) {
  if (!material) return DEFAULT_MODEL;
  
  const searchText = [
    material.title,
    material.material_type,
    material.category,
    material.description,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  for (const [keyword, modelPath] of Object.entries(MODEL_MAP)) {
    if (searchText.includes(keyword)) {
      return modelPath;
    }
  }

  return DEFAULT_MODEL;
}

export default function ARModelViewer({ material, isOpen, onClose }) {
  const modelViewerRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !modelViewerRef.current) return;

    // Force re-render of model-viewer after modal is visible
    setTimeout(() => {
      if (modelViewerRef.current) {
        modelViewerRef.current.dismissPoster();
      }
    }, 100);
  }, [isOpen]);

  if (!isOpen) return null;

  const modelPath = getModelForMaterial(material);
  const modelTitle = material?.title || "3D Model";

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.95)",
        display: "flex",
        flexDirection: "column",
        zIndex: 9999,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 20px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          background: "rgba(0, 0, 0, 0.8)",
        }}
      >
        <h3 style={{ margin: 0, color: "#fff" }}>
          🔍 AR Preview: {modelTitle}
        </h3>
        <button
          onClick={onClose}
          style={{
            background: "rgba(255, 255, 255, 0.1)",
            border: "none",
            color: "#fff",
            padding: "8px 16px",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
        >
          ✕ Close
        </button>
      </div>

      {/* Model Viewer Container */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <model-viewer
          ref={modelViewerRef}
          src={modelPath}
          alt={modelTitle}
          ar
          ar-modes="webxr scene-viewer quick-look"
          camera-controls
          touch-action="pan-y"
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: "transparent",
          }}
        />
      </div>

      {/* Footer - AR Button */}
      <div
        style={{
          padding: "16px 20px",
          background: "rgba(0, 0, 0, 0.8)",
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          textAlign: "center",
        }}
      >
        <button
          onClick={() => modelViewerRef.current?.activateAR()}
          style={{
            background: "#22c55e",
            border: "none",
            color: "#fff",
            padding: "12px 20px",
            borderRadius: "10px",
            cursor: "pointer",
            fontSize: "1rem",
            fontWeight: "600",
          }}
        >
          📱 View in AR
        </button>

        <p style={{ color: "#9ca3af", fontSize: "0.85rem", marginTop: "8px" }}>
          Rotate with mouse | Pinch to zoom
        </p>
      </div>
    </div>
  );
}
