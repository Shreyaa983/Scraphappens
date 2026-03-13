import { NavLink } from "react-router-dom";
import { useMemo } from "react";
import LanguageSelector from "./LanguageSelector";
import { useTranslation } from "../hooks/useTranslation";

const isSellerRole = (role) => role === "seller" || role === "supplier";
const isBuyerRole = (role) => role === "buyer";
const isVolunteerRole = (role) => role === "volunteer";

export default function Sidebar({ user, roleTitle, onLogout }) {
  const { t } = useTranslation();
  const sidebarItems = useMemo(() => {
    const items = [
      { name: "Marketplace", path: "/" },
      { name: "My Dashboard", path: "/my-dashboard" },
      { name: "AI Assistant", path: "/ai-assistant" },
      { name: "Garden", path: "/garden" }
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
        { name: "My Orders", path: "/my-orders" },
        { name: "DIY Inspiration", path: "/diy" }
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
            <p>{t(roleTitle)}</p>
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
              {t(item.name)}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="sidebar-footer">
        <div style={{ marginBottom: '1rem' }}>
          <LanguageSelector />
        </div>
        <p className="sidebar-user">{user?.name}</p>
        <p className="sidebar-role">{t(user?.role)}</p>
        <button className="nav-button sidebar-logout" onClick={onLogout}>{t("Logout")}</button>
      </div>
    </aside>
  );
}
