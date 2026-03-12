import { useEffect, useMemo, useState } from "react";
import { getCurrentUser, getMaterialById, login, register } from "./api";
import AuthPanel from "./components/AuthPanel";
import OrderAchievementOverlay from "./components/Garden/OrderAchievementOverlay";
import CreateListing from "./pages/CreateListing";
import GardenPage from "./pages/GardenPage";
import MaterialDetailPage from "./pages/MaterialDetailPage";
import MarketplacePage from "./pages/MarketplacePage";
import MyListingsPage from "./pages/MyListingsPage";
import CartPage from "./pages/CartPage";
import AIChatbot from "./pages/AIChatbot";
import { BuyerOrdersPage, SellerOrdersPage } from "./pages/OrdersPage";
import DIYFeedPage from "./pages/DIYFeedPage";
import DIYDetailPage from "./pages/DIYDetailPage";
import { queuePendingGardenReward } from "./utils/gardenRewards";

const roles = ["seller", "buyer", "volunteer"];

const isSellerRole = (role) => role === "seller" || role === "supplier";
const isBuyerRole = (role) => role === "buyer";
const isVolunteerRole = (role) => role === "volunteer";

function RoleLockedPanel() {
  return (
    <div className="role-locked-shell">
      <div className="role-locked-card">
        <span className="eyebrow">Buyer only</span>
        <h3>DIY Inspiration is reserved for buyers.</h3>
        <p>Only buyer accounts can browse AI-generated DIY ideas, open material links, and post finished builds.</p>
      </div>
    </div>
  );
}

export default function App() {
  const [mode, setMode] = useState("register");
  const [showAuth, setShowAuth] = useState(false);
  const [activeSection, setActiveSection] = useState("Marketplace");
  const [marketplaceView, setMarketplaceView] = useState("browse");
  const [editItem, setEditItem] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeDiyId, setActiveDiyId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: roles[0],
    street_address: "",
    city: "",
    state: "",
    country: "",
    pincode: ""
  });
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [loadingUser, setLoadingUser] = useState(Boolean(localStorage.getItem("token")));
  const [orderAchievement, setOrderAchievement] = useState(null);
  const [pendingGardenAchievement, setPendingGardenAchievement] = useState(null);
  const [marketplaceFilters, setMarketplaceFilters] = useState({
    search: "",
    category: "All",
    condition: "All",
  });

  const sidebarItems = useMemo(() => {
    const items = ["Marketplace", "AI Assistant", "Garden"];

    if (user && isSellerRole(user.role)) {
      items.push("My Listings", "Seller Orders");
    }

    if (user && isBuyerRole(user.role)) {
      items.push("Cart", "My Orders", "DIY Inspiration");
    }

    if (user && isVolunteerRole(user.role)) {
      // Shared experience only for now.
    }

    return items;
  }, [user]);

  useEffect(() => {
    async function restoreUser() {
      if (!token) {
        setLoadingUser(false);
        return;
      }
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
    setActiveDiyId(null);
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
    setMessage("");
    if (section !== "DIY Inspiration") {
      setActiveDiyId(null);
    }
  }

  function handleFilterChange(key, value) {
    setMarketplaceFilters((prev) => ({ ...prev, [key]: value }));
  }

  function handleOrderPlaced(result) {
    const achievement = result?.achievement || null;
    const userId = user?.id || user?.sub;

    if (achievement && userId) {
      queuePendingGardenReward(userId, achievement);
    }

    setPendingGardenAchievement(achievement);

    setOrderAchievement(achievement || {
      name: "Circular Purchase Confirmed",
      description: "Your order has been recorded as a circular action.",
      reward: { plantLabel: "Circular Sapling", icon: "seedling" },
      impact: { display: "Circular impact recorded" }
    });

    window.setTimeout(() => {
      setOrderAchievement(null);
      setActiveSection("Garden");
      setMarketplaceView("browse");
      setSelectedProduct(null);
      setEditItem(null);
    }, 2200);
  }

  function openProductDetail(product) {
    setSelectedProduct(product);
    setMarketplaceView("detail");
  }

  async function openMaterialFromDiy(materialId) {
    if (!materialId) return;
    try {
      const response = await getMaterialById(materialId);
      setMarketplaceFilters((prev) => ({ ...prev, search: "", category: "All" }));
      setActiveSection("Marketplace");
      setSelectedProduct(response.material);
      setMarketplaceView("detail");
      setActiveDiyId(null);
    } catch (error) {
      setMessage(error.message || "Unable to open material listing.");
    }
  }

  function searchMaterialFromDiy(materialName) {
    setMarketplaceFilters((prev) => ({ ...prev, search: materialName || "", category: "All" }));
    setActiveSection("Marketplace");
    setMarketplaceView("browse");
    setSelectedProduct(null);
    setActiveDiyId(null);
  }

  function openEdit(item) {
    setEditItem(item);
    setMarketplaceView("edit");
    setActiveSection("Marketplace");
  }

  function openEditFromMyListings(item) {
    setEditItem(item);
    setMarketplaceView("edit");
    setActiveSection("My Listings");
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
          onBack={() => {
            setMarketplaceView("browse");
            setSelectedProduct(null);
          }}
          onEdit={openEdit}
        />
      );
    }
    if (marketplaceView === "create") {
      if (!user || !isSellerRole(user.role)) {
        return (
          <MarketplacePage
            user={user}
            filters={marketplaceFilters}
            onFilterChange={handleFilterChange}
            onSelectProduct={openProductDetail}
            onCreateClick={() => {}}
          />
        );
      }
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
        onCreateClick={() => {
          if (!user || !isSellerRole(user.role)) {
            setMessage("Only sellers can create material listings.");
            return;
          }
          setMarketplaceView("create");
        }}
      />
    );
  }

  function renderSectionContent() {
    if (activeSection === "AI Assistant") return <AIChatbot />;
    if (activeSection === "Cart") {
      return <CartPage token={token} onOrderPlaced={handleOrderPlaced} />;
    }
    if (activeSection === "My Orders") {
      return <BuyerOrdersPage token={token} />;
    }
    if (activeSection === "Seller Orders") {
      return <SellerOrdersPage token={token} />;
    }
    if (activeSection === "DIY Inspiration") {
      if (!user || !isBuyerRole(user.role)) {
        return <RoleLockedPanel />;
      }
      if (activeDiyId) {
        return (
          <DIYDetailPage
            diyId={activeDiyId}
            token={token}
            user={user}
            onBack={() => setActiveDiyId(null)}
            onOpenMaterial={openMaterialFromDiy}
            onSearchMaterial={searchMaterialFromDiy}
          />
        );
      }
      return (
        <DIYFeedPage
          token={token}
          onOpenProject={(post) => setActiveDiyId(post.id)}
        />
      );
    }
    if (activeSection === "Garden") {
      return (
        <GardenPage
          user={user}
          pendingAchievement={pendingGardenAchievement}
          onPendingAchievementHandled={() => setPendingGardenAchievement(null)}
        />
      );
    }
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
