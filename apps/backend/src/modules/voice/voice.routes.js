import { Router } from "express";
import { handleIncomingCall, handleVoiceResponse } from "./voice.controller.js";

const router = Router();

router.post("/incoming", handleIncomingCall);
router.post("/respond", handleVoiceResponse);

export default router;