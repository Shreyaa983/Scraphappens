import { generateAgentResponse } from "./gemini.service.js";
import { getSystemContext } from "./agentic.context.js";

export const setupAgenticSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("Client connected to Agentic Socket:", socket.id);

    socket.on("prompt", async ({ text, userId, history = [] }) => {
      try {
        console.log("Received prompt:", text);
        
        // 1. Get real-time system context
        const systemInstruction = await getSystemContext(userId);

        // 2. Generate response from Gemini
        const responseText = await generateAgentResponse(text, systemInstruction, history);

        // 3. Send response back to frontend
        socket.emit("response", { text: responseText });
      } catch (error) {
        console.error("Error in Agentic Socket:", error);
        socket.emit("response", { text: "I'm sorry, I encountered an error processing your request." });
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected from Agentic Socket:", socket.id);
    });
  });
};
