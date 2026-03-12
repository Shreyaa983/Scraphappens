const roles = ["supplier", "buyer", "volunteer"];

export default function AuthPanel({ mode, form, onFieldChange, onClose, onSubmit }) {
  return (
    <form onSubmit={onSubmit} className="auth-panel">
      <div className="auth-header">
        <h3>{mode === "register" ? "Create account" : "Welcome back"}</h3>
        <button type="button" className="close-button" onClick={onClose}>×</button>
      </div>

      {mode === "register" && (
        <label>
          Name
          <input value={form.name} onChange={(e) => onFieldChange("name", e.target.value)} required />
        </label>
      )}

      <label>
        Email
        <input type="email" value={form.email} onChange={(e) => onFieldChange("email", e.target.value)} required />
      </label>

      <label>
        Password
        <input type="password" value={form.password} onChange={(e) => onFieldChange("password", e.target.value)} required />
      </label>

      {mode === "register" && (
        <label>
          Role
          <select value={form.role} onChange={(e) => onFieldChange("role", e.target.value)}>
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
  );
}
