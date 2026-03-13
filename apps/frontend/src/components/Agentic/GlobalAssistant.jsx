import React, { useState } from "react";
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
    toggleVisibility,
    sendText,
    sendAction
  } = useAgentic();

  const [input, setInput] = useState("");

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
                <div>{msg.text}</div>
                {Array.isArray(msg.listings) && msg.listings.length > 0 && (
                  <div className="agentic-cards">
                    {msg.listings.map((l) => (
                      <div key={l.id} className="agentic-card">
                        <div className="agentic-card-main">
                          <div className="agentic-card-title">
                            {l.index}. {l.title}
                          </div>
                          <div className="agentic-card-meta">
                            {l.is_free ? "Free" : `₹${l.price ?? 0}`} {l.location ? `• ${l.location}` : ""} {l.condition ? `• ${l.condition}` : ""}
                          </div>
                        </div>
                        <button
                          className="agentic-card-btn"
                          onClick={() => sendAction({ type: "add_to_cart", material_id: l.id, quantity: 1 })}
                        >
                          Add to cart
                        </button>
                      </div>
                    ))}
                    <button className="agentic-secondary-btn" onClick={() => sendAction({ type: "show_summary" })}>
                      Show checkout summary
                    </button>
                  </div>
                )}
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
            <form
              className="agentic-text-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (isThinking) return;
                const value = input;
                setInput("");
                sendText(value);
              }}
            >
              <input
                className="agentic-text-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message…"
                disabled={isListening}
              />
              <button className="agentic-send-btn" type="submit" disabled={isListening || isThinking || !input.trim()}>
                Send
              </button>
            </form>
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
