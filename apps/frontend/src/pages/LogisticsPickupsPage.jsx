import React, { useState, useEffect } from "react";
import { getPickupSchedule } from "../services/logisticsApi";
import { useTranslation } from "../hooks/useTranslation";

export default function LogisticsPickupsPage({ token }) {
  const { t } = useTranslation();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadSchedule() {
      try {
        setLoading(true);
        setMessage("");
        const data = await getPickupSchedule(token);
        setBatches(data.batches || []);
      } catch (error) {
        setMessage(error.message || t("Failed to load pickup schedule"));
      } finally {
        setLoading(false);
      }
    }

    loadSchedule();
  }, [token]);

  if (loading) {
    return <div className="loading-shell">{t("Loading pickup schedule…")}</div>;
  }

  return (
    <div className="page-stack">
      <section className="dashboard-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{t("Smart Pickup Scheduling")}</span>
            <h3>{t("Grouped Pickup Batches")}</h3>
          </div>
          <span className="section-tag">{t("Logistics")}</span>
        </div>

        {message ? <p className="message">{message}</p> : null}

        {batches.length === 0 ? (
          <div className="empty-state" style={{ marginTop: 8 }}>
            <p>{t("No grouped pickups yet.")}</p>
            <span>{t("Pickups will appear here once shipment creation requests are made.")}</span>
          </div>
        ) : (
          <div className="dashboard-panels">
            {batches.map((batch) => (
              <article key={batch.batch_id} className="market-card logistics-batch-card">
                <h4>{t("Batch Pickup")} #{batch.batch_id}</h4>
                <div className="quick-list" style={{ paddingLeft: 18 }}>
                  {batch.pickups?.map((pickup, idx) => (
                    <li key={`${batch.batch_id}-${idx}`}>
                      {pickup.supplier} – {pickup.material}
                    </li>
                  ))}
                </div>
                <div className="integration-card" style={{ marginTop: 12 }}>
                  <h4>{t("Route")}</h4>
                  <p>{(batch.optimized_route || []).map(r => t(r)).join(" → ") || t("Route not available")}</p>
                </div>
                <div className="logistics-map-placeholder">{t("Map visualization placeholder")}</div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
