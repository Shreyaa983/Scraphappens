import { env } from "../config/env.js";

function buildAddressString({ street_address, city, state, country, pincode }) {
  return [street_address, city, state, pincode, country].filter(Boolean).join(", ");
}

export async function geocodeAddress(address) {
  const provider = env.geocodingProvider;
  const apiKey = env.geocodingApiKey;

  if (!apiKey) {
    throw new Error("Geocoding API key (GEOCODING_API_KEY) is not configured");
  }

  const query = buildAddressString(address);

  if (!query) {
    throw new Error("Address is empty, cannot geocode");
  }

  if (provider === "opencage") {
    const url = new URL("https://api.opencagedata.com/geocode/v1/json");
    url.searchParams.set("q", query);
    url.searchParams.set("key", apiKey);
    url.searchParams.set("limit", "1");

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error("Failed to reach geocoding service");
    }

    const data = await response.json();
    const first = data?.results?.[0];
    if (!first?.geometry) {
      throw new Error("Unable to geocode address");
    }

    return {
      latitude: first.geometry.lat,
      longitude: first.geometry.lng
    };
  }

  throw new Error(`Unsupported geocoding provider: ${provider}`);
}


