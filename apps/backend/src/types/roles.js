export const Roles = {
  // Legacy alias kept for backward compatibility with existing data and tokens
  SUPPLIER: "supplier",
  // New primary name for marketplace sellers
  SELLER: "seller",
  BUYER: "buyer",
  VOLUNTEER: "volunteer"
};

// Accept both legacy "supplier" and new "seller" strings for safety
export const validRoles = ["seller", "buyer", "volunteer", "supplier"];
