import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { socket, connectSocket, disconnectSocket } from "../../lib/agentic/socket";
import { createSpeechRecognition } from "../../lib/agentic/speechToText";
import { speakText, stopSpeaking } from "../../lib/agentic/speech";
import { useNavigate } from "react-router-dom";
import { addToCart } from "../../api";

const AgenticContext = createContext();

export const AgenticProvider = ({ children, user, token }) => {
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  const userId = user?.id || user?.sub;
  const authToken = token || (typeof localStorage !== "undefined" ? localStorage.getItem("token") : "") || "";
  const navigate = useNavigate();

  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const loopRef = useRef(false);

  const addMessage = useCallback((text, sender) => {
    setMessages((prev) => [...prev, { text, sender, timestamp: new Date() }]);
  }, []);

  const stopListeningAndSend = useCallback((finalText) => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) { }
    }

    const textToSend = finalText || transcript;
    if (textToSend.trim()) {
      addMessage(textToSend, "user");
      setIsThinking(true);
      socket.emit("prompt", { text: textToSend, userId });
      setTranscript("");
    }
  }, [transcript, userId, addMessage]);

  const addStructuredMessage = useCallback((msg) => {
    setMessages((prev) => [...prev, { ...msg, timestamp: new Date() }]);
  }, []);

  const resetMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        return;
      } catch (e) { }
    }

    loopRef.current = true;

    recognitionRef.current = createSpeechRecognition({
      onStart: () => setIsListening(true),
      onEnd: () => {
        setIsListening(false);
        if (loopRef.current) {
          setTimeout(() => {
            if (loopRef.current) {
              try { recognitionRef.current?.start(); } catch (e) { }
            }
          }, 300);
        }
      },
      onResult: ({ finalTranscript, interimTranscript }) => {
        // EXACT ORIGINAL LOGIC FOR TRANSCRIPT DISPLAY
        setTranscript(finalTranscript || interimTranscript);

        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

        if (finalTranscript) {
          silenceTimerRef.current = setTimeout(() => {
            stopListeningAndSend(finalTranscript);
          }, 2500); // REPLACED 1.5s with ORIGINAL 2.5s
        }
      },
      onError: (err) => {
        console.error("STT Error:", err);
        if (err.error === 'not-allowed') loopRef.current = false;
        setIsListening(false);
      }
    });

    try {
      recognitionRef.current.start();
    } catch (e) {
      setIsListening(false);
    }
  }, [createSpeechRecognition, stopListeningAndSend]);

  const handleResponse = useCallback(async (response) => {
    setIsThinking(false);
    const text = response.text || "";

    // --- AGENTIC ACTION PARSER (Added functionality) ---
    const actionMatch = text.match(/ACTION:(\w+):?([^:]+)?:?([^:]+)?/i);

    if (actionMatch) {
      const type = actionMatch[1].toUpperCase();
      const param1 = actionMatch[2];
      const param2 = actionMatch[3];

      const cleanText = text.split("ACTION:")[0].trim();
      addMessage(cleanText, "assistant");

      speakText(cleanText, () => {
        if (loopRef.current) startListening();
      });

      switch (type) {
        case "NAVIGATE":
          if (param1) navigate(param1);
          break;
        case "SEARCH":
          if (window.onAgentSearch) {
            window.onAgentSearch(param1);
          } else {
            navigate(`/?search=${encodeURIComponent(param1)}`);
          }
          break;
        case "ADD_TO_CART":
          if (param1) {
            const token = localStorage.getItem("token");
            if (!token) break;
            try {
              await addToCart({ material_id: param1, quantity: parseInt(param2) || 1 }, token);
              addMessage(`Added to your cart!`, "assistant");
            } catch (err) { }
          }
          break;
        case "GO_BACK":
          navigate(-1);
          break;
      }
      return;
    }

    // --- ORIGINAL NAVIGATION LOGIC ---
    const navMatch = text.match(/open\s+(\/\S+)/i);
    if (navMatch) {
      const path = navMatch[1];
      addStructuredMessage({ sender: "assistant", text, listings: response.listings, cart_summary: response.cart_summary });
      speakText(`Opening ${path}`, () => {
        if (loopRef.current) startListening();
      });
      setTimeout(() => navigate(path), 500);
    } else {
      addStructuredMessage({ sender: "assistant", text, listings: response.listings, cart_summary: response.cart_summary });
      speakText(text, () => {
        if (loopRef.current) startListening();
      });
    }
  }, [addStructuredMessage, navigate, startListening]);

  useEffect(() => {
    connectSocket(authToken);
    socket.on("response", handleResponse);
    return () => {
      socket.off("response", handleResponse);
      disconnectSocket();
    };
  }, [handleResponse, authToken]);

  const stopAll = useCallback(() => {
    loopRef.current = false;
    stopSpeaking();
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) { }
    }
    setIsListening(false);
    setIsThinking(false);
    setTranscript("");
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
  }, []);

  const stopListeningAndSend = (finalText) => {
    if (recognitionRef.current) {
      try {
          recognitionRef.current.stop();
      } catch (e) {
          console.log("Stop error:", e.message);
      }
    }

    const textToSend = finalText || transcript;
    if (textToSend.trim()) {
      addMessage(textToSend, "user");
      setIsThinking(true);
      socket.emit("prompt", { text: textToSend, userId });
      setTranscript("");
    }
  };

  const sendText = useCallback((textToSend) => {
    const clean = (textToSend || "").trim();
    if (!clean) return;
    addMessage(clean, "user");
    setIsThinking(true);
    socket.emit("prompt", { text: clean, userId });
  }, [addMessage, userId]);

  const sendAction = useCallback((action) => {
    setIsThinking(true);
    socket.emit("action", action);
  }, []);

  const toggleVisibility = () => {
    setIsVisible((prev) => {
      const next = !prev;
      if (!next) stopAll();
      return next;
    });
  };

  return (
    <AgenticContext.Provider value={{
      messages,
      isListening,
      isThinking,
      transcript,
      isVisible,
      startListening,
      stopListeningAndSend,
      stopAll,
      toggleVisibility,
      addMessage,
      sendText,
      sendAction,
      resetMessages
    }}>
      {children}
    </AgenticContext.Provider>
  );
};

export const useAgentic = () => useContext(AgenticContext);
