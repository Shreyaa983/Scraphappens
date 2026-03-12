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

        // 2. Persistent Session Management
        if (!socket.chatSession) {
            console.log("Starting new chat session for socket:", socket.id);
            const { startChatSession } = await import("./gemini.service.js");
            socket.chatSession = startChatSession(systemInstruction, history);
        }

        // 3. Generate response from Gemini using session
        const result = await socket.chatSession.sendMessage(text);
        const response = await result.response;
        const responseText = response.text();

        // 4. Send response back to frontend
        socket.emit("response", { text: responseText });
      } catch (error) {
        console.error("Error in Agentic Socket:", error);
        // If session fails, try to restart it next time
        socket.chatSession = null;
        socket.emit("response", { text: "I'm sorry, I encountered an error processing your request." });
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected from Agentic Socket:", socket.id);
    });
  });
};
