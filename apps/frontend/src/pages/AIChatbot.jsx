import React, { useState, useEffect, useRef } from 'react';
import { Send, PlusCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link } from 'react-router-dom';

const AIChatbot = () => {
  const STORAGE_KEY = 'scraphappens_chat_history';
  const WELCOME_MSG = { role: 'ai', text: "Hello! I'm your Circular Loop Assistant. How can I help you with sustainable textile reuse today?" };

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [WELCOME_MSG];
    } catch {
      return [WELCOME_MSG];
    }
  });
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // storage quota exceeded — silently ignore
    }
  }, [messages]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo(0, scrollRef.current.scrollHeight);
    }
  }, [messages]);

  const handleNewChat = () => {
    localStorage.removeItem(STORAGE_KEY);
    setMessages([WELCOME_MSG]);
    setInput('');
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      // Read raw text first (mirrors original working Chatbox.jsx pattern)
      const raw = await response.text();
      const data = (() => {
        try {
          return JSON.parse(raw);
        } catch {
          return null;
        }
      })();

      if (!response.ok) {
        const errorMessage =
          data?.error ||
          raw ||
          "Sorry, I couldn't get a valid response from the server.";
        setMessages(prev => [...prev, { role: 'ai', text: errorMessage }]);
        return;
      }

      const replyText =
        data?.reply ||
        raw ||
        "I didn't receive a proper reply from the AI, but I'm here!";

      setMessages(prev => [...prev, { role: 'ai', text: replyText }]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: 'ai', text: "Sorry, I'm having trouble connecting to my brain!" }
      ]);
      console.error("Chat Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-stack">
      <section className="ai-chat-shell">
        <header className="ai-chat-header">
          <div>
            <span className="eyebrow">Smart Assistant</span>
            <h3>Circular Loop Chatbot</h3>
          </div>
          <div className="ai-chat-header-actions">
            <Link to="/" className="section-tag ai-chat-link">View Marketplace</Link>
            <button type="button" onClick={handleNewChat} title="Start a new chat" className="ai-new-chat-btn">
              <PlusCircle size={15} />
              New Chat
            </button>
          </div>
        </header>

        <div className="chat-thread" ref={scrollRef}>
          {messages.map((msg, i) => (
            <div key={i} className={`chat-row ${msg.role === 'user' ? 'chat-row-user' : 'chat-row-assistant'}`}>
              <div className={`chat-bubble ${msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'}`}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ node, ...props }) => <p style={{ margin: 0, marginBottom: '8px', whiteSpace: 'pre-wrap' }} {...props} />,
                    ul: ({ node, ...props }) => <ul style={{ margin: '0 0 8px 20px', padding: 0 }} {...props} />,
                    ol: ({ node, ...props }) => <ol style={{ margin: '0 0 8px 20px', padding: 0 }} {...props} />,
                    li: ({ node, ...props }) => <li style={{ marginBottom: '4px' }} {...props} />,
                    strong: ({ node, ...props }) => <strong style={{ fontWeight: 800 }} {...props} />,
                  }}
                >
                  {msg.text}
                </ReactMarkdown>
              </div>
            </div>
          ))}
          {loading && (
            <div className="chat-row chat-row-assistant">
              <div className="chat-bubble chat-bubble-assistant mini-note">Assistant is thinking...</div>
            </div>
          )}
        </div>

        <div className="ai-composer-wrap">
          <div className="chat-input-row">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about materials, reuse tips, or marketplace features..."
            />
            <button
              type="button"
              className="submit-button"
              onClick={handleSend}
              disabled={loading}
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AIChatbot;
