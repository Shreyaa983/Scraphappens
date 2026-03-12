import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../config/env.js";

// Use the dedicated Agent API Key
const genAI = new GoogleGenerativeAI(env.geminiAgentApiKey || env.geminiApiKey);

export const getAgentModel = () => {
  return genAI.getGenerativeModel({
    model: 'gemini-3.1-flash-lite-preview',
  });
};

export const startChatSession = (systemInstruction, history = []) => {
  const model = getAgentModel();

  // Format history for Gemini API if it's coming in a different format
  // Gemini expects: { role: 'user' | 'model', parts: [{ text: string }] }
  const formattedHistory = history.map(msg => ({
    role: msg.sender === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.text }]
  }));

  return model.startChat({
    history: [
      {
        role: "user",
        parts: [{ text: systemInstruction }],
      },
      {
          role: "model",
          parts: [{ text: "Understood. I am your Scraphappens Assistant. How can I help you?" }]
      },
      ...formattedHistory
    ],
  });
};

export const generateAgentResponse = async (prompt, systemInstruction, history = []) => {
  const chat = startChatSession(systemInstruction, history);
  const result = await chat.sendMessage(prompt);
  const response = await result.response;
  return response.text();
};

