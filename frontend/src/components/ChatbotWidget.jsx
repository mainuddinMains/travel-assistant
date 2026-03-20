import { useState, useEffect, useRef } from "react";

const API_BASE_URL = import.meta.env.VITE_DASHBOARD_API_URL || "http://localhost:8000";

const quickActions = [
  "What's the fastest route?",
  "Avoid tolls",
  "Add a coffee stop",
  "Switch to transit",
];

export default function ChatbotWidget({ origin, destination, selectedMode, routes }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && !sessionId) {
      initChat();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

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
          content: "Failed to connect. Make sure backend is running on port 8000",
        },
      ]);
    }
  };

  const sendMessage = async (text) => {
    const message = text || input.trim();
    if (!message || isLoading || !sessionId) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setIsLoading(true);

    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "⏳ Thinking...", isLoading: true },
    ]);

    try {
      const response = await fetch(
        `${API_BASE_URL}/chat/stream/${sessionId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message }),
        }
      );

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
          content: "Sorry, something went wrong. Is the backend running?",
          isLoading: false,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const getContextInfo = () => {
    let context = "";
    if (origin?.label) context += `From: ${origin.label}. `;
    if (destination?.label) context += `To: ${destination.label}. `;
    if (selectedMode) context += `Mode: ${selectedMode}. `;
    if (routes?.[selectedMode]) {
      const route = routes[selectedMode];
      context += `ETA: ${route.duration?.text || "calculating"}. `;
    }
    return context;
  };

  return (
    <div className="absolute top-4 right-4 z-20">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="w-12 h-12 bg-blue-600 rounded-full shadow-lg flex items-center justify-center text-white hover:bg-blue-700 transition-all"
        >
          <span className="text-xl">🤖</span>
        </button>
      ) : (
        <div className="w-80 h-96 bg-white rounded-xl shadow-xl flex flex-col overflow-hidden">
          <div className="bg-blue-600 px-4 py-3 flex items-center justify-between">
            <h3 className="text-white font-semibold">AI Assistant</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`${
                  msg.role === "user" ? "text-right" : "text-left"
                }`}
              >
                <span
                  className={`inline-block px-3 py-1.5 rounded-lg max-w-[85%] text-sm ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {msg.isLoading ? (
                    <span className="flex items-center gap-1">
                      <span className="animate-pulse">⏳</span>
                    </span>
                  ) : (
                    msg.content
                  )}
                </span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {messages.length <= 1 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1">
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(action)}
                  className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200"
                >
                  {action}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="border-t p-2 flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              disabled={isLoading}
              className="flex-1 border rounded-lg px-3 py-1.5 text-sm"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
