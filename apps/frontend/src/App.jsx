import { useState } from "react";
import { login, register } from "./api";

const roles = ["supplier", "buyer", "volunteer"];

export default function App() {
  const [mode, setMode] = useState("register");
  const [showAuth, setShowAuth] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: roles[0] });
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");

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
      setMessage(`${mode} successful`);
      setShowAuth(false);
    } catch (error) {
      setMessage(error.message);
    }
  }

  function onLogout() {
    setToken("");
    setUser(null);
    localStorage.removeItem("token");
    setMessage("Logged out");
  }

  function openAuth(nextMode) {
    setMode(nextMode);
    setShowAuth(true);
    setMessage("");
  }

  return (
    <main className="landing-page">
      <nav className="navbar">
        <div className="brand-block">
          <span className="brand-mark">S</span>
          <div>
            <h1>ScarfHappens</h1>
            <p>Smart textile reuse marketplace</p>
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
          <h2>Turn leftover fabric into useful inventory, fast.</h2>
          <p>
            A clean starter platform for suppliers, buyers, and volunteers with role-based access,
            JWT authentication, Neon Postgres, and AI-ready services.
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
          <form onSubmit={onSubmit} className="auth-panel">
            <div className="auth-header">
              <h3>{mode === "register" ? "Create account" : "Welcome back"}</h3>
              <button type="button" className="close-button" onClick={() => setShowAuth(false)}>×</button>
            </div>

            {mode === "register" && (
              <label>
                Name
                <input value={form.name} onChange={(e) => updateField("name", e.target.value)} required />
              </label>
            )}

            <label>
              Email
              <input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} required />
            </label>

            <label>
              Password
              <input type="password" value={form.password} onChange={(e) => updateField("password", e.target.value)} required />
            </label>

            {mode === "register" && (
              <label>
                Role
                <select value={form.role} onChange={(e) => updateField("role", e.target.value)}>
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <button type="submit" className="submit-button">
              {mode === "register" ? "Create Account" : "Sign In"}
            </button>
          </form>
        ) : (
          <div className="feature-grid">
            <article className="feature-card">
              <h3>Supplier</h3>
              <p>List extra stock, fabric scraps, and reusable material.</p>
            </article>
            <article className="feature-card">
              <h3>Buyer</h3>
              <p>Discover available textile inventory and place requests quickly.</p>
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
