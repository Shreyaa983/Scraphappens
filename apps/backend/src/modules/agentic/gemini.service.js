import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../config/env.js";

// Use the dedicated Agent API Key
const genAI = new GoogleGenerativeAI(env.geminiAgentApiKey || env.geminiApiKey);

export const getAgentModel = () => {
  return genAI.getGenerativeModel({ 
    model: 'gemini-3.1-flash-lite-preview',
  });
};

export const generateAgentResponse = async (prompt, systemInstruction, history = []) => {
  const model = getAgentModel();
  
  const chat = model.startChat({
    history: [
      {
        role: "user",
        parts: [{ text: systemInstruction }],
      },
      ...history
    ],
  });

  const result = await chat.sendMessage(prompt);
  const response = await result.response;
  return response.text();
};
