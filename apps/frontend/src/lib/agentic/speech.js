export const speakText = (text, onEnd) => {
  if (!window.speechSynthesis) {
    console.error("Speech Synthesis not supported in this browser.");
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  
  // Get language preference
  const lang = localStorage.getItem('app_language_preference') || 'en';
  utterance.lang = lang;

  if (onEnd) {
      utterance.onend = onEnd;
  }

  // Find a voice that matches the language
  const voices = window.speechSynthesis.getVoices();
  let selectedVoice = voices.find(v => v.lang.startsWith(lang));
  
  // Specific fallbacks for better experience
  if (lang === 'hi') {
    selectedVoice = voices.find(v => v.name.includes("Hindi") || v.lang === "hi-IN") || selectedVoice;
  } else if (lang === 'en') {
    selectedVoice = voices.find(v => v.name.includes("Google") || v.name.includes("Female")) || selectedVoice;
  }

  if (selectedVoice) utterance.voice = selectedVoice;

  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  window.speechSynthesis.speak(utterance);
};

export const stopSpeaking = () => {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};
