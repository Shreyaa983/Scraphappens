import { GoogleGenerativeAI } from "@google/generative-ai";
import { CIRCULAR_CONTEXT } from "./context.js";
import { env } from "../../config/env.js";

// --- EXISTING CHATBOT LOGIC (UNCHANGED) ---
export const generateChatResponse = async (message) => {
  const apiKey = process.env.GEMINI_API_KEY || env.geminiApiKey;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite-preview';
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: CIRCULAR_CONTEXT,
  });

  const result = await model.generateContent(message);
  // Using await result.response to ensure it's ready
  const response = await result.response;
  return response.text();
};

// --- NEW SUGGESTIONS LOGIC (FIXED) ---
export const generateProductSuggestions = async (productName) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY || env.geminiApiKey;
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Switch to the stable 1.5-flash for better instruction following
    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite-preview' });

    const prompt = `
      You are an expert upcycling consultant for "Scraphappens".
      Please make sure the suggestions are easy to understand and implement for our users, who may not have advanced DIY skills.
      Please simple in understanding not too technical. Just easy to understand
      
      CORE MATERIAL: ${productName}
      
      TASK: 
      1. Identify the properties of "${productName}". 
      2. Suggest 4 DIY projects that are ONLY possible with this specific material.
      
      STRICT CONSTRAINTS:
      - If the material is FABRIC: Do NOT suggest furniture. Suggest sewing/textile projects.
      - If the material is WOOD: Suggest carpentry or rustic decor.
      - If the material is METAL: Suggest welding, industrial, or magnetic projects.
      - If the material is PLASTIC: Suggest melting, weaving, or storage projects.
      
      FORMAT: 
      Return ONLY a JSON array of 4 strings. No conversational filler.
      Example: ["Project 1", "Project 2", "Project 3", "Project 4"]
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();

    // Cleaning to ensure valid JSON
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']') + 1;

    if (start !== -1 && end !== -1) {
      const cleanJson = text.substring(start, end);
      const parsed = JSON.parse(cleanJson);
      return parsed.slice(0, 4);
    }

    throw new Error("JSON extraction failed");

  } catch (error) {
    console.error("Gemini Error:", error);
    // Dynamic Fallback so it's never "random"
    return [
      `Creative project using ${productName}`,
      `Handmade ${productName} utility item`,
      `Custom ${productName} decorative piece`,
      `Upcycled ${productName} gift idea`
    ];
  }
};

export async function getAiSuggestion({ prompt, role }) {
  if (!prompt) throw new Error("prompt is required");
  return { provider: "gemini", output: "Use generateProductSuggestions for full logic." };
}