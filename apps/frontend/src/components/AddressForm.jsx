export default function AddressForm({ form, onFieldChange }) {
  return (
    <div className="address-form">
      <label>
        Street Address
        <input
          required
          value={form.street_address}
          onChange={(e) => onFieldChange("street_address", e.target.value)}
          placeholder="123 Main Street, Apt 4B"
        />
      </label>

      <label>
        City
        <input
          required
          value={form.city}
          onChange={(e) => onFieldChange("city", e.target.value)}
          placeholder="Mumbai"
        />
      </label>

      <label>
        State / Province
        <input
          required
          value={form.state}
          onChange={(e) => onFieldChange("state", e.target.value)}
          placeholder="Maharashtra"
        />
      </label>

      <label>
        Country
        <input
          required
          value={form.country}
          onChange={(e) => onFieldChange("country", e.target.value)}
          placeholder="India"
        />
      </label>

      <label>
        Pincode
        <input
          required
          value={form.pincode}
          onChange={(e) => onFieldChange("pincode", e.target.value)}
          placeholder="400001"
        />
      </label>
    </div>
  );
}


