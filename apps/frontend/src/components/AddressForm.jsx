import { useTranslation } from "../hooks/useTranslation";
export default function AddressForm({ form, onFieldChange }) {
  const { t } = useTranslation();
  return (
    <div className="address-form">
      <label>
        {t("Street Address")}
        <input
          required
          value={form.street_address}
          onChange={(e) => onFieldChange("street_address", e.target.value)}
          placeholder={t("123 Main Street, Apt 4B")}
        />
      </label>

      <label>
        {t("City")}
        <input
          required
          value={form.city}
          onChange={(e) => onFieldChange("city", e.target.value)}
          placeholder={t("Mumbai")}
        />
      </label>

      <label>
        {t("State / Province")}
        <input
          required
          value={form.state}
          onChange={(e) => onFieldChange("state", e.target.value)}
          placeholder={t("Maharashtra")}
        />
      </label>

      <label>
        {t("Country")}
        <input
          required
          value={form.country}
          onChange={(e) => onFieldChange("country", e.target.value)}
          placeholder={t("India")}
        />
      </label>

      <label>
        {t("Pincode")}
        <input
          required
          value={form.pincode}
          onChange={(e) => onFieldChange("pincode", e.target.value)}
          placeholder={t("400001")}
        />
      </label>
    </div>
  );
}


