import * as materialModel from "../../models/materialModel.js";
import * as cartModel from "../../models/cartModel.js";
import * as orderController from "../../controllers/orderController.js";
import * as diyController from "../../controllers/diyController.js";
import { generateAgentResponse } from "./gemini.service.js";

// NOTE: Tools are backend-only "capabilities" the agent can execute.
// They are NOT direct DB access from the model. The orchestrator can only call these.

function requireUser(user) {
  if (!user?.sub) {
    const err = new Error("Unauthorized");
    err.statusCode = 401;
    throw err;
  }
}

function makeFakeRes() {
  const payload = { statusCode: 200, body: null };
  return {
    status(code) {
      payload.statusCode = code;
      return this;
    },
    json(obj) {
      payload.body = obj;
      return payload;
    },
  };
}

async function callController(handler, req) {
  const res = makeFakeRes();
  const out = await handler(req, res);
  // controller may "return res.status().json()" => our fakeRes returns payload
  return out?.body ?? out ?? res.body;
}

async function semanticRankMaterials({ query, materials, limit = 6 }) {
  const snapshot = (materials || []).slice(0, 80).map((m) => ({
    id: m.id,
    title: m.title,
    description: m.description,
    material_type: m.material_type,
    category: m.category,
    condition: m.condition,
    location: m.location,
    price: m.is_free ? 0 : m.price,
    is_free: m.is_free,
    quantity: m.quantity,
    quantity_unit: m.quantity_unit,
  }));

  const system = `
You rank marketplace listings for a circular economy app.
Given a user query and a list of listings, return ONLY JSON:
{ "ranked_ids": ["id1","id2",...], "notes": "short" }
Rules:
- Prefer best semantic match to intent, then price/value, then availability.
- If user asks for "free", strongly prefer is_free items.
`;

  const prompt = `
User query: ${query}
Listings JSON: ${JSON.stringify(snapshot)}
Return ranked_ids with at most ${limit} ids.
`;

  const raw = await generateAgentResponse(prompt, system, []);
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  const jsonText = start !== -1 && end !== -1 ? raw.slice(start, end + 1) : raw;
  const parsed = JSON.parse(jsonText);
  const ids = Array.isArray(parsed.ranked_ids) ? parsed.ranked_ids : [];
  return ids.slice(0, limit);
}

export function createToolRegistry() {
  return {
    // --- Navigation hint (frontend handles it) ---
    open_page: async ({ path }) => {
      if (!path || typeof path !== "string") throw new Error("path is required");
      return { open: path };
    },

    // --- Materials ---
    list_materials: async ({ limit = 50 } = {}) => {
      const all = await materialModel.getAllMaterials();
      return { materials: all.slice(0, Math.max(1, Math.min(200, Number(limit) || 50))) };
    },
    search_materials: async ({ query, limit = 6 } = {}) => {
      if (!query || typeof query !== "string") throw new Error("query is required");
      const all = await materialModel.getAllMaterials();
      const rankedIds = await semanticRankMaterials({ query, materials: all, limit: Number(limit) || 6 }).catch(() => []);
      const ranked = rankedIds.length
        ? rankedIds.map((id) => all.find((m) => m.id === id)).filter(Boolean)
        : all.slice(0, Math.max(1, Math.min(20, Number(limit) || 6)));

      const listings = ranked.map((m, idx) => ({
        index: idx + 1,
        id: m.id,
        title: m.title,
        price: m.is_free ? 0 : m.price,
        is_free: Boolean(m.is_free),
        location: m.location || null,
        condition: m.condition || null,
        quantity: m.quantity,
        quantity_unit: m.quantity_unit,
        image_url: m.image_url || null,
      }));

      return { listings };
    },
    get_material: async ({ id }) => {
      if (!id) throw new Error("id is required");
      const material = await materialModel.getMaterialById(id);
      if (!material) {
        const err = new Error("Material not found");
        err.statusCode = 404;
        throw err;
      }
      return { material };
    },

    // --- Cart ---
    get_cart: async ({ user }) => {
      requireUser(user);
      const items = await cartModel.getCartItemsForUser(user.sub);
      return { items };
    },
    add_to_cart: async ({ user, material_id, quantity }) => {
      requireUser(user);
      // Reuse existing controller logic to keep validation identical
      return callController(
        // eslint-disable-next-line no-underscore-dangle
        (await import("../../controllers/cartController.js")).addToCart,
        { user, body: { material_id, quantity } }
      );
    },
    add_to_cart_batch: async ({ user, items }) => {
      requireUser(user);
      return callController(
        (await import("../../controllers/cartController.js")).addToCartBatch,
        { user, body: { items } }
      );
    },
    remove_cart_item: async ({ user, id }) => {
      requireUser(user);
      if (!id) throw new Error("id is required");
      return callController(
        (await import("../../controllers/cartController.js")).removeCartItem,
        { user, params: { id } }
      );
    },

    // --- Orders ---
    // NOTE: We intentionally DO NOT forward any payment_method here.
    // The order controller will default to using Shiprocket and the
    // buyer's saved account address for checkout.
    place_order: async ({ user, shipping_address, coupon_code, delivery_option }) => {
      requireUser(user);
      return callController(orderController.placeOrder, {
        user,
        body: { shipping_address, coupon_code, delivery_option },
      });
    },
    get_my_orders: async ({ user }) => {
      requireUser(user);
      return callController(orderController.getMyOrders, { user });
    },
    get_seller_orders: async ({ user }) => {
      requireUser(user);
      return callController(orderController.getSellerOrders, { user });
    },

    // --- DIY (buyer-only routes, but agent can still call and controllers will enforce) ---
    list_diy_posts: async ({ user }) => {
      requireUser(user);
      return callController(diyController.listDiyPosts, { user, query: {} });
    },
    generate_diy_post: async ({ user, materialName }) => {
      requireUser(user);
      return callController(diyController.generateDiyPost, { user, body: { materialName } });
    },
    get_diy_post: async ({ user, id }) => {
      requireUser(user);
      return callController(diyController.getDiyPost, { user, params: { id } });
    },
  };
}



