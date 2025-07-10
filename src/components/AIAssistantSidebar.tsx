import React, { useState, useRef, useEffect } from "react";
import { Bot, User, X, KeyRound, Send, Sparkles, ShieldCheck, Loader2, Trash2 } from "lucide-react";
import clsx from "clsx";

const API_KEY_STORAGE = "openrouter_api_key";
function getStoredKey() {
  return localStorage.getItem(API_KEY_STORAGE) || "";
}
function setStoredKey(key: string) {
  localStorage.setItem(API_KEY_STORAGE, key);
}
function discardStoredKey() {
  localStorage.removeItem(API_KEY_STORAGE);
}

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

export default function AIAssistantSidebar() {
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState(getStoredKey());
  const [keyStatus, setKeyStatus] = useState(!!getStoredKey());
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "👋 Hi! I’m your Security AI Assistant. Paste scan results or ask a question to get started.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, open]);

  function handleKeyChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setApiKey(val);
    if (val) {
      setStoredKey(val);
      setKeyStatus(true);
    } else {
      discardStoredKey();
      setKeyStatus(false);
    }
  }
  function handleDiscardKey() {
    setApiKey("");
    discardStoredKey();
    setKeyStatus(false);
  }

  async function handleSend(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!input.trim() || !apiKey) return;
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((msgs) => [...msgs, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey
        },
        body: JSON.stringify({
          messages: [
            ...messages,
            userMsg
          ]
        })
      });
      const data = await res.json();
      setMessages((msgs) => [
        ...msgs,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.reply || "[AI] No response from backend.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } catch (err) {
      setMessages((msgs) => [
        ...msgs,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "[AI] Error: Unable to reach backend.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const sidebarClasses = clsx(
    "fixed top-0 right-0 z-50 h-full w-full sm:w-[400px] max-w-full bg-gradient-to-br from-slate-900/95 via-slate-950/95 to-cyan-950/90 shadow-2xl border-l border-cyan-800/30 flex flex-col transition-transform duration-300",
    open ? "translate-x-0" : "translate-x-full"
  );

  const floatingBtnClasses = clsx(
    "fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white shadow-xl font-semibold text-base transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-400",
    open && "opacity-0 pointer-events-none"
  );

  return (
    <>
      {/* Floating Open Assistant Button */}
      <button
        className={floatingBtnClasses}
        aria-label="Open AI Assistant"
        onClick={() => setOpen(true)}
        title={!apiKey ? "Enter your API key to use the assistant" : undefined}
      >
        <Sparkles className="w-6 h-6 animate-pulse" />
        <span className="hidden sm:inline">Open Assistant</span>
      </button>

      {/* Sidebar */}
      <aside className={sidebarClasses} aria-label="AI Assistant Sidebar" tabIndex={-1}>
        {/* Header */}
        <header className={clsx("flex items-center justify-between px-4 py-3 border-b border-cyan-800/30", "backdrop-blur-md bg-slate-900/80")}> 
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-cyan-400" />
            <span className="font-bold text-lg tracking-tight text-cyan-100 drop-shadow">Security AI Assistant</span>
            <span
              className="ml-2 text-xs text-green-400 flex items-center gap-1"
              title="Scan results loaded"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              Scan Ready
            </span>
          </div>
          <button
            className="p-2 rounded hover:bg-slate-800/70 focus:outline-none"
            aria-label="Close Assistant"
            onClick={() => setOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Chat Messages */}
        <section
          ref={chatRef}
          className={clsx("flex-1 overflow-y-auto px-4 py-4 space-y-4", "backdrop-blur-md bg-slate-900/80")}
          aria-live="polite"
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={clsx(
                "flex items-end gap-2",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === "assistant" && (
                <div className="rounded-full bg-cyan-700 w-8 h-8 flex items-center justify-center text-white font-bold shadow">
                  <Bot className="w-5 h-5" />
                </div>
              )}
              <div
                className={clsx(
                  "rounded-xl px-4 py-2 max-w-[80%] text-sm shadow",
                  msg.role === "user"
                    ? "bg-cyan-800/80 text-white"
                    : "bg-slate-800/90 text-cyan-100 border border-cyan-900/40"
                )}
              >
                <span className="whitespace-pre-line">{msg.content}</span>
                <span className="block text-xs text-cyan-400/70 mt-1 text-right">{msg.timestamp}</span>
              </div>
              {msg.role === "user" && (
                <div className="rounded-full bg-cyan-600 w-8 h-8 flex items-center justify-center text-white font-bold shadow">
                  <User className="w-5 h-5" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-cyan-700 w-8 h-8 flex items-center justify-center text-white font-bold shadow">
                <Bot className="w-5 h-5 animate-bounce" />
              </div>
              <div className="bg-slate-800/90 rounded-xl px-4 py-2 text-cyan-100 text-sm shadow animate-pulse">
                <Loader2 className="inline w-4 h-4 mr-2 animate-spin" />
                AI is thinking...
              </div>
            </div>
          )}
        </section>

        {/* Chat Input */}
        <form
          className={clsx("p-4 border-t border-cyan-800/30 flex flex-col gap-2", "backdrop-blur-md bg-slate-900/80")}
          onSubmit={handleSend}
        >
          <div className="flex items-center gap-2">
            <textarea
              rows={1}
              required
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleInputKeyDown}
              className="flex-1 resize-none rounded-lg bg-slate-800 text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder:text-slate-400"
              placeholder={!apiKey ? "Enter your API key above to chat" : "Type your security question…"}
              aria-label="Type your message"
              disabled={loading || !apiKey}
            />
            <button
              type="submit"
              className="bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg px-4 py-2 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 disabled:opacity-50"
              disabled={loading || !input.trim() || !apiKey}
              aria-label="Send"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <KeyRound className="w-4 h-4 text-cyan-400" />
            <span>Shift+Enter for new line</span>
          </div>
          {!apiKey && (
            <div className="text-xs text-red-400 mt-2">Please enter your API key above to enable chat.</div>
          )}
        </form>

        {/* API Key Handler */}
        <div
          className={clsx(
            "absolute left-0 right-0 bottom-24 mx-4 bg-slate-800/90 rounded-lg shadow-lg p-4 flex flex-col gap-2 z-50 border border-cyan-900/40",
            "backdrop-blur-md"
          )}
        >
          <label htmlFor="apiKeyInput" className="text-xs font-semibold text-slate-300 flex items-center gap-1">
            <KeyRound className="w-4 h-4 text-cyan-400" />
            OpenRouter API Key
            {keyStatus && (
              <span className="ml-2 text-green-400 flex items-center gap-1" title="Key loaded">
                <ShieldCheck className="w-4 h-4" />
                Key Saved
              </span>
            )}
          </label>
          <div className="flex gap-2">
            <input
              id="apiKeyInput"
              type="password"
              autoComplete="off"
              className={clsx(
                "flex-1 rounded bg-slate-700 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500",
                keyStatus && "ring-2 ring-green-400"
              )}
              placeholder="Paste your OpenRouter API key"
              value={apiKey}
              onChange={handleKeyChange}
            />
            <button
              type="button"
              onClick={handleDiscardKey}
              className="bg-red-600 hover:bg-red-500 text-white rounded px-3 py-2 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 flex items-center gap-1"
              aria-label="Discard Key"
              disabled={!apiKey}
            >
              <Trash2 className="w-4 h-4" />
              Discard Key
            </button>
          </div>
        </div>
      </aside>

    </>
  );
}
