# Circular Economy Marketplace - Complete API Documentation

## Overview
This document describes all the new marketplace, trust, reputation, and gamification endpoints added to the Augenblick platform.

---

## 1. MATERIAL LISTING ENDPOINTS

### Create Material Listing
**POST** `/api/materials`

**Auth Required:** YES (Seller/Supplier role)

**Request Body:**
```json
{
  "title": "Copper Pipes",
  "description": "Industrial copper pipes in good condition",
  "category": "Metal",
  "condition": "Good",
  "quantity": 100,
  "quantity_unit": "kg",
  "location": "Mumbai, Maharashtra",
  "price": 300,
  "is_free": false,
  "delivery_option": "delivery_available",
  "sustainability_impact": "Saves 8 kg of waste from landfill",
  "image_url": "https://example.com/image.jpg"
}
```

**Response:**
```json
{
  "material": {
    "id": "uuid",
    "title": "Copper Pipes",
    "price": 300,
    "is_free": false,
    "delivery_option": "delivery_available",
    "sustainability_impact": "Saves 8 kg of waste from landfill",
    ...
  }
}
```

### Update Material Listing
**PUT** `/api/materials/:id`

**Auth Required:** YES (Owner only)

Same request/response format as Create.

### Get All Materials
**GET** `/api/materials`

**Auth Required:** NO

**Response:**
```json
{
  "materials": [
    {
      "id": "uuid",
      "title": "Copper Pipes",
      "category": "Metal",
      "price": 300,
      "location": "Mumbai",
      "sustainability_impact": "Saves 8 kg of waste from landfill",
      ...
    }
  ]
}
```

---

## 2. CART & CHECKOUT ENDPOINTS

### Place Order with Payment & Coupons
**POST** `/api/orders/place`

**Auth Required:** YES (Buyer role)

**Request Body:**
```json
{
  "shipping_address": "123 Main St, Mumbai, Maharashtra 400001",
  "coupon_code": "SEED_PLANTER_ABC123",
  "payment_method": "upi",
  "delivery_option": "standard"
}
```

**Response:**
```json
{
  "order": {
    "id": "uuid",
    "buyer_id": "uuid",
    "total_amount": 950,
    "discount_applied": 50,
    "final_amount": 900,
    "payment_method": "upi",
    "delivery_option": "standard",
    "order_status": "completed"
  },
  "order_items": [...],
  "shipment": {...},
  "achievement": {...},
  "newly_unlocked_achievements": [...],
  "tree_planted": true
}
```

**Payment Methods:** `upi`, `card`, `wallet`

**Delivery Options:** `standard` (3-5 days), `express` (1-2 days)

---

## 3. REVIEWS & RATINGS ENDPOINTS

### Submit Review for Order
**POST** `/api/reviews`

**Auth Required:** YES (Buyer who placed the order)

**Request Body:**
```json
{
  "order_id": "uuid",
  "seller_id": "uuid",
  "star_rating": 5,
  "comment": "Great quality materials, excellent packaging",
  "delivery_experience_rating": 4,
  "material_quality_rating": 5
}
```

**Response:**
```json
{
  "id": "uuid",
  "star_rating": 5,
  "delivery_experience_rating": 4,
  "material_quality_rating": 5,
  "comment": "Great quality materials...",
  "created_at": "2026-03-12T10:30:00Z"
}
```

**Validation:**
- `star_rating`: 1-5 (required)
- `delivery_experience_rating`: 1-5 (required)
- `material_quality_rating`: 1-5 (required)
- Only ONE review per order allowed
- Order must be completed to review

### Get Supplier Reviews
**GET** `/api/reviews/supplier/:seller_id`

**Auth Required:** NO

**Response:**
```json
{
  "reviews": [
    {
      "id": "uuid",
      "star_rating": 5,
      "comment": "...",
      "buyer_name": "John Doe",
      "created_at": "2026-03-12T10:30:00Z",
      "delivery_experience_rating": 4,
      "material_quality_rating": 5
    }
  ]
}
```

### Get Supplier Stats
**GET** `/api/reviews/stats/:seller_id`

**Auth Required:** NO

**Response:**
```json
{
  "stats": {
    "total_reviews": 42,
    "average_rating": 4.6,
    "avg_delivery_rating": 4.5,
    "avg_quality_rating": 4.7,
    "badges": [
      "Verified Circular Supplier",
      "Trusted Circular Partner"
    ]
  }
}
```

---

## 4. ACHIEVEMENTS & REWARDS ENDPOINTS

### Get All Achievements
**GET** `/api/achievements`

**Auth Required:** NO

**Response:**
```json
{
  "achievements": [
    {
      "id": "uuid",
      "name": "Seed Planter",
      "description": "Complete 3 successful reuses",
      "required_exchanges": 3,
      "reward_type": "delivery_discount",
      "reward_value": "5",
      "icon_emoji": "🌱"
    },
    {
      "id": "uuid",
      "name": "Eco Gardener",
      "description": "Complete 10 successful reuses",
      "required_exchanges": 10,
      "reward_type": "free_delivery",
      "reward_value": null,
      "icon_emoji": "🌿"
    },
    {
      "id": "uuid",
      "name": "Forest Guardian",
      "description": "Complete 25 successful reuses",
      "required_exchanges": 25,
      "reward_type": "listing_boost",
      "reward_value": "7",
      "icon_emoji": "🌳"
    }
  ]
}
```

### Get User's Achievements
**GET** `/api/achievements/user/mine`

**Auth Required:** YES

**Response:**
```json
{
  "achievements": [
    {
      "id": "uuid",
      "name": "Seed Planter",
      "icon_emoji": "🌱",
      "unlocked_at": "2026-03-10T12:00:00Z"
    }
  ]
}
```

### Get Achievement Progress
**GET** `/api/achievements/progress`

**Auth Required:** YES

**Response:**
```json
{
  "progress": {
    "current_exchanges": 5,
    "next_achievement": {
      "name": "Eco Gardener",
      "required_exchanges": 10,
      "icon_emoji": "🌿"
    },
    "all_achievements": [
      {
        "name": "Seed Planter",
        "required_exchanges": 3,
        "progress": 100
      }
    ]
  }
}
```

### Check & Unlock Achievements
**POST** `/api/achievements/check`

**Auth Required:** YES

Automatically called after order completion to check for newly unlocked achievements.

**Response:**
```json
{
  "newly_unlocked": [
    {
      "id": "uuid",
      "name": "Seed Planter",
      "icon_emoji": "🌱",
      "reward_type": "delivery_discount"
    }
  ]
}
```

---

## 5. COUPON WALLET ENDPOINTS

### Get User's Coupons
**GET** `/api/coupons`

**Auth Required:** YES

**Response:**
```json
{
  "coupons": [
    {
      "id": "uuid",
      "code": "SEED_PLANTER_ABC123",
      "type": "delivery_discount",
      "value": 5,
      "description": "5% delivery discount from Seed Planter achievement",
      "unlocked_at": "2026-03-10T12:00:00Z",
      "is_used": false
    }
  ]
}
```

### Validate Coupon
**GET** `/api/coupons/validate?coupon_code=SEED_PLANTER_ABC123`

**Auth Required:** NO

**Response:**
```json
{
  "success": true,
  "coupon": {
    "code": "SEED_PLANTER_ABC123",
    "type": "delivery_discount",
    "value": 5
  },
  "discount": 50
}
```

### Apply Coupon to Order
**POST** `/api/coupons/apply`

**Auth Required:** YES

**Request Body:**
```json
{
  "coupon_code": "SEED_PLANTER_ABC123",
  "order_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "is_used": true,
    "used_on_order_id": "uuid"
  }
}
```

---

## 6. REPUTATION & CIRCULAR SCORE ENDPOINTS

### Get User's Circular Score
**GET** `/api/reputation/my-score`

**Auth Required:** YES

**Response:**
```json
{
  "score": {
    "circular_score": 82,
    "rating": 4.6,
    "items_reused": 42,
    "waste_saved_kg": 380.5,
    "trees_planted": 15,
    "badges": [
      "Verified Circular Supplier",
      "Trusted Circular Partner"
    ],
    "score_breakdown": {
      "rating_score": 25,
      "exchange_score": 25,
      "waste_score": 18,
      "tree_score": 14
    }
  }
}
```

### Get Specific User's Circular Score
**GET** `/api/reputation/score/:user_id`

**Auth Required:** NO

Same response format as above.

### Get Top Suppliers
**GET** `/api/reputation/top-suppliers?limit=10`

**Auth Required:** NO

**Response:**
```json
{
  "suppliers": [
    {
      "id": "uuid",
      "name": "GreenBuild Supplies",
      "email": "contact@greenbuild.com",
      "average_rating": 4.6,
      "total_exchanges": 42,
      "total_waste_reused_kg": 380.5,
      "trees_planted": 15,
      "circular_score": 82,
      "review_count": 40
    }
  ]
}
```

---

## 7. AUTHENTICATION ENDPOINTS (UPDATED)

### Register with Phone Number
**POST** `/api/auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secure_password",
  "phone_number": "+91 98765 43210",
  "role": "seller",
  "street_address": "123 Main St",
  "city": "Mumbai",
  "state": "Maharashtra",
  "country": "India",
  "pincode": "400001",
  "latitude": 19.076,
  "longitude": 72.8777
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "phone_number": "+91 98765 43210",
    "role": "seller",
    "average_rating": 0,
    "total_exchanges": 0,
    "trees_planted": 0
  },
  "token": "jwt_token_here"
}
```

### Login
**POST** `/api/auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "phone_number": "+91 98765 43210",
    "average_rating": 4.2,
    "total_exchanges": 15,
    "trees_planted": 5
  },
  "token": "jwt_token_here"
}
```

### Get Current User
**GET** `/api/auth/me`

**Auth Required:** YES

**Response:** Same as login response (user object).

---

## SUSTAINABILITY BADGES

Users and suppliers can earn the following badges:

1. **Verified Circular Supplier**
   - Requirement: 10+ successful exchanges AND rating ≥ 4.0
   - Icon: ✓

2. **Trusted Circular Partner**
   - Requirement: 25+ successful exchanges AND rating ≥ 4.5
   - Icon: ✓✓

3. **Sustainability Leader**
   - Requirement: 50+ successful exchanges AND rating ≥ 4.6
   - Icon: ✓✓✓

---

## ACHIEVEMENT REWARDS

Achievements automatically unlock corresponding coupons:

| Achievement | Requirements | Reward | Coupon Code Pattern |
|---|---|---|---|
| Seed Planter | 3 reuses | 5% delivery discount | `SEED_PLANTER_*` |
| Eco Gardener | 10 reuses | Free delivery | `ECO_GARDENER_*` |
| Forest Guardian | 25 reuses | Listing visibility boost (7 days) | `FOREST_GUARDIAN_*` |
| Circular Champion | 50 reuses | 10% marketplace discount | `CIRCULAR_CHAMPION_*` |

---

## ERROR HANDLING

All endpoints return appropriate HTTP status codes:

- `200`: Success
- `201`: Resource created
- `400`: Bad request (validation error)
- `401`: Unauthorized (authentication failed)
- `403`: Forbidden (insufficient permissions)
- `404`: Not found
- `500`: Server error

Error responses include a `message` field with details.

---

## DATABASE SCHEMA UPDATES

### New Tables
- `reviews` - Customer reviews and ratings
- `coupons` - Coupon codes and definitions
- `coupon_wallet` - User's coupon inventory
- `achievements` - Achievement definitions
- `user_achievements` - User's unlocked achievements
- `supplier_badges` - Badges earned by suppliers

### Updated Tables
- `users` - Added fields:
  - `phone_number` (TEXT)
  - `average_rating` (DECIMAL)
  - `total_exchanges` (INTEGER)
  - `total_waste_reused_kg` (DECIMAL)
  - `review_count` (INTEGER)
  - `trees_planted` (INTEGER)

- `materials` - Added fields:
  - `price` (INTEGER)
  - `is_free` (BOOLEAN)
  - `delivery_option` (TEXT)
  - `sustainability_impact` (TEXT)

- `orders` - Added fields:
  - `coupon_id` (UUID reference)
  - `payment_method` (TEXT)
  - `delivery_option` (TEXT)

---

## Frontend Components Created

1. **MaterialListingForm** - Create/edit material listings with pricing
2. **EnhancedCheckout** - Complete checkout with payment methods and coupon application
3. **ReviewForm** - Submit reviews for completed orders
4. **SupplierProfile** - View supplier reputation, reviews, and badges
5. **UserDashboard** - Display circular score, achievements, and coupon wallet

---

## Integration Flow

1. **User Registration** → Collects phone number
2. **Create Material** → Seller lists item with price and sustainability impact
3. **Add to Cart** → Buyer adds materials from various sellers
4. **Checkout** → Select payment method, apply coupon if available
5. **Order Completion** → Ecosystem updates:
   - Buyer gains tree in garden
   - Seller reputation increases
   - Check for achievement unlocks
   - If achieved, automatically unlock coupon reward
6. **Leave Review** → Buyer rates supplier and order experience
7. **Reputation Update** → Continuous calculation of circular score
8. **Badge Awarding** → Automatic when thresholds are met

---

## Testing the Marketplace

### Sample Request Flow

```bash
# 1. Register as seller
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "GreenBuild",
    "email": "seller@greenbuild.com",
    "password": "pass123",
    "phone_number": "+91 98765 43210",
    "role": "seller",
    "street_address": "456 Industrial Ave",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India",
    "pincode": "400002",
    "latitude": 19.076,
    "longitude": 72.8777
  }'

# 2. Create material listing
curl -X POST http://localhost:4000/api/materials \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Copper Pipes",
    "category": "Metal",
    "condition": "Good",
    "quantity": 100,
    "quantity_unit": "kg",
    "location": "Mumbai",
    "price": 300,
    "is_free": false,
    "delivery_option": "delivery_available",
    "sustainability_impact": "Saves 8 kg of waste from landfill"
  }'

# 3. Complete as buyer → Automatic tree planting + achievement check
# 4. Award achievement → Automatic coupon generation
# 5. Use coupon on next order
```

---

End of Documentation
