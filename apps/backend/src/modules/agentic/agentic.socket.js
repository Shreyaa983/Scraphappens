import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { runMultiAgentChat } from "./agentic.orchestrator.js";
import { createToolRegistry } from "./agentic.tools.js";
import { computeCartSummary } from "./commerce.utils.js";

export const setupAgenticSocket = (io) => {
  const tools = createToolRegistry();

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      // allow guest connections, but tool calls will be limited
      socket.data.user = null;
      return next();
    }

    try {
      const payload = jwt.verify(token, env.jwtSecret);
      socket.data.user = payload;
      return next();
    } catch {
      socket.data.user = null;
      return next();
    }
  });

  io.on("connection", (socket) => {
    console.log("Client connected to Agentic Socket:", socket.id);

    socket.on("prompt", async ({ text, userId, history = [] }) => {
      try {
        console.log("Received prompt:", text);

        const user = socket.data.user || (userId ? { sub: userId, role: "unknown" } : null);
        const result = await runMultiAgentChat({ text, user, history });
        socket.emit("response", { text: result.text, listings: result.listings, cart_summary: result.cart_summary });
      } catch (error) {
        console.error("Error in Agentic Socket:", error);
        socket.emit("response", { text: "I'm sorry, I encountered an error processing your request." });
      }
    });

    socket.on("action", async (payload) => {
      try {
        const user = socket.data.user;
        if (!user?.sub) {
          socket.emit("response", { text: "Please log in first to modify your cart." });
          return;
        }
        if (payload?.type === "add_to_cart") {
          await tools.add_to_cart({ user, material_id: payload.material_id, quantity: payload.quantity ?? 1 });
          const cart = await tools.get_cart({ user });
          const summary = computeCartSummary(cart.items || []);
          socket.emit("response", {
            text: `Added to cart. Your subtotal is Rs.${summary.subtotal}.\nWant to add anything else?`,
            cart_summary: summary,
          });
          return;
        }

        if (payload?.type === "show_summary") {
          const cart = await tools.get_cart({ user });
          const summary = computeCartSummary(cart.items || []);
          socket.emit("response", {
            text: `Here is your checkout summary:\nSubtotal: Rs.${summary.subtotal}\nSay what else to add, or say "place order" when ready. I will use the address saved in your account.`,
            cart_summary: summary,
          });
          return;
        }

        socket.emit("response", { text: "Sorry, I cannot do that action yet." });
      } catch (error) {
        console.error("Error in Agentic Socket action:", error);
        socket.emit("response", { text: error.message || "Action failed." });
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected from Agentic Socket:", socket.id);
    });
  });
};
