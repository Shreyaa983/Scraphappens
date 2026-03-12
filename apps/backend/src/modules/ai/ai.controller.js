import { getAiSuggestion } from "./ai.service.js";

export async function suggest(req, res) {
  try {
    const role = req.user?.role || "unknown";
    const result = await getAiSuggestion({ prompt: req.body.prompt, role });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}
