export const speakText = (text) => {
  if (!window.speechSynthesis) {
    console.error("Speech Synthesis not supported in this browser.");
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  
  // Optional: customize voice
  const voices = window.speechSynthesis.getVoices();
  const selectedVoice = voices.find(v => v.name.includes("Google") || v.name.includes("Female")) || voices[0];
  if (selectedVoice) utterance.voice = selectedVoice;

  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  window.speechSynthesis.speak(utterance);
};
