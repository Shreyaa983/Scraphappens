import GardenCanvas from "../components/GardenCanvas";
import { buyerGardenStats, sellerGardenStats, volunteerGardenStats } from "../data/mockData";

export default function GardenPage({ user }) {
  const stats = user.role === "supplier"
    ? sellerGardenStats
    : user.role === "buyer"
      ? buyerGardenStats
      : volunteerGardenStats;

  return (
    <div className="page-stack">
      <section className="dashboard-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Garden Dashboard</span>
            <h3>Growth from circular impact</h3>
          </div>
          <span className="section-tag">Canvas</span>
        </div>

        <GardenCanvas itemsReused={stats.itemsReused} wasteDivertedKg={stats.wasteDivertedKg} />
      </section>

      <section className="dashboard-grid garden-grid">
        <article className="dashboard-card">
          <div className="section-heading">
            <h3>{user.role === "supplier" ? "Seller Dashboard" : user.role === "buyer" ? "Buyer Dashboard" : "Volunteer Dashboard"}</h3>
          </div>

          {user.role === "supplier" ? (
            <>
              <p className="session-copy">Total Carbon Offset: {stats.carbonOffsetKg} kg CO₂</p>
              <ul className="quick-list">
                {stats.listings.map((listing) => (
                  <li key={listing}>{listing}</li>
                ))}
              </ul>
            </>
          ) : user.role === "buyer" ? (
            <>
              <p className="session-copy">Materials Saved: {stats.materialsSaved}</p>
              <ul className="quick-list">
                {stats.orderHistory.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <p className="session-copy">Community Hours: {stats.communityHours}</p>
              <ul className="quick-list">
                {stats.tasks.map((task) => (
                  <li key={task}>{task}</li>
                ))}
              </ul>
            </>
          )}
        </article>

        <article className="dashboard-card">
          <div className="section-heading">
            <h3>Garden Logic</h3>
          </div>
          <ul className="quick-list">
            <li>If items reused is above 5, a stronger flower bloom appears.</li>
            <li>If waste diverted is above 50kg, a tree is rendered in the canvas.</li>
            <li>More reuse activity can grow more plants in future releases.</li>
          </ul>
        </article>
      </section>
    </div>
  );
}
