const NOMINATIM_BASE = "https://nominatim.openstreetmap.org/search";

const FALLBACK_CITY_COORDS = {
  mumbai: [19.076, 72.8777],
  nashik: [19.9975, 73.7898],
  delhi: [28.7041, 77.1025],
  bengaluru: [12.9716, 77.5946],
  bangalore: [12.9716, 77.5946],
  pune: [18.5204, 73.8567],
  hyderabad: [17.385, 78.4867],
  chennai: [13.0827, 80.2707],
};

const DEFAULT_FALLBACK_ROUTE = [
  { name: "Mumbai", coords: [19.076, 72.8777], status: "Pickup Scheduled" },
  { name: "Nashik", coords: [19.9975, 73.7898], status: "In Transit" },
  { name: "Delhi", coords: [28.7041, 77.1025], status: "Out for Delivery" },
];

function normalizeCity(value) {
  return String(value || "").trim().toLowerCase();
}

async function geocodeLocation(locationName) {
  const query = String(locationName || "").trim();
  if (!query) {
    return null;
  }

  try {
    const params = new URLSearchParams({
      q: `${query}, India`,
      format: "json",
      limit: "1",
    });

    const response = await fetch(`${NOMINATIM_BASE}?${params.toString()}`, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return null;
    }

    const rows = await response.json();
    const first = rows?.[0];
    if (!first) {
      return null;
    }

    const lat = Number(first.lat);
    const lon = Number(first.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return null;
    }

    return [lat, lon];
  } catch {
    return null;
  }
}

function fallbackCoordsForLocation(locationName) {
  const key = normalizeCity(locationName);
  return FALLBACK_CITY_COORDS[key] || null;
}

export async function buildTrackingRoute(stops = []) {
  const enrichedStops = [];

  for (const stop of stops) {
    const name = stop.location || stop.name || "Unknown";
    const directCoords = Array.isArray(stop.coords) && stop.coords.length === 2 ? stop.coords : null;
    let coords = directCoords;

    if (!coords) {
      coords = fallbackCoordsForLocation(name);
    }

    if (!coords) {
      coords = await geocodeLocation(name);
    }

    if (!coords) {
      coords = fallbackCoordsForLocation(name);
    }

    if (!coords) {
      continue;
    }

    enrichedStops.push({
      ...stop,
      name,
      coords,
    });
  }

  if (!enrichedStops.length) {
    return {
      stops: DEFAULT_FALLBACK_ROUTE,
      usedFallback: true,
    };
  }

  return {
    stops: enrichedStops,
    usedFallback: false,
  };
}

export function getDefaultFallbackRoute() {
  return DEFAULT_FALLBACK_ROUTE;
}
