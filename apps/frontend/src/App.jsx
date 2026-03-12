import { useState } from "react";
import { login, register } from "./api";

const roles = ["supplier", "buyer", "volunteer"];

export default function App() {
  const [mode, setMode] = useState("register");
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

  return (
    <main className="container">
      <h1>ScarfHappens</h1>
      <p>Starter auth flow with roles + JWT</p>

      <div className="toggle-row">
        <button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>Register</button>
        <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Login</button>
      </div>

      {!token ? (
        <form onSubmit={onSubmit} className="card">
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

          <button type="submit">{mode === "register" ? "Create Account" : "Sign In"}</button>
        </form>
      ) : (
        <div className="card">
          <p><strong>Token:</strong> stored in localStorage</p>
          {user ? <p><strong>User:</strong> {user.name} ({user.role})</p> : null}
          <button onClick={onLogout}>Logout</button>
        </div>
      )}

      {message ? <p className="message">{message}</p> : null}
    </main>
  );
}
