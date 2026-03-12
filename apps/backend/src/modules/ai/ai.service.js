import { env } from "../../config/env.js";

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
