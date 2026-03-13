import { generateAgentResponse } from "./gemini.service.js";
import * as materialModel from "../../models/materialModel.js";
import { createToolRegistry } from "./agentic.tools.js";

function computeCartSummary(items = []) {
  const lines = items.map((it) => {
    const unitPrice = it?.is_free ? 0 : Number(it?.price) || 0;
    const qty = Number(it?.quantity) || 0;
    const lineTotal = unitPrice * qty;
    return {
      cart_item_id: it.id,
      material_id: it.material_id,
      title: it.title,
      quantity: qty,
      unit_price: unitPrice,
      line_total: lineTotal,
      seller_name: it.seller_name || null,
      location: it.location || null,
      image_url: it.image_url || null,
    };
  });

  const subtotal = lines.reduce((sum, l) => sum + (Number(l.line_total) || 0), 0);
  return { lines, subtotal };
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

export function createCommerceFlow() {
  const tools = createToolRegistry();

  return {
    async handleUserText({ socketState, user, text }) {
      const state = socketState.flow || { stage: "idle", lastListings: [] };
      const lower = (text || "").toLowerCase();

      // If we just asked "anything else?" and they say no => show summary
      if (state.stage === "asking_more") {
        const isNo = /\b(no|nope|nah|that's all|done|checkout|summary|finish)\b/i.test(lower);
        if (isNo) {
          const cart = await tools.get_cart({ user });
          const summary = computeCartSummary(cart.items || []);
          socketState.flow = { stage: "idle", lastListings: [] };
          return {
            text: `Here is your checkout summary:\nSubtotal: Rs.${summary.subtotal}\nSay "place order" when you're ready, or tell me what else to add. I will use the address saved in your account.`,
            cart_summary: summary,
          };
        }
      }

      // Otherwise: treat as a materials search request
      const all = await materialModel.getAllMaterials();
      const rankedIds = await semanticRankMaterials({ query: text, materials: all, limit: 6 }).catch(() => []);
      const idSet = new Set(rankedIds);
      const ranked = rankedIds.length
        ? rankedIds.map((id) => all.find((m) => m.id === id)).filter(Boolean)
        : all.slice(0, 6);

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

      socketState.flow = { stage: "showing_listings", lastListings: listings };

      return {
        text: listings.length
          ? `I found ${listings.length} relevant listings. Tap "Add to cart" on any item, or say "add 1", "add 2", etc.`
          : "I could not find any listings for that right now. Try another material or location.",
        listings,
        meta: { reranked: rankedIds.length > 0, matched: Array.from(idSet).length },
      };
    },

    async handleUserAction({ socketState, user, action }) {
      const state = socketState.flow || { stage: "idle", lastListings: [] };

      if (action?.type === "add_to_cart") {
        const material_id = action.material_id;
        const quantity = action.quantity ?? 1;
        await tools.add_to_cart({ user, material_id, quantity });

        const cart = await tools.get_cart({ user });
        const summary = computeCartSummary(cart.items || []);

        socketState.flow = { ...state, stage: "asking_more" };
        return {
          text: `Added to cart. Your subtotal is Rs.${summary.subtotal}.\nDo you want to buy any more materials? (yes/no)`,
          cart_summary: summary,
        };
      }

      if (action?.type === "show_summary") {
        const cart = await tools.get_cart({ user });
        const summary = computeCartSummary(cart.items || []);
        socketState.flow = { stage: "idle", lastListings: [] };
        return {
          text: `Here is your checkout summary:\nSubtotal: Rs.${summary.subtotal}\nSay "place order" when you're ready, or tell me what else to add. I will use the address saved in your account.`,
          cart_summary: summary,
        };
      }

      return { text: "Sorry, I cannot do that action yet." };
    },
  };
}
