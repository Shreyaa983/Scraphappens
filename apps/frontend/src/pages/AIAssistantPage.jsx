import { useMemo, useState } from "react";

const starterMessages = [
  {
    id: 1,
    sender: "assistant",
    text: "Upload a waste photo or describe material. I can suggest category, pricing direction, or donation options."
  }
];

export default function AIAssistantPage() {
  const [messages, setMessages] = useState(starterMessages);
  const [input, setInput] = useState("");
  const [fileName, setFileName] = useState("");

  const suggestedReply = useMemo(() => {
    if (fileName) {
      return "This looks like high-quality Oak. You can list this under 'Construction' for ₹500 or donate it to NGO 'Build-Home'.";
    }

    if (!input.trim()) return "";
    return "Suggested route: classify this under reusable materials, add a trust inspection, and offer pickup scheduling.";
  }, [fileName, input]);

  function sendMessage() {
    if (!input.trim() && !fileName) return;

    const nextMessages = [
      ...messages,
      {
        id: Date.now(),
        sender: "user",
        text: fileName ? `Uploaded: ${fileName}` : input
      },
      {
        id: Date.now() + 1,
        sender: "assistant",
        text: suggestedReply || "Share more details and I’ll suggest a category and next step."
      }
    ];

    setMessages(nextMessages);
    setInput("");
    setFileName("");
  }

  return (
    <div className="page-stack">
      <section className="dashboard-card ai-layout">
        <div className="section-heading">
          <div>
            <span className="eyebrow">AI Assistant</span>
            <h3>Material intelligence workspace</h3>
          </div>
          <span className="section-tag">Chat</span>
        </div>

        <div className="chat-thread">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`chat-bubble ${message.sender === "assistant" ? "chat-bubble-assistant" : "chat-bubble-user"}`}
            >
              {message.text}
            </div>
          ))}
        </div>

        <div className="ai-input-stack">
          <label className="upload-box">
            Upload waste photo
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setFileName(event.target.files?.[0]?.name || "")}
            />
          </label>

          {fileName ? <p className="session-copy">Selected file: {fileName}</p> : null}

          <div className="chat-input-row">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Describe your waste material or ask for listing help..."
            />
            <button type="button" className="submit-button" onClick={sendMessage}>Send</button>
          </div>
        </div>
      </section>
    </div>
  );
}
