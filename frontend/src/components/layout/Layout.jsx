import { useState } from "react";
import Header from "./Header.jsx";
import Sidebar from "./Sidebar.jsx";
import Chatbot from "../chatbot/Chatbot.jsx";

export default function Layout({ children }) {
  const [showChatbot, setShowChatbot] = useState(false);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-10 h-72 w-72 rounded-full bg-indigo-500/20 blur-[120px]" />
        <div className="absolute top-40 right-10 h-72 w-72 rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute bottom-10 left-1/3 h-80 w-80 rounded-full bg-purple-500/10 blur-[140px]" />
      </div>
      <Header />
      <div className="relative z-10 flex flex-1">
        <Sidebar />
        <main className="flex-1 px-6 py-6 md:px-10 md:py-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
      
      {/* Chatbot Floating Button */}
      {!showChatbot && (
        <button
          onClick={() => setShowChatbot(true)}
          className="fixed bottom-6 right-6 z-[9999] h-14 w-14 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-lg transition hover:scale-110 hover:shadow-xl flex items-center justify-center group"
          aria-label="Open chatbot"
        >
          <svg
            className="h-6 w-6 text-white transition-transform group-hover:scale-110"
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
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-400 border-2 border-slate-950 animate-pulse" />
        </button>
      )}

      {/* Chatbot Component */}
      <Chatbot isOpen={showChatbot} onClose={() => setShowChatbot(false)} />
    </div>
  );
}
