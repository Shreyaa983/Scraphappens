import { geocodeAddress } from "../services/geocodeService.js";

export async function validateAddressInput(req, res, next) {
  const {
    street_address,
    city,
    state,
    country,
    pincode
  } = req.body;

  if (!street_address || !city || !state || !country || !pincode) {
    return res.status(400).json({
      message: "street_address, city, state, country, and pincode are required"
    });
  }

  // Basic sanity checks – can be tightened later as needed
  if (typeof pincode !== "string" && typeof pincode !== "number") {
    return res.status(400).json({ message: "pincode must be a string or number" });
  }

  if (!city || typeof city !== "string") {
    return res.status(400).json({ message: "city is required" });
  }

  try {
    const { latitude, longitude } = await geocodeAddress({
      street_address,
      city,
      state,
      country,
      pincode: String(pincode)
    });

    req.body.latitude = latitude;
    req.body.longitude = longitude;

    return next();
  } catch (error) {
    return res.status(400).json({ message: error.message || "Invalid address" });
  }
}


