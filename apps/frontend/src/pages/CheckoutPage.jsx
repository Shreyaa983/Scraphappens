import { useMemo, useState } from "react";
import { useTranslation } from "../hooks/useTranslation";

export default function CheckoutPage({ product, user, onBack }) {
  const { t } = useTranslation();
  const [pincode, setPincode] = useState("");
  const [gateway, setGateway] = useState("Razorpay");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");

  const deliveryEstimate = useMemo(() => {
    if (pincode.length < 6) return null;
    return {
      fee: product.distanceKm <= 15 ? 80 : 140,
      carrier: product.distanceKm <= 15 ? "BlueDart" : "Delhivery",
      eta: product.distanceKm <= 15 ? "1-2 days" : "3-4 days"
    };
  }, [pincode, product.distanceKm]);

  return (
    <div className="page-stack">
      <div className="page-toolbar">
        <button type="button" className="nav-button nav-button-secondary" onClick={onBack}>← {t("Back to Product")}</button>
      </div>

      <section className="checkout-layout">
        <article className="dashboard-card checkout-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">{t("Transaction & Logistics")}</span>
              <h3>{t(product.name)}</h3>
            </div>
            <span className="section-tag">{t("Checkout")}</span>
          </div>

          <div className="checkout-summary-row">
            <img src={product.image} alt={t(product.name)} className="checkout-image" />
            <div>
              <p className="detail-subtext">{t("Buyer")}: {user.name}</p>
              <p className="detail-subtext">{t("Circular Credits / shipping fee payment enabled next.")}</p>
            </div>
          </div>

          <div className="form-grid">
            <label>
              {t("Payment gateway")}
              <select value={gateway} onChange={(event) => setGateway(event.target.value)}>
                <option value="Razorpay">Razorpay</option>
                <option value="Stripe">Stripe</option>
              </select>
            </label>

            <label>
              {t("Buyer pincode")}
              <input
                value={pincode}
                onChange={(event) => setPincode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="560001"
              />
            </label>

            <label>
              {t("Pickup date")}
              <input type="date" value={pickupDate} onChange={(event) => setPickupDate(event.target.value)} />
            </label>

            <label>
              {t("Pickup time")}
              <input type="time" value={pickupTime} onChange={(event) => setPickupTime(event.target.value)} />
            </label>
          </div>

          <div className="integration-card">
            <h4>{t("Shiprocket Integration")}</h4>
            {deliveryEstimate ? (
              <p>{t("Estimated Delivery")}: ₹{deliveryEstimate.fee} {t("via")} {deliveryEstimate.carrier} · {t(deliveryEstimate.eta)}</p>
            ) : (
              <p>{t("Enter a valid pincode to fetch delivery estimate.")}</p>
            )}
          </div>

          <div className="integration-card">
            <h4>{t("Payment Gateway")}</h4>
            <p>{t(gateway)} {t("is selected for shipping fee / Circular Credits integration scaffold.")}</p>
          </div>
        </article>
      </section>
    </div>
  );
}
