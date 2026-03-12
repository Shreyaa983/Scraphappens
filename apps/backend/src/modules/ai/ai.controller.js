import * as aiService from "./ai.service.js";

export async function handleChat(req, res) {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Message is required" });
  try {
    const reply = await aiService.generateChatResponse(message);
    res.json({ reply });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// NEW HANDLER
export async function handleProductSuggestions(req, res) {
  const { productName } = req.body;
  if (!productName) return res.status(400).json({ error: "Product name is required" });
  try {
    const suggestions = await aiService.generateProductSuggestions(productName);
    res.json({ suggestions }); // Returns the array of 4 ideas
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function suggest(req, res) {
  try {
    const role = req.user?.role || "unknown";
    const result = await aiService.getAiSuggestion({ prompt: req.body.prompt, role });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}