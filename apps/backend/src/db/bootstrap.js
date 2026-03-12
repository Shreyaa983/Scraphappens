import { sql } from "./client.js";
import { seedDiyInspirationPosts } from "./diySeeds.js";

export async function bootstrapDatabase() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
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

  // Relax and align role check constraint to allow both legacy and new role values
  await sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE table_name = 'users'
        AND constraint_type = 'CHECK'
        AND constraint_name = 'users_role_check'
      ) THEN
        ALTER TABLE users DROP CONSTRAINT users_role_check;
      END IF;
    END$$;
  `;

  await sql`
    ALTER TABLE users
    ADD CONSTRAINT users_role_check
    CHECK (role IN ('seller', 'buyer', 'volunteer', 'supplier'));
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

  // DIY inspiration system tables
  await sql`
    CREATE TABLE IF NOT EXISTS diy_posts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      description TEXT,
      steps TEXT, -- JSON string of steps
      main_image_url TEXT,
      estimated_cost TEXT,
      waste_saved TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS diy_materials (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      diy_post_id UUID REFERENCES diy_posts(id) ON DELETE CASCADE,
      material_name TEXT NOT NULL,
      material_category TEXT,
      marketplace_material_id UUID,
      quantity_required TEXT
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS diy_results (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id),
      diy_post_id UUID REFERENCES diy_posts(id),
      image_url TEXT,
      caption TEXT,
      also_share_community BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS diy_result_comments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      result_id UUID REFERENCES diy_results(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id),
      comment_text TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS diy_saved_posts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id),
      diy_post_id UUID REFERENCES diy_posts(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, diy_post_id)
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

  await seedDiyInspirationPosts();
}
