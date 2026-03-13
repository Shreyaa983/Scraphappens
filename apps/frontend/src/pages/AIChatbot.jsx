import React, { useState, useEffect, useRef } from "react";
import { Send, PlusCircle, Loader2, Mic, Square } from "lucide-react";
import { Link } from "react-router-dom";
import { useAgentic } from "../contexts/Agentic/ChatContext";
import "../components/Agentic/Agentic.css";
import { useTranslation } from '../hooks/useTranslation';

const AIChatbot = () => {
  const [input, setInput] = useState("");
  const {
    messages,
    isThinking,
    isListening,
    sendText,
    resetMessages,
    sendAction,
    startListening,
    stopAll,
  } = useAgentic();
  const { t } = useTranslation();
  const WELCOME_MSG = { sender: 'assistant', text: t("Hello! I'm your Circular Loop Assistant. How can I help you with sustainable textile reuse today?") };
  const scrollRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleNewChat = () => {
    resetMessages();
    setInput("");
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const value = input;
    setInput("");
    sendText(value);
  };

  return (
    <div className="page-stack">
      <section className="agentic-page-shell">
        <header className="ai-chat-header">
          <div>
            <span className="eyebrow">{t("Smart Assistant")}</span>
            <h3>{t("Circular Loop Chatbot")}</h3>
          </div>
          <div className="ai-chat-header-actions">
            <Link to="/" className="section-tag ai-chat-link">{t("View Marketplace")}</Link>
            <button type="button" onClick={handleNewChat} title={t("Start a new chat")} className="ai-new-chat-btn">
              <PlusCircle size={15} />
              {t("New Chat")}
            </button>
          </div>
        </header>

        <div className="agentic-page-chat">
          <div className="agentic-header">
            <h3>Scraphappens Assistant</h3>
          </div>

          <div className="agentic-messages" ref={scrollRef}>
            {messages.length === 0 && (
              <div className="msg assistant">
                <div>{WELCOME_MSG.text}</div>
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
                  </div>
                )}
              </div>
            ))}

            {isThinking && (
              <div className="msg assistant thinking">
                <Loader2 className="animate-spin" size={16} />
              </div>
            )}
          </div>

          <div className="agentic-footer agentic-footer-inline">
            <form
              className="agentic-text-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (isThinking) return;
                handleSend();
              }}
            >
              <input
                className="agentic-text-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about materials, reuse tips, or marketplace features..."
                disabled={isListening}
              />
              <button className="agentic-send-btn" type="submit" disabled={isThinking || !input.trim() || isListening}>
                <Send size={16} />
              </button>
            </form>
            <button
              className={`mic-btn ${isListening ? "listening" : ""} ${isThinking ? "thinking" : ""}`}
              type="button"
              onClick={isListening || isThinking ? stopAll : startListening}
            >
              {isListening || isThinking ? <Square size={22} fill="currentColor" /> : <Mic size={22} />}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AIChatbot;
