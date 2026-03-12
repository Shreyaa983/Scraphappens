import { Roles } from "../types/roles.js";

function isSellerRole(role) {
  return role === Roles.SELLER || role === Roles.SUPPLIER;
}

export function requireSeller(req, res, next) {
  const role = req.user?.role;
  if (!role) {
    return res.status(403).json({ message: "Role missing in token" });
  }

  if (!isSellerRole(role)) {
    return res.status(403).json({ message: "Seller role required" });
  }

  return next();
}

export function requireBuyer(req, res, next) {
  const role = req.user?.role;
  if (!role) {
    return res.status(403).json({ message: "Role missing in token" });
  }

  if (role !== Roles.BUYER) {
    return res.status(403).json({ message: "Buyer role required" });
  }

  return next();
}

export function requireVolunteer(req, res, next) {
  const role = req.user?.role;
  if (!role) {
    return res.status(403).json({ message: "Role missing in token" });
  }

  if (role !== Roles.VOLUNTEER) {
    return res.status(403).json({ message: "Volunteer role required" });
  }

  return next();
}


