import { useState, useRef, useEffect } from "react";
import api from "../api";

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    { role: "ai", text: "Hi! I'm your HCM AI Assistant. Ask me about attendance, leaves, employee counts, or company stats." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);

    try {
      const res = await api.post("/ai/chat", { message: userMsg });
      setMessages((prev) => [...prev, { role: "ai", text: res.data.reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: err.response?.data?.message || "Sorry, I couldn't process that. Make sure GROQ_API_KEY is set in .env" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="page-title">AI Assistant</h1>
      <div className="card">
        <div className="chat-box">
          <div className="chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.role === "user" ? "user" : "ai"}`}>
                <div className="bubble">{m.text}</div>
              </div>
            ))}
            {loading && (
              <div className="chat-msg ai">
                <div className="bubble">Thinking...</div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <form className="chat-input" onSubmit={send}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about HR stats, leaves, attendance..."
              disabled={loading}
            />
            <button className="btn btn-primary" type="submit" disabled={loading}>Send</button>
          </form>
        </div>
      </div>
    </div>
  );
}
