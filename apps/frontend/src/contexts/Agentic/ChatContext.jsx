import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { socket, connectSocket, disconnectSocket } from "../../lib/agentic/socket";
import { createSpeechRecognition } from "../../lib/agentic/speechToText";
import { speakText } from "../../lib/agentic/speech";
import { useNavigate } from "react-router-dom";

const AgenticContext = createContext();

export const AgenticProvider = ({ children, user }) => {
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  
  const userId = user?.id || user?.sub;
  
  const navigate = useNavigate();
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);

  const addMessage = useCallback((text, sender) => {
    setMessages((prev) => [...prev, { text, sender, timestamp: new Date() }]);
  }, []);

  const handleResponse = useCallback((response) => {
    setIsThinking(false);
    const text = response.text;
    
    // Improved Regex to find "open {path}" anywhere in the text
    const navMatch = text.match(/open\s+(\/\S+)/i);
    
    if (navMatch) {
      const path = navMatch[1];
      addMessage(text, "assistant");
      speakText(`Opening ${path}`);
      
      // Delay navigation slightly so user can read the message
      setTimeout(() => {
        navigate(path);
      }, 500);
    } else {
      addMessage(text, "assistant");
      speakText(text);
    }
  }, [addMessage, navigate]);

  useEffect(() => {
    connectSocket();
    socket.on("response", handleResponse);

    return () => {
      socket.off("response", handleResponse);
      disconnectSocket();
    };
  }, [handleResponse]);

  const startListening = () => {
    if (recognitionRef.current) return;

    recognitionRef.current = createSpeechRecognition({
      onStart: () => setIsListening(true),
      onEnd: () => {
        setIsListening(false);
        recognitionRef.current = null;
      },
      onResult: ({ finalTranscript, interimTranscript }) => {
        setTranscript(finalTranscript || interimTranscript);
        
        // Reset silence timer
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        
        if (finalTranscript) {
          silenceTimerRef.current = setTimeout(() => {
            stopListeningAndSend(finalTranscript);
          }, 2500); // 2.5 seconds of silence
        }
      },
      onError: (err) => {
        console.error("STT Error:", err);
        setIsListening(false);
        recognitionRef.current = null;
      }
    });

    if (recognitionRef.current) {
      recognitionRef.current.start();
    }
  };

  const stopListeningAndSend = (finalText) => {
    if (recognitionRef.current) {
       recognitionRef.current.stop();
    }
    
    const textToSend = finalText || transcript;
    if (textToSend.trim()) {
      addMessage(textToSend, "user");
      setIsThinking(true);
      socket.emit("prompt", { text: textToSend, userId, history: messages.slice(-5) });
      setTranscript("");
    }
  };

  const toggleVisibility = () => setIsVisible(!isVisible);

  return (
    <AgenticContext.Provider value={{
      messages,
      isListening,
      isThinking,
      transcript,
      isVisible,
      startListening,
      stopListeningAndSend,
      toggleVisibility,
      addMessage
    }}>
      {children}
    </AgenticContext.Provider>
  );
};

export const useAgentic = () => useContext(AgenticContext);
