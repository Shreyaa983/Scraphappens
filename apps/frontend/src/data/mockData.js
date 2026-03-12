function makeImage(label, primary, secondary) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${primary}" />
          <stop offset="100%" stop-color="${secondary}" />
        </linearGradient>
      </defs>
      <rect width="1200" height="800" fill="url(#g)" rx="48" />
      <circle cx="980" cy="180" r="130" fill="rgba(255,255,255,0.12)" />
      <circle cx="220" cy="620" r="170" fill="rgba(255,255,255,0.08)" />
      <text x="90" y="500" fill="white" font-family="Arial, sans-serif" font-size="72" font-weight="700">${label}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export const marketplaceProducts = [
  {
    id: "oak-beams-01",
    name: "Reclaimed Oak Beams",
    category: "Wood",
    condition: "Excellent",
    distanceKm: 12,
    trustGrade: "A",
    origin: "Demolition site, Koramangala",
    age: "12 years",
    aiReport: "High-density reclaimed oak with low moisture and strong structural reuse potential.",
    sellerName: "BuildCycle Traders",
    sellerReliability: "94/100",
    ownerEmail: "supplier@demo.com",
    image: makeImage("Oak Beams", "#6d4c41", "#3e2723"),
    gallery: [
      makeImage("Oak Beams", "#6d4c41", "#3e2723"),
      makeImage("Wood Grain", "#8d6e63", "#5d4037"),
      makeImage("Reuse Ready", "#795548", "#4e342e")
    ]
  },
  {
    id: "steel-mesh-02",
    name: "Galvanized Steel Mesh",
    category: "Metal",
    condition: "Good",
    distanceKm: 25,
    trustGrade: "B",
    origin: "Industrial surplus lot, Peenya",
    age: "3 years",
    aiReport: "Mesh is reusable for partitions and garden frames with minor edge treatment recommended.",
    sellerName: "Metro Salvage",
    sellerReliability: "88/100",
    ownerEmail: "salvage@example.com",
    image: makeImage("Steel Mesh", "#607d8b", "#263238"),
    gallery: [
      makeImage("Steel Mesh", "#607d8b", "#263238"),
      makeImage("Industrial Lot", "#78909c", "#37474f"),
      makeImage("Reuse Grid", "#90a4ae", "#455a64")
    ]
  },
  {
    id: "cotton-rolls-03",
    name: "Organic Cotton Rolls",
    category: "Textile",
    condition: "Excellent",
    distanceKm: 8,
    trustGrade: "A",
    origin: "Export overrun, Indiranagar",
    age: "6 months",
    aiReport: "Clean, uniform cotton stock suitable for apparel prototypes and community stitching programs.",
    sellerName: "Thread Second Life",
    sellerReliability: "97/100",
    ownerEmail: "buyer@example.com",
    image: makeImage("Cotton Rolls", "#a1887f", "#6d4c41"),
    gallery: [
      makeImage("Cotton Rolls", "#a1887f", "#6d4c41"),
      makeImage("Soft Stock", "#bcaaa4", "#8d6e63"),
      makeImage("Fabric Batch", "#d7ccc8", "#8d6e63")
    ]
  },
  {
    id: "plastic-panels-04",
    name: "HDPE Plastic Panels",
    category: "Plastic",
    condition: "Fair",
    distanceKm: 41,
    trustGrade: "C",
    origin: "Packaging warehouse closeout, Whitefield",
    age: "4 years",
    aiReport: "Suitable for non-load applications and creative reuse after cleaning and trimming.",
    sellerName: "LoopBack Materials",
    sellerReliability: "82/100",
    ownerEmail: "loopback@example.com",
    image: makeImage("HDPE Panels", "#1565c0", "#0d47a1"),
    gallery: [
      makeImage("HDPE Panels", "#1565c0", "#0d47a1"),
      makeImage("Panel Stack", "#1e88e5", "#1565c0"),
      makeImage("Utility Sheets", "#42a5f5", "#1976d2")
    ]
  }
];

export const categories = ["All", "Wood", "Metal", "Textile", "Plastic"];
export const conditions = ["All", "Excellent", "Good", "Fair"];

export const buyerHomeCards = [
  {
    title: "New Arrivals",
    text: "Fresh reclaimed materials have landed today, including wood, trims, and textile surplus."
  },
  {
    title: "Materials near you",
    text: "Location-aware matches within your chosen radius appear first for faster sourcing."
  }
];

export const supplierHomeCards = [
  { title: "Active Listings", value: "18" },
  { title: "Items Pending Pickup", value: "6" }
];

export const buyerGardenStats = {
  itemsReused: 9,
  wasteDivertedKg: 68,
  materialsSaved: 32,
  orderHistory: [
    "3 reclaimed wood orders completed",
    "2 textile bundles reserved",
    "1 garden frame shipment on the way"
  ]
};

export const sellerGardenStats = {
  itemsReused: 14,
  wasteDivertedKg: 122,
  carbonOffsetKg: 340,
  listings: [
    "Reclaimed Oak Beams",
    "Steel Mesh Panels",
    "Cotton Roll Bundle"
  ]
};

export const volunteerGardenStats = {
  itemsReused: 7,
  wasteDivertedKg: 54,
  communityHours: 26,
  tasks: [
    "Pickup drive at Ward 6",
    "Sorting and tagging workshop",
    "Community garden repair build"
  ]
};
