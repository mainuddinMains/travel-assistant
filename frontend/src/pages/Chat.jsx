import { useState, useEffect, useRef } from "react";

const API_BASE_URL = import.meta.env.VITE_DASHBOARD_API_URL || "http://localhost:8000";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    initChat();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const initChat = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/chat/init`, {
        method: "POST",
      });
      const data = await res.json();
      setSessionId(data.session_id);
      setMessages([{ role: "assistant", content: data.welcome_message }]);
    } catch (error) {
      setMessages([
        {
          role: "assistant",
          content: "Failed to connect to server. Please make sure the backend is running.",
        },
      ]);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !sessionId) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    setMessages((prev) => [...prev, { role: "assistant", content: "⏳ Thinking...", isLoading: true }]);

    try {
      const response = await fetch(`${API_BASE_URL}/chat/stream/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "text_chunk") {
                fullContent = data.content;
                setMessages((prev) => {
                  const newMsgs = [...prev];
                  newMsgs[newMsgs.length - 1] = {
                    role: "assistant",
                    content: fullContent,
                    isLoading: true,
                  };
                  return newMsgs;
                });
              } else if (data.type === "text_complete") {
                fullContent = data.content;
                setMessages((prev) => {
                  const newMsgs = [...prev];
                  newMsgs[newMsgs.length - 1] = {
                    role: "assistant",
                    content: fullContent,
                    isLoading: false,
                  };
                  return newMsgs;
                });
              }
            } catch (err) {
              // Skip invalid JSON
            }
          }
        }
      }

      setMessages((prev) => {
        const newMsgs = [...prev];
        if (newMsgs[newMsgs.length - 1]?.isLoading) {
          newMsgs[newMsgs.length - 1].isLoading = false;
        }
        return newMsgs;
      });
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, something went wrong. Make sure the backend is running.",
          isLoading: false,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-4">AI Travel Assistant 🤖</h2>

      <div className="border rounded-lg h-96 overflow-y-auto p-4 bg-gray-50 mb-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`mb-3 ${
              msg.role === "user" ? "text-right" : "text-left"
            }`}
          >
            <span
              className={`inline-block px-4 py-2 rounded-lg max-w-[80%] ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              {msg.isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-pulse">⏳</span> Thinking...
                </span>
              ) : (
                <div className="whitespace-pre-wrap">{msg.content}</div>
              )}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your trip..."
          disabled={isLoading}
          className="flex-grow border rounded-lg px-4 py-2"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
