import { generateAgentResponse } from "./gemini.service.js";
import { createToolRegistry } from "./agentic.tools.js";

function isCheckoutIntent(rawText = "") {
  const text = String(rawText || "").toLowerCase().trim();

  if (!text) return false;

  // Direct phrases
  if (/\b(place order|checkout|proceed to checkout|confirm order|buy now)\b/i.test(text)) {
    return true;
  }

  // Cart-specific confirmations
  if (
    text.includes("proceed with my cart") ||
    text.includes("proceed with cart") ||
    text.includes("proceed with the cart")
  ) {
    return true;
  }

  // Short confirmations that explicitly mention proceed/checkout
  if (/\b(yes|ok|okay|yep|yeah|sure)\b/.test(text) && /\b(proceed|checkout|place( the)? order)\b/.test(text)) {
    return true;
  }

  // "I'm ready" style confirmations
  if (/\b(i am|i'm)\s+ready\b/.test(text)) {
    return true;
  }

  return false;
}

function extractAddToCartQuery(rawText = "") {
  const text = String(rawText || "").toLowerCase().trim();
  if (!text) return null;

  // Common phrasings: "add shreya wood table to cart", "add 2 shreya tables to my cart"
  const addMatch = text.match(/add\s+(.+?)\s+to\s+(my\s+)?cart/);
  if (!addMatch) {
    return null;
  }

  const phrase = addMatch[1].trim();

  // Try to pull out a leading quantity if present (e.g. "2 shreya wood table")
  const qtyMatch = phrase.match(/^(\d+)\s+(.*)$/);
  if (qtyMatch) {
    const quantity = Number(qtyMatch[1]) || 1;
    const query = qtyMatch[2].trim();
    return { query, quantity };
  }

  return { query: phrase, quantity: 1 };
}

async function isSemanticCheckoutIntent({ text, history }) {
  const system = `
You are an intent classifier for Scraphappens.
Your ONLY job is to decide if the user is clearly asking to PLACE THEIR ORDER / PROCEED TO CHECKOUT
for their CURRENT CART using their saved account information.

Consider the recent assistant messages in "history" (cart summaries, confirmations, etc.).
If the user is just browsing materials or changing their cart, the intent is "other".
If the user is confirming ("yes", "go ahead", "I'm ready") in the context of checkout,
the intent is "checkout".

Return ONLY JSON:
{ "intent": "checkout" | "other", "reason": "very short explanation" }
`;

  const prompt = `
User text: ${text}

Recent history (assistant + user turns, most recent last):
${JSON.stringify(history ?? [])}
`;

  const raw = await generateAgentResponse(prompt, system, history);
  const parsed = safeJsonParse(raw);
  return parsed?.intent === "checkout";
}

function safeJsonParse(text) {
  const trimmed = (text || "").trim();
  // Try raw JSON first
  try {
    return JSON.parse(trimmed);
  } catch {
    // Try extracting JSON object from fenced or mixed text
    const startObj = trimmed.indexOf("{");
    const endObj = trimmed.lastIndexOf("}");
    if (startObj !== -1 && endObj !== -1 && endObj > startObj) {
      const slice = trimmed.slice(startObj, endObj + 1);
      return JSON.parse(slice);
    }
    throw new Error("Could not parse model JSON");
  }
}

const SUPERVISOR_SYSTEM = `
You are the Supervisor agent for Scraphappens.
You route user requests to ONE specialist agent: buyer | seller | diy.

Return ONLY JSON:
{
  "agent": "buyer" | "seller" | "diy",
  "reason": "short",
  "handoff_context": "short context for the specialist"
}
`;

function getSpecialistSystem(agentName) {
  if (agentName === "buyer") {
    return `
You are the Buyer agent for Scraphappens. You help users discover materials, add multiple items to cart, and place orders.
You MUST use tools for actions. For checkout, use the buyer's saved account address and do not ask for a payment method.

Tool calling format (RETURN ONLY JSON):
{
  "message": "what you say to the user",
  "tool_calls": [
    { "name": "search_materials", "args": { "query": "wood planks", "limit": 6 } }
  ]
}

Available tools:
- list_materials({limit})
- search_materials({query, limit}) -> returns {listings:[...]} for in-chat cards
- get_material({id})
- get_cart({user})
- add_to_cart({user, material_id, quantity})
- add_to_cart_batch({user, items:[{material_id, quantity}]})
- remove_cart_item({user, id})
- place_order({user, coupon_code, delivery_option})
- get_my_orders({user})
- open_page({path})

Rules:
- If the user says "show my cart" or similar, call get_cart and summarize.
- When you call search_materials, do NOT re-list the full raw JSON; just tell the user you found listings and they can tap Add to cart.
- For multi-item adds, prefer add_to_cart_batch.
- Never place an order unless user explicitly confirms.
- Once the user confirms checkout, place the order directly. Do not ask for shipping address or payment method.
`;
  }

  if (agentName === "seller") {
    return `
You are the Seller agent for Scraphappens. You help sellers manage listings and view seller orders.
If the user is not a seller, explain and suggest next steps.

Return ONLY JSON: {"message": "...", "tool_calls":[...]}

Available tools:
- list_materials({limit})
- get_seller_orders({user})
- open_page({path})

Note: Listing create/update/delete tools are not exposed in this first pass unless requested.
`;
  }

  return `
You are the DIY agent for Scraphappens. You help buyers find or generate DIY ideas and map them to materials.
Return ONLY JSON: {"message": "...", "tool_calls":[...]}

Available tools:
- list_diy_posts({user})
- generate_diy_post({user, materialName})
- get_diy_post({user, id})
- list_materials({limit})
- open_page({path})
`;
}

export async function runMultiAgentChat({ text, user, history = [] }) {
  const tools = createToolRegistry();

  // -1) Deterministic "add X to cart" handling so it always works
  const addIntent = extractAddToCartQuery(text);
  if (addIntent) {
    try {
      const { query, quantity } = addIntent;
      const searchResult = await tools.search_materials({ query, limit: 3 });
      const top = (searchResult?.listings || [])[0];

      if (!top?.id) {
        return {
          text: `I tried to find "${query}" but couldn't match it to any listing. Try a shorter name or tap one of the results.`,
          listings: searchResult?.listings || [],
          debug: { agent: "buyer", fastPath: "add_to_cart_no_match", query },
        };
      }

      await tools.add_to_cart({ user, material_id: top.id, quantity });
      const cart = await tools.get_cart({ user });

      return {
        text: `Added ${quantity} of "${top.title}" to your cart.\nYou now have ${cart.items?.length || 0} item(s) in your cart.`,
        cart_summary: { items: cart.items || [] },
        debug: { agent: "buyer", fastPath: "add_to_cart", material_id: top.id },
      };
    } catch (error) {
      return {
        text: error.message || "I couldn't add that item to your cart right now.",
        debug: { agent: "buyer", fastPath: "add_to_cart_error", error: error.message },
      };
    }
  }

  // 0) Fast-path + semantic checkout detection so users can "say anything"
  let wantsCheckout = isCheckoutIntent(text);
  if (!wantsCheckout) {
    try {
      wantsCheckout = await isSemanticCheckoutIntent({ text, history });
    } catch {
      // If semantic classifier fails, just fall back to normal routing
      wantsCheckout = false;
    }
  }

  if (wantsCheckout) {
    try {
      const placed = await tools.place_order({ user });
      const orderId = placed?.order?.id;
      const sellerCount = new Set((placed?.order_items || []).map((item) => item.seller_id).filter(Boolean)).size;
      return {
        text: orderId
          ? `Your order has been placed successfully. I used the address saved in your account, your cart is now empty, you can view the order in My Orders, and ${sellerCount || "the"} seller${sellerCount === 1 ? "" : "s"} can now see it in Seller Orders. Order ID: ${orderId}.`
          : "Your order has been placed successfully using the address saved in your account. Your cart is now empty, and the order is available in My Orders and Seller Orders.",
        debug: { agent: "buyer", autoCheckout: true },
      };
    } catch (error) {
      return {
        text: error.message || "I couldn't place the order right now.",
        debug: { agent: "buyer", autoCheckout: true, error: error.message },
      };
    }
  }

  // 1) Supervisor routes
  const supervisorPrompt = `
User role: ${user?.role || "unknown"}
User message: ${text}
`;

  const supervisorRaw = await generateAgentResponse(supervisorPrompt, SUPERVISOR_SYSTEM, history);
  const supervisor = safeJsonParse(supervisorRaw);
  const agentName = supervisor.agent || "buyer";

  // 2) Specialist executes with tool loop
  const specialistSystem = getSpecialistSystem(agentName);

  let workingText = `
Handoff context: ${supervisor.handoff_context || ""}
User role: ${user?.role || "unknown"}
User message: ${text}
`;

  const maxSteps = 6;
  const toolTraces = [];

  for (let step = 0; step < maxSteps; step += 1) {
    const raw = await generateAgentResponse(workingText, specialistSystem, history);
    let parsed;
    try {
      parsed = safeJsonParse(raw);
    } catch (e) {
      return {
        text: "I had trouble understanding that request. Could you rephrase it?",
        debug: { agent: agentName, error: e.message, raw },
      };
    }

    const toolCalls = Array.isArray(parsed.tool_calls) ? parsed.tool_calls : [];
    const message = typeof parsed.message === "string" ? parsed.message : "";

    if (toolCalls.length === 0) {
      return { text: message || "Done.", debug: { agent: agentName, toolTraces } };
    }

    // execute tools sequentially
    const results = [];
    let combinedListings = null;
    for (const call of toolCalls) {
      const name = call?.name;
      const args = call?.args || {};
      if (!name || typeof tools[name] !== "function") {
        results.push({ name, error: "Unknown tool" });
        continue;
      }
      try {
        const finalArgs = { ...args };
        // Inject authenticated user context for user-scoped tools
        if (["get_cart", "add_to_cart", "add_to_cart_batch", "remove_cart_item", "place_order", "get_my_orders", "get_seller_orders", "list_diy_posts", "generate_diy_post", "get_diy_post"].includes(name)) {
          finalArgs.user = user;
        }
        const out = await tools[name](finalArgs);
        toolTraces.push({ name, args: finalArgs, ok: true });
        results.push({ name, result: out });
        if (name === "search_materials" && out?.listings) {
          combinedListings = out.listings;
        }
      } catch (err) {
        toolTraces.push({ name, args, ok: false, error: err.message });
        results.push({ name, error: err.message });
      }
    }

    // Feed tool results back to the specialist
    workingText = `
User role: ${user?.role || "unknown"}
User message: ${text}
Last message you said: ${message}
Tool results (JSON): ${JSON.stringify(results)}

Now respond with the next step. If you need user confirmation (checkout), ask explicitly.
Return ONLY JSON.
`;

    // If we already have listings, we can return them to the UI as cards
    if (combinedListings && message) {
      return { text: message, listings: combinedListings, debug: { agent: agentName, toolTraces } };
    }
  }

  return { text: "I got partway through but need you to confirm what to do next. What would you like?", debug: { agent: agentName, toolTraces } };
}



