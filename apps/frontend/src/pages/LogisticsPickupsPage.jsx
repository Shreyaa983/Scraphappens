import { useEffect, useState } from "react";
import { getPickupSchedule } from "../services/logisticsApi";

export default function LogisticsPickupsPage({ token }) {
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
        setMessage(error.message || "Failed to load pickup schedule");
      } finally {
        setLoading(false);
      }
    }

    loadSchedule();
  }, [token]);

  if (loading) {
    return <div className="loading-shell">Loading pickup schedule…</div>;
  }

  return (
    <div className="page-stack">
      <section className="dashboard-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Smart Pickup Scheduling</span>
            <h3>Grouped Pickup Batches</h3>
          </div>
          <span className="section-tag">Logistics</span>
        </div>

        {message ? <p className="message">{message}</p> : null}

        {batches.length === 0 ? (
          <div className="empty-state" style={{ marginTop: 8 }}>
            <p>No grouped pickups yet.</p>
            <span>Pickups will appear here once shipment creation requests are made.</span>
          </div>
        ) : (
          <div className="dashboard-panels">
            {batches.map((batch) => (
              <article key={batch.batch_id} className="market-card logistics-batch-card">
                <h4>Batch Pickup #{batch.batch_id}</h4>
                <div className="quick-list" style={{ paddingLeft: 18 }}>
                  {batch.pickups?.map((pickup, idx) => (
                    <li key={`${batch.batch_id}-${idx}`}>
                      {pickup.supplier} – {pickup.material}
                    </li>
                  ))}
                </div>
                <div className="integration-card" style={{ marginTop: 12 }}>
                  <h4>Route</h4>
                  <p>{(batch.optimized_route || []).join(" → ") || "Route not available"}</p>
                </div>
                <div className="logistics-map-placeholder">Map visualization placeholder</div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
