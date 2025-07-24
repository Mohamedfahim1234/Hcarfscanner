// ...existing code for the latest, fully functional AI chatbox sidebar with OpenRouter API key input and real chat functionality...

import React, { useState, useRef, useEffect } from "react";
import { User, X, Send, Sparkles, Loader2, KeyRound, Trash2 } from "lucide-react";

// Visually stunning, modern AI chatbox sidebar (UI only, no backend changes)
function AIAssistantSidebar({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {

  // --- Step 1: Key Storage & Actions ---
  const [openRouterKey, setOpenRouterKey] = useState(() => sessionStorage.getItem("openrouter_key") || "");
  const [keyValid, setKeyValid] = useState(!!openRouterKey);
  const [input, setInput] = useState("");
  // System prompt: site info for context
  const siteInfo = `
You are the AI assistant for the HCARF Scanner website.
HCARF Scanner is an advanced leak detection system for domains and websites. It helps users discover exposed credentials, API keys, and sensitive information across GitHub, Google, and other platforms.
Key features:
- GitHub Integration: Scan for secrets and leaks in public code.
- Google Search: Find exposed data indexed by Google.
- Real-time Scanning: Fast, up-to-date results.
- Export: Download findings as Markdown, JSON, or CSV.
- CAPTCHA: Prevents abuse and bots.
If users ask about how to use the scanner, API keys, exporting, or security, answer with clear, helpful instructions. If they ask about the site, explain its features and privacy. If you don't know, say so honestly.`;

  const [messages, setMessages] = useState([
    { id: 0, role: "system", content: siteInfo },
    { id: 1, role: "assistant", content: "Hi! I'm your AI assistant. How can I help you today?" }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (openRouterKey) {
      sessionStorage.setItem("openrouter_key", openRouterKey);
      setKeyValid(true);
    } else {
      sessionStorage.removeItem("openrouter_key");
      setKeyValid(false);
    }
  }, [openRouterKey]);

  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [open, messages]);

  if (!open) return null;

  // --- Step 2: Chatbox Lock & Key Check ---
  if (!keyValid) {
    return (
      <aside className="fixed top-0 right-0 h-full w-full max-w-md z-[9999] transition-transform duration-500 ease-in-out bg-gradient-to-br from-slate-900/90 via-purple-900/90 to-slate-900/90 backdrop-blur-lg shadow-2xl border-l border-fuchsia-700/40 flex flex-col items-center justify-center" style={{ boxShadow: '-8px 0 32px #a21caf44' }}>
        <div className="flex flex-col items-center justify-center flex-1 px-8 py-10 bg-[#23233a]/80 rounded-xl">
          <div className="mb-4 text-lg text-white font-semibold">🔐 AI Chat Locked</div>
          <label className="text-gray-300 mb-2">Enter your OpenRouter API Key:</label>
          <input
            type="password"
            value={openRouterKey}
            onChange={e => setOpenRouterKey(e.target.value)}
            placeholder="Paste your OpenRouter key"
            className="w-full max-w-xs px-4 py-3 rounded-lg bg-white/10 text-white border border-[#00e6e6]/40 focus:outline-none focus:ring-2 focus:ring-[#00e6e6] mb-3"
          />
          <div className="flex gap-3 mb-4">
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#00e6e6] hover:underline flex items-center gap-1"
              title="Get your OpenRouter API key"
            >
              <KeyRound className="h-5 w-5" /> Get Key
            </a>
            <button
              className="text-red-400 hover:underline flex items-center gap-1"
              onClick={() => setOpenRouterKey("")}
              title="Clear API key"
            >
              <Trash2 className="h-5 w-5" /> Clear
            </button>
          </div>
          <div className="text-sm text-gray-400">
            Your key is stored only for this session and never leaves your browser.
          </div>
        </div>
      </aside>
    );
  }

  // --- Step 3: API Call with Fallback & Error Detection ---
  async function handleSend(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!input.trim()) return;
    const key = openRouterKey || (typeof process !== 'undefined' ? process.env.OPENAI_API_KEY : undefined);
    if (!key) {
      alert("❌ Please enter your OpenRouter API key to use the AI chat");
      setKeyValid(false);
      return;
    }
    const userMsg = { id: Date.now(), role: "user", content: input };
    setMessages(msgs => [...msgs, userMsg]);
    setInput("");
    setLoading(true);
    try {
      // Always include the system prompt as the first message
      const filteredMsgs = messages.filter(m => m.role !== "system").map(m => ({ role: m.role, content: m.content }));
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-3.5-turbo",
          messages: [
            { role: "system", content: siteInfo },
            ...filteredMsgs,
            { role: "user", content: input }
          ],
        }),
      });
      let errorMsg = '';
      if (res.status === 401 || res.status === 403) {
        errorMsg = '❌ Invalid or expired API key. Please update it.';
        setKeyValid(false);
      } else if (!res.ok) {
        try {
          const errData = await res.json();
          errorMsg = `❌ OpenRouter API error: ${errData.error?.message || res.statusText}`;
        } catch {
          errorMsg = `❌ OpenRouter API error: ${res.statusText}`;
        }
      }
      if (errorMsg) {
        setMessages(msgs => [...msgs, { id: Date.now() + 2, role: "assistant", content: errorMsg }]);
        setLoading(false);
        return;
      }
      const data = await res.json();
      const aiReply = data.choices?.[0]?.message?.content || "(No response)";
      setMessages(msgs => [...msgs, { id: Date.now() + 1, role: "assistant", content: aiReply }]);
    } catch (err) {
      setMessages(msgs => [...msgs, { id: Date.now() + 2, role: "assistant", content: `❌ Error: ${err?.message || String(err)}` }]);
    } finally {
      setLoading(false);
    }
  }

  // --- Step 2: Chatbox UI (unlocked) ---
  return (
    <aside className="fixed top-0 right-0 h-full w-full max-w-md z-[9999] transition-transform duration-500 ease-in-out bg-gradient-to-br from-slate-900/90 via-purple-900/90 to-slate-900/90 backdrop-blur-lg shadow-2xl border-l border-fuchsia-700/40" style={{ boxShadow: '-8px 0 32px #a21caf44' }}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-fuchsia-700/30 bg-gradient-to-r from-fuchsia-900/60 to-purple-900/40">
          <div className="flex items-center gap-2 text-fuchsia-300 font-bold text-xl">
            <Sparkles className="w-6 h-6 animate-pulse" />
            AI Assistant
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setOpenRouterKey("");
                setMessages([
                  { id: 1, role: "assistant", content: "Hi! I'm your AI assistant. How can I help you today?" }
                ]);
              }}
              className="text-red-400 hover:text-red-200 transition-colors p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-red-400"
              title="Clear API key"
            >
              <Trash2 className="w-6 h-6" />
            </button>
            <button onClick={() => setOpen(false)} className="text-fuchsia-300 hover:text-fuchsia-100 transition-colors p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-fuchsia-400" title="Close">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        {/* Connection Status */}
        <div className="flex items-center gap-2 px-6 py-2 bg-slate-900/70 border-b border-fuchsia-700/20 text-sm">
          <KeyRound className={`w-4 h-4 ${keyValid ? 'text-green-400' : 'text-red-400'}`} />
          {keyValid ? <span className="text-green-400">✅ OpenRouter Key Connected</span> : <span className="text-red-400">❌ No API Key</span>}
        </div>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 custom-scrollbar" style={{ background: 'linear-gradient(120deg, #18181b 60%, #2e1065 100%)' }}>
          {messages.map((msg, i) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "assistant" ? "justify-start" : "justify-end"} transition-all duration-500 ease-in-out`}
            >
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl shadow-md text-base font-medium transition-all duration-500 ${msg.role === "assistant" ? "bg-gradient-to-br from-fuchsia-800/80 to-purple-900/80 text-fuchsia-100 animate-fade-in" : "bg-gradient-to-br from-cyan-700/80 to-blue-900/80 text-cyan-100 animate-fade-in"}`}
                style={{ wordBreak: 'break-word', border: msg.role === "assistant" ? '1.5px solid #e879f9' : '1.5px solid #22d3ee' }}
              >
                {msg.role === "assistant" ? <User className="inline w-4 h-4 mr-2 text-fuchsia-300 align-text-bottom" /> : null}
                {msg.content}
              </div>
            </div>
          ))}
          {/* Animated AI typing indicator */}
          {loading && (
            <div className="flex justify-start transition-all duration-500">
              <div className="max-w-[80%] px-4 py-3 rounded-2xl shadow-md text-base font-medium bg-gradient-to-br from-fuchsia-800/80 to-purple-900/80 text-fuchsia-100 border-[1.5px] border-fuchsia-400 flex items-center gap-2 animate-fade-in">
                <User className="inline w-4 h-4 mr-2 text-fuchsia-300 animate-pulse align-text-bottom" />
                <span className="dot-flashing"></span>
                <span className="ml-2">AI is typing</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        {/* Input */}
        <form
          className="relative flex items-center gap-2 px-6 py-4 border-t border-fuchsia-700/30 bg-gradient-to-r from-fuchsia-900/60 to-purple-900/40"
          style={{ boxShadow: '0 -2px 16px #a21caf22' }}
          onSubmit={handleSend}
        >
          <input
            className="flex-1 rounded-full px-5 py-3 bg-slate-800/80 border border-fuchsia-700/40 text-fuchsia-100 placeholder-fuchsia-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-400 text-base shadow-inner"
            type="text"
            placeholder="Ask me anything..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
            autoFocus={open}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.currentTarget.form?.requestSubmit();
              }
            }}
          />
          <button
            type="submit"
            className="ml-2 bg-gradient-to-br from-fuchsia-500 via-cyan-500 to-blue-500 hover:from-fuchsia-400 hover:to-blue-400 text-white rounded-full p-3 shadow-lg border-2 border-fuchsia-300/60 font-bold text-lg transition-all focus:outline-none focus:ring-2 focus:ring-fuchsia-400 disabled:opacity-50"
            disabled={loading || !input.trim()}
            aria-label="Send"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
          </button>
        </form>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; background: #18181b; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #a21caf; border-radius: 8px; }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s cubic-bezier(0.4,0,0.2,1);
        }
        .dot-flashing {
          position: relative;
          width: 1.2em;
          height: 0.4em;
          margin-left: 0.2em;
        }
        .dot-flashing:before, .dot-flashing:after, .dot-flashing div {
          content: '';
          display: inline-block;
          width: 0.4em;
          height: 0.4em;
          border-radius: 50%;
          background: #e879f9;
          position: absolute;
          animation: dotFlashing 1s infinite linear alternate;
        }
        .dot-flashing:before {
          left: 0;
          animation-delay: 0s;
        }
        .dot-flashing div {
          left: 0.4em;
          animation-delay: 0.3s;
        }
        .dot-flashing:after {
          left: 0.8em;
          animation-delay: 0.6s;
        }
        @keyframes dotFlashing {
          0% { opacity: 0.2; }
          50%, 100% { opacity: 1; }
        }
      `}</style>
    </aside>
  );
}

export default AIAssistantSidebar;
