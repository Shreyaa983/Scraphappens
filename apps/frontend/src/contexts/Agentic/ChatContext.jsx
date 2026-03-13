import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { socket, connectSocket, disconnectSocket } from "../../lib/agentic/socket";
import { createSpeechRecognition } from "../../lib/agentic/speechToText";
import { speakText, stopSpeaking } from "../../lib/agentic/speech";
import { useNavigate } from "react-router-dom";

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
        } catch (e) {
            console.log("Recognition already active or error starting:", e.message);
            return;
        }
    }

    loopRef.current = true;

    recognitionRef.current = createSpeechRecognition({
      onStart: () => setIsListening(true),
      onEnd: () => {
        setIsListening(false);
        // If we're still in looping mode, restart recognition
        if (loopRef.current) {
            console.log("Restarting recognition loop...");
            setTimeout(() => {
                if (loopRef.current) {
                    try {
                        recognitionRef.current?.start();
                    } catch (e) {
                        console.log("Failed to restart recognition:", e.message);
                    }
                }
            }, 300);
        } else {
            recognitionRef.current = null;
        }
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
        if (err.error === 'not-allowed') {
            loopRef.current = false;
        }
        setIsListening(false);
      }
    });

    try {
        recognitionRef.current.start();
    } catch (e) {
        console.log("Recognition start error:", e.message);
    }
  }, [createSpeechRecognition]);

  const handleResponse = useCallback((response) => {
    setIsThinking(false);
    const text = response.text || "";

    // Improved Regex to find "open {path}" anywhere in the text
    const navMatch = text.match(/open\s+(\/\S+)/i);

    if (navMatch) {
      const path = navMatch[1];
      addStructuredMessage({ sender: "assistant", text, listings: response.listings, cart_summary: response.cart_summary });
      speakText(`Opening ${path}`, () => {
        if (loopRef.current) {
            startListening();
        }
      });

      // Delay navigation slightly so user can read the message
      setTimeout(() => {
        navigate(path);
      }, 500);
    } else {
      addStructuredMessage({ sender: "assistant", text, listings: response.listings, cart_summary: response.cart_summary });
      speakText(text, () => {
        if (loopRef.current) {
            startListening();
        }
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
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.log("Stop error in stopAll:", e.message);
      }
    }
    
    setIsListening(false);
    setIsThinking(false);
    setTranscript("");
    
    if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
    }
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
      if (!next) {
        stopAll();
      }
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
