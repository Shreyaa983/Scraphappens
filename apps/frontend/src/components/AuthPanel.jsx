import { useEffect, useState } from "react";
import AddressForm from "./AddressForm";
import { useTranslation } from "../hooks/useTranslation";

const roles = ["seller", "buyer", "volunteer"];

export default function AuthPanel({ mode, form, onFieldChange, onClose, onSubmit }) {
  const { t } = useTranslation();
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
          <h3>{isRegister ? t("Create account") : t("Welcome back")}</h3>
          {isRegister && (
            <p className="auth-subtitle">
              {t("Step")} {step} {t("of")} 2 — {step === 1 ? t("Basic details") : t("Address details")}
            </p>
          )}
        </div>
        <button type="button" className="close-button" onClick={handleClose}>×</button>
      </div>

      {isRegister && step === 1 && (
        <>
          <label>
            {t("Name")}
            <input value={form.name} onChange={(e) => onFieldChange("name", e.target.value)} required />
          </label>

          <label>
            {t("Email")}
            <input type="email" value={form.email} onChange={(e) => onFieldChange("email", e.target.value)} required />
          </label>

          <label>
            {t("Phone Number")}
            <input type="tel" value={form.phone_number || ''} onChange={(e) => onFieldChange("phone_number", e.target.value)} placeholder="+91 98765 43210" required />
          </label>

          <label>
            {t("Password")}
            <input type="password" value={form.password} onChange={(e) => onFieldChange("password", e.target.value)} required />
          </label>

          <label>
            {t("Role")}
            <select value={form.role} onChange={(e) => onFieldChange("role", e.target.value)}>
              {roles.map((role) => (
                <option key={role} value={role}>
                  {t(role)}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" className="submit-button">
            {t("Next: Address")}
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
              ← {t("Back")}
            </button>
            <button type="submit" className="submit-button">
              {t("Create Account")}
            </button>
          </div>
        </>
      )}

      {!isRegister && (
        <>
          <label>
            {t("Email")}
            <input type="email" value={form.email} onChange={(e) => onFieldChange("email", e.target.value)} required />
          </label>

          <label>
            {t("Password")}
            <input type="password" value={form.password} onChange={(e) => onFieldChange("password", e.target.value)} required />
          </label>

          <button type="submit" className="submit-button">
            {t("Sign In")}
          </button>
        </>
      )}
    </form>
  );
}
