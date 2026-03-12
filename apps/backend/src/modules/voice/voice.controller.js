import twilio from "twilio";
import * as aiService from "../ai/ai.service.js";

const { VoiceResponse } = twilio.twiml;

export const handleIncomingCall = (req, res) => {
  const twiml = new VoiceResponse();

  // Create a "Gather" block to listen to user speech
  const gather = twiml.gather({
    input: "speech",
    action: "/api/voice/respond", // Where Twilio sends the text after user speaks
    method: "POST",
    speechTimeout: "auto",
  });

  gather.say("Hello! Welcome to Circular Loop. How can I help you today?");

  // If user doesn't say anything
  twiml.say("I didn't hear anything. Feel free to call back later. Goodbye!");

  res.type("text/xml");
  res.send(twiml.toString());
};

export const handleVoiceResponse = async (req, res) => {
  const twiml = new VoiceResponse();
  const userSpeech = req.body.SpeechResult; // This is the text Twilio transcribed

  if (userSpeech) {
    try {
      // Reuse your existing Gemini logic
      const aiReply = await aiService.generateChatResponse(userSpeech);

      // Say the answer and then listen again
      const gather = twiml.gather({
        input: "speech",
        action: "/api/voice/respond",
        method: "POST",
        speechTimeout: "auto",
      });

      gather.say(aiReply);
    } catch (error) {
      twiml.say("I'm sorry, I'm having trouble thinking right now. Please try again.");
    }
  }

  res.type("text/xml");
  res.send(twiml.toString());
};