import { NavLink } from "react-router-dom";
import { useMemo } from "react";

const isSellerRole = (role) => role === "seller" || role === "supplier";
const isBuyerRole = (role) => role === "buyer";
const isVolunteerRole = (role) => role === "volunteer";

export default function Sidebar({ user, roleTitle, onLogout }) {
  const sidebarItems = useMemo(() => {
    const items = [
      { name: "Marketplace", path: "/" },
      { name: "AI Assistant", path: "/ai-assistant" },
      { name: "Garden", path: "/garden" },
      { name: "Logistics Dashboard", path: "/logistics-dashboard" },
      { name: "Pickup Scheduling", path: "/pickup-scheduling" }
    ];

    if (user && isSellerRole(user.role)) {
      items.push(
        { name: "My Listings", path: "/my-listings" },
        { name: "Seller Orders", path: "/seller-orders" }
      );
    }

    if (user && isBuyerRole(user.role)) {
      items.push(
        { name: "Cart", path: "/cart" },
        { name: "My Orders", path: "/my-orders" }
      );
    }

    return items;
  }, [user]);

  return (
    <aside className="sidebar">
      <div>
        <div className="brand-block sidebar-brand">
          <span className="brand-mark">S</span>
          <div>
            <h1>ScrapHappens</h1>
            <p>{roleTitle}</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {sidebarItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => 
                `sidebar-link ${isActive ? "sidebar-link-active" : ""}`
              }
            >
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="sidebar-footer">
        <p className="sidebar-user">{user?.name}</p>
        <p className="sidebar-role">{user?.role}</p>
        <button className="nav-button sidebar-logout" onClick={onLogout}>Logout</button>
      </div>
    </aside>
  );
}
