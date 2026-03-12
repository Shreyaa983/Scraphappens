import React from "react";
import { useAgentic } from "../../contexts/Agentic/ChatContext";
import { Mic, X, MessageSquare, Loader2, Square } from "lucide-react";
import "./Agentic.css";

const GlobalAssistant = () => {
  const { 
    messages, 
    isListening, 
    isThinking, 
    transcript, 
    isVisible, 
    startListening, 
    stopAll,
    toggleVisibility 
  } = useAgentic();

  return (
    <div className={`agentic-container ${isVisible ? "expanded" : ""}`}>
      {isVisible && (
        <div className="agentic-chat-window">
          <div className="agentic-header">
            <h3>Scraphappens Assistant</h3>
            <button onClick={toggleVisibility} className="close-btn"><X size={20} /></button>
          </div>
          
          <div className="agentic-messages">
            {messages.length === 0 && (
              <div className="empty-state">
                How can I help you today?
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`msg ${msg.sender}`}>
                {msg.text}
              </div>
            ))}
            {isThinking && (
              <div className="msg assistant thinking">
                <Loader2 className="animate-spin" size={16} />
              </div>
            )}
            {isListening && (
                <div className="interim-transcript">
                    {transcript || "Listening..."}
                </div>
            )}
          </div>
          
          <div className="agentic-footer">
            <button 
              className={`mic-btn ${isListening ? "listening" : ""} ${isThinking ? "thinking" : ""}`}
              onClick={isListening || isThinking ? stopAll : startListening}
            >
              {isListening || isThinking ? <Square size={24} fill="currentColor" /> : <Mic size={24} />}
            </button>
          </div>
        </div>
      )}

      {!isVisible && (
        <button className="agentic-fab" onClick={toggleVisibility}>
            <div className={`fab-pulse ${isListening ? "active" : ""}`}></div>
            <MessageSquare size={28} />
        </button>
      )}
    </div>
  );
};

export default GlobalAssistant;
