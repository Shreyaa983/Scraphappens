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

  // Add reputation and circular score fields
  await sql`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_exchanges INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_waste_reused_kg DECIMAL(10, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS trees_planted INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS phone_number TEXT
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
      price INTEGER,
      is_free BOOLEAN DEFAULT FALSE,
      delivery_option TEXT DEFAULT 'pickup_only' CHECK (delivery_option IN ('pickup_only', 'delivery_available')),
      sustainability_impact TEXT,
      listed_by UUID REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  // Add new columns for existing tables
  await sql`ALTER TABLE materials ADD COLUMN IF NOT EXISTS price INTEGER;`;
  await sql`ALTER TABLE materials ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT FALSE;`;
  await sql`ALTER TABLE materials ADD COLUMN IF NOT EXISTS delivery_option TEXT DEFAULT 'pickup_only';`;
  await sql`ALTER TABLE materials ADD COLUMN IF NOT EXISTS sustainability_impact TEXT;`;
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
      coupon_id UUID REFERENCES coupons(id),
      payment_method TEXT,
      delivery_option TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // Add new columns to orders table if they don't exist
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_id UUID;`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT;`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_option TEXT;`;

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

  // Create reviews table for supplier ratings
  await sql`
    CREATE TABLE IF NOT EXISTS reviews (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id UUID REFERENCES orders(id),
      buyer_id UUID REFERENCES users(id),
      seller_id UUID REFERENCES users(id),
      star_rating INTEGER CHECK (star_rating >= 1 AND star_rating <= 5),
      comment TEXT,
      delivery_experience_rating INTEGER CHECK (delivery_experience_rating >= 1 AND delivery_experience_rating <= 5),
      material_quality_rating INTEGER CHECK (material_quality_rating >= 1 AND material_quality_rating <= 5),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // Create coupons table for rewards
  await sql`
    CREATE TABLE IF NOT EXISTS coupons (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('free_delivery', 'delivery_discount', 'marketplace_discount', 'listing_boost')),
      value INTEGER,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP
    );
  `;

  // Create coupon_wallet for user's acquired coupons
  await sql`
    CREATE TABLE IF NOT EXISTS coupon_wallet (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id),
      coupon_id UUID REFERENCES coupons(id),
      unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      is_used BOOLEAN DEFAULT FALSE,
      used_on_order_id UUID REFERENCES orders(id)
    );
  `;

  // Create achievements table
  await sql`
    CREATE TABLE IF NOT EXISTS achievements (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      required_exchanges INTEGER,
      reward_type TEXT,
      reward_value TEXT,
      icon_emoji TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // Create user_achievements junction table
  await sql`
    CREATE TABLE IF NOT EXISTS user_achievements (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id),
      achievement_id UUID REFERENCES achievements(id),
      unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, achievement_id)
    );
  `;

  // Create supplier_badges table
  await sql`
    CREATE TABLE IF NOT EXISTS supplier_badges (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id),
      badge_name TEXT NOT NULL,
      awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, badge_name)
    );
  `;
}
