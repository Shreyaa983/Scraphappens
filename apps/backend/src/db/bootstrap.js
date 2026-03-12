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

  await sql`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_exchanges INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_waste_reused_kg DECIMAL(10, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS trees_planted INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS phone_number TEXT
  `;

  await sql`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'buyer'
  `;

  await sql`
    ALTER TABLE users
    ALTER COLUMN role SET DEFAULT 'buyer'
  `;

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

  await sql`ALTER TABLE materials ADD COLUMN IF NOT EXISTS price INTEGER;`;
  await sql`ALTER TABLE materials ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT FALSE;`;
  await sql`ALTER TABLE materials ADD COLUMN IF NOT EXISTS delivery_option TEXT DEFAULT 'pickup_only';`;
  await sql`ALTER TABLE materials ADD COLUMN IF NOT EXISTS sustainability_impact TEXT;`;
  await sql`ALTER TABLE materials ADD COLUMN IF NOT EXISTS quantity_unit TEXT DEFAULT 'kg';`;

  await sql`
    CREATE TABLE IF NOT EXISTS diy_posts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      description TEXT,
      steps TEXT,
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

  await sql`
    CREATE TABLE IF NOT EXISTS user_achievements (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id),
      achievement_id UUID REFERENCES achievements(id),
      unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, achievement_id)
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS supplier_badges (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id),
      badge_name TEXT NOT NULL,
      awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, badge_name)
    );
  `;

  await seedDiyInspirationPosts();
}
