import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { queryChatbot } from "../../services/api.js";

const CHATBOT_SESSION_KEY = "temporal_chatbot_session_id";

function getOrCreateSessionId() {
  try {
    const existing = localStorage.getItem(CHATBOT_SESSION_KEY);
    if (existing) return existing;
    const generated = (typeof crypto !== "undefined" && crypto.randomUUID)
      ? crypto.randomUUID()
      : `chat-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    localStorage.setItem(CHATBOT_SESSION_KEY, generated);
    return generated;
  } catch {
    return `chat-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  }
}

export default function Chatbot({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I can help you with questions about lifecycles, documents, risks, and more. What would you like to know?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => getOrCreateSessionId());
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await queryChatbot(input.trim(), sessionId);
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.answer || response.message || "I received your question but couldn't generate a response.",
        sources: response.sources || [],
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chatbot error:", error);
      let errorMessage = "Sorry, I encountered an error. Please try again.";
      
      if (error.response) {
        // Server responded with error status
        if (error.response.status === 404) {
          errorMessage = "The chatbot service is not available. Please check if the backend server is running.";
        } else if (error.response.status === 401) {
          errorMessage = "Authentication failed. Please check your API key.";
        } else {
          errorMessage = error.response.data?.detail || error.response.data?.message || `Server error: ${error.response.status}`;
        }
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = "Unable to connect to the server. Please check if the backend is running at http://localhost:8000";
      } else {
        // Error setting up the request
        errorMessage = error.message || "An unexpected error occurred.";
      }
      
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: errorMessage,
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-end justify-end p-4 pointer-events-none">
      <div className="w-full max-w-md h-[600px] flex flex-col rounded-2xl border border-slate-800/80 bg-slate-900/95 backdrop-blur-xl shadow-2xl pointer-events-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/70 px-5 py-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <svg
                className="h-5 w-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Data Assistant</h3>
              <p className="text-xs text-slate-400">Ask me anything about your data</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-300 transition hover:border-slate-500 hover:bg-slate-800/40"
            type="button"
            aria-label="Close chatbot"
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                  message.role === "user"
                    ? "bg-indigo-500/20 border border-indigo-500/30 text-slate-100"
                    : "bg-slate-800/60 border border-slate-700/50 text-slate-200"
                }`}
              >
                <div className="text-sm prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown
                    components={{
                      h3: ({node, ...props}) => <h3 className="text-base font-semibold text-slate-100 mt-3 mb-2" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-lg font-semibold text-slate-100 mt-4 mb-2" {...props} />,
                      p: ({node, ...props}) => <p className="text-slate-200 mb-2" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2 space-y-1" {...props} />,
                      li: ({node, ...props}) => <li className="text-slate-200" {...props} />,
                      code: ({node, inline, ...props}) => 
                        inline ? (
                          <code className="bg-slate-900/70 px-1.5 py-0.5 rounded text-slate-300 text-xs" {...props} />
                        ) : (
                          <code className="block bg-slate-900/70 p-2 rounded text-slate-300 text-xs overflow-x-auto" {...props} />
                        ),
                      strong: ({node, ...props}) => <strong className="font-semibold text-slate-100" {...props} />,
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl px-4 py-2.5">
                <div className="flex gap-1">
                  <div className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="border-t border-slate-800/70 p-4 bg-slate-950/40">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 rounded-lg border border-slate-700/70 bg-slate-900/70 px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-2.5 text-sm font-medium text-white transition hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Try: "How many active lifecycles are there?" or "What is the status of lifecycle_001?"
          </p>
        </form>
      </div>
    </div>
  );
}
