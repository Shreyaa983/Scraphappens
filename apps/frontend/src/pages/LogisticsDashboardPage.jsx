import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getLogisticsDashboard } from "../services/logisticsApi";

const INITIAL_METRICS = {
  total_shipments: 0,
  active_deliveries: 0,
  scheduled_pickups: 0,
  waste_moved_kg: 0,
};

export default function LogisticsDashboardPage({ token }) {
  const [metrics, setMetrics] = useState(INITIAL_METRICS);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setMessage("");
        const data = await getLogisticsDashboard(token);
        setMetrics({ ...INITIAL_METRICS, ...data });
      } catch (error) {
        setMessage(error.message || "Failed to fetch logistics metrics");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [token]);

  if (loading) {
    return <div className="loading-shell">Loading logistics dashboard…</div>;
  }

  return (
    <div className="page-stack">
      <section className="dashboard-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Logistics Intelligence</span>
            <h3>Circular Logistics Dashboard</h3>
          </div>
          <span className="section-tag">Live Metrics</span>
        </div>

        {message ? <p className="message">{message}</p> : null}

        <div className="stats-grid stats-grid-inline">
          <article className="stat-card">
            <span>Total Shipments</span>
            <strong>{metrics.total_shipments}</strong>
          </article>
          <article className="stat-card">
            <span>Active Deliveries</span>
            <strong>{metrics.active_deliveries}</strong>
          </article>
          <Link to="/pickup-scheduling" className="stat-card" style={{ textDecoration: 'none' }}>
            <span>Scheduled Pickups</span>
            <strong>{metrics.scheduled_pickups}</strong>
          </Link>
          <article className="stat-card">
            <span>Waste Transported (kg)</span>
            <strong>{metrics.waste_moved_kg}</strong>
          </article>
        </div>
      </section>
    </div>
  );
}
