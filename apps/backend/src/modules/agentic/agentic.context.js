import { sql } from "../../db/client.js";

export const getSystemContext = async (userId) => {
  let userData = null;
  let cartItems = [];
  let availableMaterials = [];

  try {
    if (userId) {
      const users = await sql`SELECT id, name, email, role FROM users WHERE id = ${userId}`;
      userData = users.length > 0 ? users[0] : null;

      if (userData) {
        cartItems = await sql`
          SELECT c.id, m.title, c.quantity 
          FROM cart_items c 
          JOIN materials m ON c.material_id = m.id 
          WHERE c.user_id = ${userId}
        `;
      }
    }

    availableMaterials = await sql`SELECT id, title, material_type, category, condition, quantity, quantity_unit FROM materials LIMIT 10`;
  } catch (dbError) {
    console.warn("Context Builder: Database query failed, continuing with partial context.", dbError.message);
  }

  const appMap = [
    { name: "Marketplace", path: "/" },
    { name: "Cart", path: "/cart" },
    { name: "Buyer Orders", path: "/my-orders" },
    { name: "Seller Orders", path: "/seller-orders" },
    { name: "My Listings Dashboard", path: "/my-listings" },
    { name: "Create New Listing", path: "/create-listing" },
    { name: "Logistics Dashboard", path: "/logistics-dashboard" },
    { name: "Pickup Scheduling Interface", path: "/pickup-scheduling" },
    { name: "Circular Garden", path: "/garden" },
    { name: "Classic AI Chatbot", path: "/ai-assistant" }
  ];

  const systemPrompt = `
You are Scraphappens Assistant, a helpful AI guide for the Scraphappens platform.
Scraphappens is a marketplace for recycled and upcycled materials.

Current User: ${userData ? JSON.stringify(userData) : "Guest"}
User's Cart: ${JSON.stringify(cartItems)}
Available Materials (Snapshot): ${JSON.stringify(availableMaterials)}

Available Navigation Routes:
${appMap.map(route => `- ${route.name}: open ${route.path}`).join("\n")}

YOUR RULES:
1. If the user wants to go to a page, respond with EXACTLY: "open {path}". Example: "open /cart".
2. If you are answering a question, be concise and friendly.
3. You can suggest materials based on what is available.
4. If you perform an action, describe it briefly.
5. ALWAYS use the "open {path}" format for navigation.

Tone: Professional, helpful, and slightly enthusiastic about sustainability.
`;

  return systemPrompt;
};
