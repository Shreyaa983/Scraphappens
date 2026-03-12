import { GoogleGenerativeAI } from "@google/generative-ai";
import { CIRCULAR_CONTEXT } from "./context.js";
import { env } from "../../config/env.js";

export const generateChatResponse = async (message) => {
  const apiKey = process.env.GEMINI_API_KEY || env.geminiApiKey;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in .env");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite-preview';

  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: CIRCULAR_CONTEXT,
  });

  const result = await model.generateContent(message);
  const response = result.response;
  const text = response.text();
  return text;
};

export async function getAiSuggestion({ prompt, role }) {
  if (!prompt) {
    throw new Error("prompt is required");
  }

  if (!env.openAiApiKey) {
    return {
      provider: "placeholder",
      output: `AI module ready. Received prompt for role '${role}': ${prompt}`
    };
  }

  return {
    provider: "placeholder-with-key",
    output: `OPENAI_API_KEY is configured. Plug provider SDK into ai.service.js next.`
  };
}
