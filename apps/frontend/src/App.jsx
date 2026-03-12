import { useEffect, useMemo, useState } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { getCurrentUser, login, register } from "./api";
import AuthPanel from "./components/AuthPanel";
import Sidebar from "./components/Sidebar";
import OrderAchievementOverlay from "./components/Garden/OrderAchievementOverlay";
import CreateListing from "./pages/CreateListing";
import GardenPage from "./pages/GardenPage";
import LogisticsDashboardPage from "./pages/LogisticsDashboardPage";
import LogisticsPickupsPage from "./pages/LogisticsPickupsPage";
import MaterialDetailPage from "./pages/MaterialDetailPage";
import MarketplacePage from "./pages/MarketplacePage";
import MyListingsPage from "./pages/MyListingsPage";
import CartPage from "./pages/CartPage";
import AIChatbot from "./pages/AIChatbot";
import { BuyerOrdersPage, SellerOrdersPage } from "./pages/OrdersPage";
import { queuePendingGardenReward } from "./utils/gardenRewards";

const roles = ["seller", "buyer", "volunteer"];

const isSellerRole = (role) => role === "seller" || role === "supplier";
const isBuyerRole = (role) => role === "buyer";
const isVolunteerRole = (role) => role === "volunteer";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState("register");
  const [showAuth, setShowAuth] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", password: "", role: roles[0],
    street_address: "", city: "", state: "", country: "", pincode: ""
  });
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [loadingUser, setLoadingUser] = useState(Boolean(localStorage.getItem("token")));
  const [orderAchievement, setOrderAchievement] = useState(null);
  const [pendingGardenAchievement, setPendingGardenAchievement] = useState(null);
  const [marketplaceFilters, setMarketplaceFilters] = useState({
    search: "", category: "All", condition: "All",
  });

  useEffect(() => {
    async function restoreUser() {
      if (!token) { setLoadingUser(false); return; }
      try {
        const response = await getCurrentUser(token);
        setUser(response.user);
      } catch {
        localStorage.removeItem("token");
        setToken("");
        setUser(null);
      } finally {
        setLoadingUser(false);
      }
    }
    restoreUser();
  }, [token]);

  const roleTitle = useMemo(() => {
    if (!user) return "Marketplace";
    if (isSellerRole(user.role)) return "Seller Dashboard";
    if (isBuyerRole(user.role)) return "Buyer Dashboard";
    return "Volunteer Dashboard";
  }, [user]);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    setMessage("");
    try {
      const payload = mode === "register" ? form : { email: form.email, password: form.password };
      const response = mode === "register" ? await register(payload) : await login(payload);
      setToken(response.token);
      setUser(response.user);
      localStorage.setItem("token", response.token);
      setShowAuth(false);
      navigate("/");
    } catch (error) {
      setMessage(error.message);
    }
  }

  function onLogout() {
    setToken("");
    setUser(null);
    localStorage.removeItem("token");
    navigate("/");
  }

  function openAuth(nextMode) {
    setMode(nextMode);
    setShowAuth(true);
    setMessage("");
  }

  function handleFilterChange(key, value) {
    setMarketplaceFilters((prev) => ({ ...prev, [key]: value }));
  }

  function handleOrderPlaced(result) {
    const achievement = result?.achievement || null;
    const userId = user?.id || user?.sub;
    if (achievement && userId) queuePendingGardenReward(userId, achievement);
    setPendingGardenAchievement(achievement);
    setOrderAchievement(achievement || {
      name: "Circular Purchase Confirmed",
      description: "Your order has been recorded as a circular action.",
      reward: { plantLabel: "Circular Sapling", icon: "🌱" },
      impact: { display: "Circular impact recorded" }
    });
    window.setTimeout(() => {
      setOrderAchievement(null);
      navigate("/garden");
    }, 2200);
  }

  if (loadingUser) {
    return (
      <main className="landing-page">
        <div className="loading-shell">Loading your marketplace...</div>
      </main>
    );
  }

  if (token && user) {
    return (
      <main className="dashboard-page">
        <Sidebar user={user} roleTitle={roleTitle} onLogout={onLogout} />

        <section className="dashboard-main">
          <Routes>
            <Route path="/" element={
              <MarketplacePage
                user={user}
                filters={marketplaceFilters}
                onFilterChange={handleFilterChange}
              />
            } />
            <Route path="/material/:id" element={<MaterialDetailPage user={user} />} />
            <Route path="/create-listing" element={<CreateListing user={user} token={token} />} />
            <Route path="/edit-listing/:id" element={<CreateListing user={user} token={token} />} />
            <Route path="/ai-assistant" element={<AIChatbot />} />
            <Route path="/garden" element={
              <GardenPage
                user={user}
                pendingAchievement={pendingGardenAchievement}
                onPendingAchievementHandled={() => setPendingGardenAchievement(null)}
              />
            } />
            <Route path="/logistics-dashboard" element={<LogisticsDashboardPage token={token} />} />
            <Route path="/pickup-scheduling" element={<LogisticsPickupsPage token={token} />} />
            
            {isSellerRole(user.role) && (
              <>
                <Route path="/my-listings" element={<MyListingsPage token={token} />} />
                <Route path="/seller-orders" element={<SellerOrdersPage token={token} />} />
              </>
            )}

            {isBuyerRole(user.role) && (
              <>
                <Route path="/cart" element={<CartPage token={token} user={user} onOrderPlaced={handleOrderPlaced} />} />
                <Route path="/my-orders" element={<BuyerOrdersPage token={token} />} />
              </>
            )}

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          {message ? <p className="message dashboard-message">{message}</p> : null}
          <OrderAchievementOverlay achievement={orderAchievement} />
        </section>
      </main>
    );
  }

  return (
    <main className="landing-page">
      <nav className="navbar">
        <div className="brand-block">
          <span className="brand-mark">S</span>
          <div>
            <h1>ScrapHappens</h1>
            <p>Smart circular material marketplace</p>
          </div>
        </div>
        <div className="nav-actions">
          <button className="nav-button nav-button-secondary" onClick={() => openAuth("login")}>Login</button>
          <button className="nav-button" onClick={() => openAuth("register")}>Register</button>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Circular supply chain platform</span>
          <h2>Turn leftover materials into useful inventory, fast.</h2>
          <p>
            A platform for suppliers, buyers, and volunteers with role-based access,
            JWT authentication, and a live circular materials marketplace.
          </p>

          <div className="hero-actions">
            <button className="hero-button" onClick={() => openAuth("register")}>Get Started</button>
            <button className="hero-button hero-button-muted" onClick={() => openAuth("login")}>I already have an account</button>
          </div>

          {message ? <p className="message">{message}</p> : null}
        </div>

        {showAuth ? (
          <AuthPanel
            mode={mode}
            form={form}
            onFieldChange={updateField}
            onClose={() => setShowAuth(false)}
            onSubmit={onSubmit}
          />
        ) : (
          <div className="feature-grid">
            <article className="feature-card">
              <h3>Supplier</h3>
              <p>List extra stock, fabric scraps, and reusable material.</p>
            </article>
            <article className="feature-card">
              <h3>Buyer</h3>
              <p>Discover available material inventory and place requests quickly.</p>
            </article>
            <article className="feature-card">
              <h3>Volunteer</h3>
              <p>Coordinate collection, sorting, and community distribution.</p>
            </article>
          </div>
        )}
      </section>
    </main>
  );
}
