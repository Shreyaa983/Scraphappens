# Circular Economy Marketplace - Developer Quick Reference

## 🚀 Quick Start

### Running the Application

**Terminal 1 - Backend:**
```bash
cd apps/backend
npm install
npm run dev
# Server runs on http://localhost:4000
```

**Terminal 2 - Frontend:**
```bash
cd apps/frontend
npm install
npm run dev
# App runs on http://localhost:5173
```

## 📁 Key File Structure

```
apps/
├── backend/src/
│   ├── db/
│   │   └── bootstrap.js (Database schema with all new tables)
│   ├── models/
│   │   ├── reviewModel.js (Review CRUD)
│   │   ├── achievementModel.js (Achievement management)
│   │   ├── couponModel.js (Coupon wallet)
│   │   ├── badgeModel.js (Supplier badges)
│   │   └── (existing models)
│   ├── modules/
│   │   ├── reviews/
│   │   │   ├── review.service.js
│   │   │   └── review.controller.js
│   │   ├── achievements/
│   │   │   ├── achievement.service.js
│   │   │   └── achievement.controller.js
│   │   ├── coupons/
│   │   │   ├── coupon.service.js
│   │   │   └── coupon.controller.js
│   │   ├── reputation/
│   │   │   ├── reputation.service.js
│   │   │   └── reputation.controller.js
│   │   └── (existing modules)
│   ├── routes/
│   │   ├── reviewRoutes.js
│   │   ├── achievementRoutes.js
│   │   ├── couponRoutes.js
│   │   ├── reputationRoutes.js
│   │   └── (existing routes)
│   ├── controllers/
│   │   ├── orderController.js (ENHANCED with pricing & coupons)
│   │   ├── materialController.js (ENHANCED with pricing)
│   │   └── (existing controllers)
│   ├── app.js (Routes registered here)
│   └── server.js
│
└── frontend/src/
    ├── components/Marketplace/
    │   ├── MaterialListingForm.jsx (Create/edit listings with pricing)
    │   ├── EnhancedCheckout.jsx (Checkout with payments & coupons)
    │   ├── ReviewForm.jsx (Submit reviews)
    │   ├── SupplierProfile.jsx (Seller profile with reviews)
    │   └── UserDashboard.jsx (Personal stats & achievements)
    ├── styles/
    │   ├── marketplace.css
    │   ├── checkout.css
    │   ├── supplier-profile.css
    │   ├── user-dashboard.css
    │   └── reviews.css
    └── services/
        └── api.js (Updated with new endpoints)
```

## 🔑 Key API Endpoints

### Listings & Checkout
```
POST /api/materials                    - Create listing with pricing
PUT /api/materials/:id                 - Update listing
POST /api/orders/place                 - Place order (with payment & coupon)
GET /api/orders/my-orders              - Get user's orders
```

### Reviews & Ratings
```
POST /api/reviews                      - Submit review
GET /api/reviews/supplier/:seller_id   - Get supplier's reviews
GET /api/reviews/stats/:seller_id      - Get supplier stats & badges
```

### Achievements & Coupons
```
GET /api/achievements                  - List all achievements
GET /api/achievements/user/mine         - User's achievements
POST /api/achievements/check            - Check & unlock new ones
GET /api/coupons                       - User's coupon wallet
POST /api/coupons/apply                - Apply coupon to order
```

### Reputation & Leaderboard
```
GET /api/reputation/my-score           - User's circular score
GET /api/reputation/score/:user_id     - Any user's score
GET /api/reputation/top-suppliers      - Leaderboard
```

## 🎯 Core Business Logic

### Order Flow
```javascript
// In orderController.js - placeOrder()
1. Get cart items ✓
2. Calculate total ✓
3. Apply coupon discount ✓
4. Create order ✓
5. Decrement inventory ✓
6. Create shipment ✓
7. Update seller reputation ✓
8. Award badges ✓
9. Check achievements ✓
10. Unlock coupons ✓
11. Plant tree 🌱
```

### Achievement Unlock Flow
```javascript
// In achievement.service.js - checkAndUnlockAchievements()
1. Get user's exchange count ✓
2. Get all achievements ✓
3. Find achievement(s) where required_exchanges <= count ✓
4. Unlock achievement (if not already) ✓
5. Create coupon from reward ✓
6. Add to user's wallet ✓
7. Return newly unlocked list 🎉
```

## 💾 Database Key Relationships

```
users
  ├── has_many: reviews (as seller)
  ├── has_many: reviews (as buyer)
  ├── has_many: user_achievements
  ├── has_many: coupon_wallet
  ├── has_many: supplier_badges
  └── reputation fields: average_rating, total_exchanges, etc.

materials
  ├── has_many: reviews (implicit via reviews → order_items)
  ├── belongs_to: user (listed_by)
  ├── pricing: price, is_free
  └── delivery: delivery_option, sustainability_impact

orders
  ├── has_many: order_items
  ├── has_one: coupon (coupon_id)
  ├── belongs_to: user (buyer)
  ├── payment: payment_method, delivery_option
  └── review: has_one (implicit)

reviews
  ├── belongs_to: order
  ├── belongs_to: user (buyer) → review_count++
  ├── belongs_to: user (seller) → average_rating updated, badges checked
  └── ratings: star_rating, delivery_experience_rating, material_quality_rating

achievements
  ├── has_many: user_achievements
  ├── has_many: coupons (via reward_type matching)
  └── config: required_exchanges, icon_emoji

coupons
  ├── has_many: coupon_wallet (tracking user unlocks)
  └── types: free_delivery, delivery_discount, marketplace_discount, listing_boost

coupon_wallet
  ├── belongs_to: user
  ├── belongs_to: coupon
  └── belongs_to: order (used_on_order_id)
```

## 🛠 Development Commands

```bash
# Backend
npm run dev -w apps/backend          # Start backend in dev mode
npm run build -w apps/backend        # Build backend

# Frontend
npm run dev -w apps/frontend         # Start frontend dev server
npm run build -w apps/frontend       # Build for production

# Full workspace
npm install                          # Install all dependencies
npm run build                        # Build entire workspace
```

## 🧪 Testing Key Flows

### Test Material Listing with Pricing
```
1. Login as supplier
2. Create material with:
   - Title: "Copper Pipes"
   - Category: "Metal"
   - Price: 300
   - Delivery: "delivery_available"
   - Sustainability: "Saves 8 kg of waste"
3. Material appears in marketplace with price
```

### Test Checkout Flow
```
1. Login as buyer
2. Add material to cart
3. Go to checkout
4. Verify address populated from profile
5. Select payment method (UPI/Card/Wallet)
6. Apply coupon if available
7. Verify total calculated with tax
8. Place order
9. Tree planted ✓ (check user profile)
```

### Test Review & Reputation
```
1. Complete previous order
2. Leave review (5 stars, comment)
3. Verify seller's avg_rating updated
4. Check if seller earned badge
5. View seller profile → see badges
```

### Test Achievements
```
1. Complete 3 orders total
2. Achievement triggered: "Seed Planter"
3. Coupon appears in wallet → "SEED_PLANTER_xxx"
4. Can apply coupon on checkout
```

## ⭐ Key Features by Component

| Feature | Location | Status |
|---------|----------|--------|
| Material Pricing | `MaterialListingForm.jsx` | ✅ Complete |
| Checkout with Coupons | `EnhancedCheckout.jsx` | ✅ Complete |
| Star Ratings | `ReviewForm.jsx` | ✅ Complete |
| Supplier Stats | `SupplierProfile.jsx` | ✅ Complete |
| Circular Score | `UserDashboard.jsx` | ✅ Complete |
| Achievement Progress | `UserDashboard.jsx` | ✅ Complete |
| Coupon Wallet | `UserDashboard.jsx` | ✅ Complete |
| Badge Display | `SupplierProfile.jsx` | ✅ Complete |
| Order History | `OrdersPage.jsx` | ✅ Existing |
| Shipment Tracking | `OrdersPage.jsx` | ✅ Existing |

## 🐛 Debugging Tips

### Check if Achievements Initialize
```
In database: SELECT * FROM achievements;
Should have 4 rows: Seed Planter, Eco Gardener, Forest Guardian, Circular Champion
```

### Trace Order Creation
```
1. orderController.js → placeOrder() logs order creation
2. Check orders table for new row
3. Check users table: seller.total_exchanges incremented
4. Check order_items for items
5. Check shipments created via logistics API
```

### Debug Coupon Application
```
1. Check coupon_wallet table for entries
2. Verify is_used = FALSE for available coupons
3. Check discount calculation in coupon.service.js
4. Verify order.coupon_id is set after application
```

### View Supplier Reputation
```sql
SELECT id, name, average_rating, total_exchanges, 
       total_waste_reused_kg, review_count, trees_planted
FROM users WHERE id = '<seller_id>';
```

## 📊 Database Queries for Analytics

```sql
-- Top suppliers by rating
SELECT name, average_rating, total_exchanges 
FROM users WHERE role='supplier' 
ORDER BY average_rating DESC, total_exchanges DESC 
LIMIT 10;

-- Most impactful suppliers
SELECT name, total_waste_reused_kg 
FROM users WHERE role='supplier' 
ORDER BY total_waste_reused_kg DESC 
LIMIT 10;

-- Recently completed orders
SELECT o.id, u.name, o.total_amount, o.created_at
FROM orders o
JOIN users u ON o.buyer_id = u.id
WHERE o.order_status = 'completed'
ORDER BY o.created_at DESC
LIMIT 20;

-- Review statistics
SELECT seller_id, AVG(star_rating) as avg_rating, COUNT(*) as review_count
FROM reviews
GROUP BY seller_id
ORDER BY avg_rating DESC;
```

## 🎨 Styling Guidelines

- **Primary Color**: `#27ae60` (Green for sustainability)
- **Accent Color**: `#f39c12` (Orange for achievements/ratings)
- **Info Color**: `#3498db` (Blue for delivery/logistics)
- **Text**: `#2c3e50` (Dark gray)
- **Borders**: `#ddd` (Light gray)

All components use consistent spacing with `1rem` base unit.

---

**Last Updated**: March 2026
**Status**: Production Ready ✅
