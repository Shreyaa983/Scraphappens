import { sql } from "./client.js";

export async function bootstrapDatabase() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('supplier', 'buyer', 'volunteer')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  // Ensure new structured address fields exist without breaking existing data
  await sql`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS street_address TEXT,
    ADD COLUMN IF NOT EXISTS city TEXT,
    ADD COLUMN IF NOT EXISTS state TEXT,
    ADD COLUMN IF NOT EXISTS country TEXT,
    ADD COLUMN IF NOT EXISTS pincode TEXT,
    ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION
  `;

  // Ensure role column exists with safe default for legacy databases
  await sql`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'buyer'
  `;

  await sql`
    ALTER TABLE users
    ALTER COLUMN role SET DEFAULT 'buyer'
  `;

  // Backfill any users missing a role to default buyer (in case of nullable legacy schemas)
  await sql`
    UPDATE users
    SET role = 'buyer'
    WHERE role IS NULL
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS materials (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      description TEXT,
      material_type TEXT,
      category TEXT,
      condition TEXT,
      quantity INTEGER,
      quantity_unit TEXT DEFAULT 'kg',
      location TEXT,
      image_url TEXT,
      listed_by UUID REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  // Add quantity_unit column for existing installs
  await sql`ALTER TABLE materials ADD COLUMN IF NOT EXISTS quantity_unit TEXT DEFAULT 'kg';`;

  await sql`
    CREATE TABLE IF NOT EXISTS cart_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id),
      material_id UUID REFERENCES materials(id),
      quantity INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      buyer_id UUID REFERENCES users(id),
      order_status TEXT DEFAULT 'pending',
      total_amount INTEGER,
      shipping_address TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS order_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id UUID REFERENCES orders(id),
      material_id UUID REFERENCES materials(id),
      seller_id UUID REFERENCES users(id),
      quantity INTEGER,
      price INTEGER
    );
  `;
}
