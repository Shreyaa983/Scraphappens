import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sql } from "../../db/client.js";
import { env } from "../../config/env.js";
import { validRoles } from "../../types/roles.js";

function createToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

export async function registerUser({
  name,
  email,
  password,
  role,
  street_address,
  city,
  state,
  country,
  pincode,
  latitude,
  longitude
}) {
  if (!name || !email || !password || !role) {
    throw new Error("name, email, password, and role are required");
  }

  if (!validRoles.includes(role)) {
    throw new Error("Invalid role. Use seller, buyer, or volunteer");
  }

  // Basic address validation when registering
  if (!street_address || !city || !state || !country || !pincode) {
    throw new Error("street_address, city, state, country, and pincode are required");
  }

  const existing = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
  if (existing.length > 0) {
    throw new Error("Email already registered");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const users = await sql`
    INSERT INTO users (
      name,
      email,
      password_hash,
      role,
      street_address,
      city,
      state,
      country,
      pincode,
      latitude,
      longitude
    )
    VALUES (
      ${name},
      ${email},
      ${passwordHash},
      ${role},
      ${street_address},
      ${city},
      ${state},
      ${country},
      ${pincode},
      ${latitude},
      ${longitude}
    )
    RETURNING id, name, email, role, created_at, street_address, city, state, country, pincode, latitude, longitude
  `;

  const user = users[0];
  const token = createToken(user);
  return { user, token };
}

export async function loginUser({ email, password }) {
  if (!email || !password) {
    throw new Error("email and password are required");
  }

  const users = await sql`
    SELECT id, name, email, role, password_hash, created_at, street_address, city, state, country, pincode, latitude, longitude
    FROM users
    WHERE email = ${email}
    LIMIT 1
  `;

  if (users.length === 0) {
    throw new Error("Invalid credentials");
  }

  const user = users[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    throw new Error("Invalid credentials");
  }

  const token = createToken(user);
  const { password_hash, ...safeUser } = user;
  return { user: safeUser, token };
}

export async function getUserById(userId) {
  const users = await sql`
    SELECT id, name, email, role, created_at, street_address, city, state, country, pincode, latitude, longitude
    FROM users
    WHERE id = ${userId}
    LIMIT 1
  `;

  return users[0] || null;
}
