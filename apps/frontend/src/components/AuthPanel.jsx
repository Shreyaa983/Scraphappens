import { useEffect, useState } from "react";
import AddressForm from "./AddressForm";

const roles = ["seller", "buyer", "volunteer"];

export default function AuthPanel({ mode, form, onFieldChange, onClose, onSubmit }) {
  const [step, setStep] = useState(1); // 1 = basic details, 2 = address

  useEffect(() => {
    if (mode !== "register") {
      setStep(1);
    }
  }, [mode]);

  const handleClose = () => {
    setStep(1);
    onClose();
  };

  const handleSubmit = (event) => {
    if (mode !== "register") {
      return onSubmit(event);
    }

    if (step === 1) {
      event.preventDefault();
      setStep(2);
      return;
    }

    // Step 2: submit full payload including address
    return onSubmit(event);
  };

  const isRegister = mode === "register";

  return (
    <form onSubmit={handleSubmit} className="auth-panel">
      <div className="auth-header">
        <div>
          <h3>{isRegister ? "Create account" : "Welcome back"}</h3>
          {isRegister && (
            <p className="auth-subtitle">
              Step {step} of 2 — {step === 1 ? "Basic details" : "Address details"}
            </p>
          )}
        </div>
        <button type="button" className="close-button" onClick={handleClose}>×</button>
      </div>

      {isRegister && step === 1 && (
        <>
          <label>
            Name
            <input value={form.name} onChange={(e) => onFieldChange("name", e.target.value)} required />
          </label>

          <label>
            Email
            <input type="email" value={form.email} onChange={(e) => onFieldChange("email", e.target.value)} required />
          </label>

          <label>
            Password
            <input type="password" value={form.password} onChange={(e) => onFieldChange("password", e.target.value)} required />
          </label>

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

          <button type="submit" className="submit-button">
            Next: Address
          </button>
        </>
      )}

      {isRegister && step === 2 && (
        <>
          <AddressForm form={form} onFieldChange={onFieldChange} />

          <div className="auth-actions-row">
            <button
              type="button"
              className="nav-button nav-button-secondary"
              onClick={() => setStep(1)}
            >
              ← Back
            </button>
            <button type="submit" className="submit-button">
              Create Account
            </button>
          </div>
        </>
      )}

      {!isRegister && (
        <>
          <label>
            Email
            <input type="email" value={form.email} onChange={(e) => onFieldChange("email", e.target.value)} required />
          </label>

          <label>
            Password
            <input type="password" value={form.password} onChange={(e) => onFieldChange("password", e.target.value)} required />
          </label>

          <button type="submit" className="submit-button">
            Sign In
          </button>
        </>
      )}
    </form>
  );
}
