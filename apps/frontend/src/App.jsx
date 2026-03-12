import { useEffect, useMemo, useState } from "react";
import { getCurrentUser, login, register } from "./api";
import AuthPanel from "./components/AuthPanel";
import CreateListing from "./pages/CreateListing";
import GardenPage from "./pages/GardenPage";
import MaterialDetailPage from "./pages/MaterialDetailPage";
import MarketplacePage from "./pages/MarketplacePage";
import MyListingsPage from "./pages/MyListingsPage";
import CartPage from "./pages/CartPage";
import AIChatbot from "./pages/AIChatbot";
import { BuyerOrdersPage, SellerOrdersPage } from "./pages/OrdersPage";

const roles = ["supplier", "buyer", "volunteer"];

export default function App() {
  const [mode, setMode] = useState("register");
  const [showAuth, setShowAuth] = useState(false);
  const [activeSection, setActiveSection] = useState("Marketplace");
  const [marketplaceView, setMarketplaceView] = useState("browse"); // browse | create | edit
  const [editItem, setEditItem] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null); // for modal
  const [form, setForm] = useState({ name: "", email: "", password: "", role: roles[0] });
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [loadingUser, setLoadingUser] = useState(Boolean(localStorage.getItem("token")));
  const [marketplaceFilters, setMarketplaceFilters] = useState({
    search: "",
    category: "All",
    condition: "All",
  });

  const sidebarItems = useMemo(() => {
    const base = ["Marketplace", "My Listings", "Cart", "My Orders", "AI Assistant", "Garden"];
    if (user?.role === "supplier") {
      base.push("Seller Orders");
    }
    return base;
  }, [user]);

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
    if (user.role === "supplier") return "Seller Dashboard";
    if (user.role === "buyer") return "Buyer Dashboard";
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
      setActiveSection("Marketplace");
      setMarketplaceView("browse");
    } catch (error) {
      setMessage(error.message);
    }
  }

  function onLogout() {
    setToken("");
    setUser(null);
    localStorage.removeItem("token");
    setActiveSection("Marketplace");
    setMarketplaceView("browse");
    setSelectedProduct(null);
    setEditItem(null);
  }

  function openAuth(nextMode) {
    setMode(nextMode);
    setShowAuth(true);
    setMessage("");
  }

  function handleSidebarChange(section) {
    setActiveSection(section);
    setMarketplaceView("browse");
    setSelectedProduct(null);
    setEditItem(null);
  }

  function handleFilterChange(key, value) {
    setMarketplaceFilters((prev) => ({ ...prev, [key]: value }));
  }

  // Open full-page detail view
  function openProductDetail(product) {
    setSelectedProduct(product);
    setMarketplaceView("detail");
  }

  // From detail page → edit
  function openEdit(item) {
    setEditItem(item);
    setMarketplaceView("edit");
    setActiveSection("Marketplace");
  }

  // From My Listings → edit
  function openEditFromMyListings(item) {
    setEditItem(item);
    setMarketplaceView("edit");
    setActiveSection("My Listings"); // stays on same section
  }

  function goBackFromForm() {
    setMarketplaceView("browse");
    setEditItem(null);
    setSelectedProduct(null);
  }

  function renderMarketplaceContent() {
    if (marketplaceView === "detail" && selectedProduct) {
      return (
        <MaterialDetailPage
          material={selectedProduct}
          user={user}
          onBack={() => { setMarketplaceView("browse"); setSelectedProduct(null); }}
          onEdit={openEdit}
        />
      );
    }
    if (marketplaceView === "create") {
      return <CreateListing user={user} token={token} onBack={goBackFromForm} />;
    }
    if (marketplaceView === "edit" && editItem) {
      return <CreateListing user={user} token={token} editItem={editItem} onBack={goBackFromForm} />;
    }
    return (
      <MarketplacePage
        user={user}
        filters={marketplaceFilters}
        onFilterChange={handleFilterChange}
        onSelectProduct={openProductDetail}
        onCreateClick={() => setMarketplaceView("create")}
      />
    );
  }

  function renderSectionContent() {
    if (activeSection === "AI Assistant") return <AIChatbot />;
    if (activeSection === "Cart") {
      return <CartPage token={token} onOrderPlaced={() => setActiveSection("My Orders")} />;
    }
    if (activeSection === "My Orders") {
      return <BuyerOrdersPage token={token} />;
    }
    if (activeSection === "Seller Orders") {
      return <SellerOrdersPage token={token} />;
    }
    if (activeSection === "Garden") return <GardenPage user={user} />;
    if (activeSection === "My Listings") {
      if (marketplaceView === "edit" && editItem) {
        return <CreateListing user={user} token={token} editItem={editItem} onBack={() => { setMarketplaceView("browse"); setEditItem(null); }} />;
      }
      return <MyListingsPage token={token} onEdit={openEditFromMyListings} />;
    }
    return renderMarketplaceContent();
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
                <button
                  key={item}
                  type="button"
                  className={`sidebar-link ${activeSection === item ? "sidebar-link-active" : ""}`}
                  onClick={() => handleSidebarChange(item)}
                >
                  {item}
                </button>
              ))}
            </nav>
          </div>

          <div className="sidebar-footer">
            <p className="sidebar-user">{user.name}</p>
            <p className="sidebar-role">{user.role}</p>
            <button className="nav-button sidebar-logout" onClick={onLogout}>Logout</button>
          </div>
        </aside>

        <section className="dashboard-main">
          {renderSectionContent()}
          {message ? <p className="message dashboard-message">{message}</p> : null}
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
          {!token ? (
            <>
              <button className="nav-button nav-button-secondary" onClick={() => openAuth("login")}>Login</button>
              <button className="nav-button" onClick={() => openAuth("register")}>Register</button>
            </>
          ) : (
            <button className="nav-button" onClick={onLogout}>Logout</button>
          )}
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

          {token && user ? (
            <div className="status-card">
              <p className="status-title">Signed in</p>
              <p>{user.name} · {user.role}</p>
            </div>
          ) : (
            <div className="hero-actions">
              <button className="hero-button" onClick={() => openAuth("register")}>Get Started</button>
              <button className="hero-button hero-button-muted" onClick={() => openAuth("login")}>I already have an account</button>
            </div>
          )}

          {message ? <p className="message">{message}</p> : null}
        </div>

        {showAuth && !token ? (
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
