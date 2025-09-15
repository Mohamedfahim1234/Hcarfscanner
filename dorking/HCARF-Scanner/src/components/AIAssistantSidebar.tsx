import React, { useEffect, useRef, useState } from "react";
import { X, Send, Sparkles, KeyRound, Trash2, Loader2 } from "lucide-react";

/**
 * AIAssistantSidebar
 * - polished UI
 * - real OpenRouter chat (reads key from sessionStorage)
 * - chat commands: scan <domain>, export (pdf/json/excel), clear keys
 * - dynamically imports scanner/export functions so build won't fail if not present
 */

export default function AIAssistantSidebar({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const [openRouterKey, setOpenRouterKey] = useState(() => sessionStorage.getItem("openrouter_key") || "");
  const [keyValid, setKeyValid] = useState(!!openRouterKey);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<
    { id: number; role: "system" | "assistant" | "user"; content: string }[]
  >([
    { id: 0, role: "system", content: "You are the AI assistant for HCARF Scanner. Be concise and helpful." },
    { id: 1, role: "assistant", content: "👋 Hi — I can run scans and export reports. Type 'scan example.com' to start." },
  ]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ url: string; meta?: any }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const k = sessionStorage.getItem("openrouter_key") || "";
    setOpenRouterKey(k);
    setKeyValid(!!k);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (openRouterKey) {
      sessionStorage.setItem("openrouter_key", openRouterKey);
      setKeyValid(true);
    } else {
      sessionStorage.removeItem("openrouter_key");
      setKeyValid(false);
    }
  }, [openRouterKey]);

  const pushMessage = (role: "assistant" | "user" | "system", content: string) => {
    setMessages((m) => [...m, { id: Date.now() + Math.floor(Math.random() * 1000), role, content }]);
  };

  // utility: extract domain-like token
  const extractDomain = (text: string) => {
    const m = text.match(/([a-z0-9-]+\.[a-z]{2,}(?:\.[a-z]{2,})?)/i);
    return m ? m[1] : null;
  };

  // dynamic import helpers (safe: won't crash build if not present)
  const importScanner = async (): Promise<any | null> => {
    try {
      const mod = await import("@/scanner/scanner");
      return mod;
    } catch (e) {
      // fallback: try alternate path
      try {
        const mod = await import("../scanner/scanner");
        return mod;
      } catch (err) {
        return null;
      }
    }
  };

  const importExports = async (): Promise<any | null> => {
    try {
      const mod = await import("@/exports/exportPDF");
      // note: we dynamically import specific export files later as needed
      return mod;
    } catch (e) {
      try {
        const mod = await import("../exports/exportPDF");
        return mod;
      } catch (err) {
        return null;
      }
    }
  };

  // call the scanner dynamically and safely
  const runScan = async (domain: string) => {
    pushMessage("assistant", `🔍 Starting scan for ${domain} — this runs the scanner module if available.`);
    setLoading(true);

    const scanner = await importScanner();
    if (!scanner || !scanner.runDomainScan) {
      pushMessage("assistant", "⚠️ Scanner module not found (runDomainScan). Please ensure scanner exists at '@/scanner/scanner' or '../scanner/scanner'.");
      setLoading(false);
      return;
    }

    const keys = {
      githubToken: sessionStorage.getItem("githubToken") || "",
      googleApiKey: sessionStorage.getItem("googleApiKey") || "",
      googleCx: sessionStorage.getItem("googleCx") || "",
      aiKey: sessionStorage.getItem("openrouter_key") || "",
    };

    try {
      // Call scanner (maintain original behavior — scanner should return array of urls or objects)
      const raw = await scanner.runDomainScan(domain, keys);
      // Normalize results to objects {url, meta?}
      const normalized: { url: string; meta?: any }[] = (raw || []).map((r: any) =>
        typeof r === "string" ? { url: r } : r.url ? { url: r.url, meta: r.meta } : { url: String(r) }
      );
      setResults(normalized);
      pushMessage("assistant", `✅ Scan finished. Found ${normalized.length} result(s).`);
      if (normalized.length > 0) {
        const top = normalized.slice(0, 10).map((r) => `• ${r.url}`).join("\n");
        pushMessage("assistant", `Top results:\n${top}${normalized.length > 10 ? `\n...and ${normalized.length - 10} more` : ""}`);
      }

      // If scanner exports validate function, use it to filter results
      if (scanner.validateFindingWithAI) {
        pushMessage("assistant", "🔎 Validating findings with AI (this may take a moment)...");
        const validated: typeof normalized = [];
        for (const item of normalized) {
          try {
            // validation should return boolean or object {valid: boolean, score?:..}
            const v = await scanner.validateFindingWithAI(item, keys.aiKey);
            const ok = typeof v === "boolean" ? v : v?.valid !== false;
            if (ok) validated.push(item);
          } catch (e) {
            // if validation fails, keep the finding (fail-open) but mark in meta
            validated.push({ ...item, meta: { ...(item.meta || {}), validationError: String(e) } });
          }
        }
        setResults(validated);
        pushMessage("assistant", `✅ Validation complete. ${validated.length} findings remain after validation.`);
      } else {
        pushMessage("assistant", "ℹ️ No validateFindingWithAI found in scanner module — skipping validation.");
      }
    } catch (err: any) {
      console.error("runDomainScan error:", err);
      pushMessage("assistant", `❌ Scan failed: ${err?.message || String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  // export trigger wrapper (dynamic import per format)
  const triggerExport = async (format: "pdf" | "json" | "excel") => {
    if (!results || results.length === 0) {
      pushMessage("assistant", "⚠️ No scan results available to export.");
      return;
    }

    pushMessage("assistant", `📦 Preparing ${format.toUpperCase()} export...`);
    try {
      if (format === "pdf") {
        // try direct pdf module first path, else fallback
        try {
          const mod = await import("@/exports/exportPDF");
          if (mod && mod.exportAsPDF) {
            await mod.exportAsPDF(results, sessionStorage.getItem("openrouter_key") || "");
            pushMessage("assistant", `✅ PDF export started (module '@/exports/exportPDF').`);
            return;
          }
        } catch {}
        try {
          const mod = await import("../exports/exportPDF");
          if (mod && mod.exportAsPDF) {
            await mod.exportAsPDF(results, sessionStorage.getItem("openrouter_key") || "");
            pushMessage("assistant", `✅ PDF export started (module '../exports/exportPDF').`);
            return;
          }
        } catch {}
        pushMessage("assistant", "⚠️ exportAsPDF not found in expected paths.");
      } else if (format === "json") {
        try {
          const mod = await import("@/exports/exportJSON");
          if (mod && mod.exportAsJSON) {
            await mod.exportAsJSON(results, sessionStorage.getItem("openrouter_key") || "");
            pushMessage("assistant", `✅ JSON export started (module '@/exports/exportJSON').`);
            return;
          }
        } catch {}
        try {
          const mod = await import("../exports/exportJSON");
          if (mod && mod.exportAsJSON) {
            await mod.exportAsJSON(results, sessionStorage.getItem("openrouter_key") || "");
            pushMessage("assistant", `✅ JSON export started (module '../exports/exportJSON').`);
            return;
          }
        } catch {}
        // fallback: create and download JSON locally
        const blob = new Blob([JSON.stringify(results, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `hcarf-results-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        pushMessage("assistant", "✅ JSON exported locally (fallback).");
      } else if (format === "excel") {
        try {
          const mod = await import("@/exports/exportExcel");
          if (mod && mod.exportAsExcel) {
            await mod.exportAsExcel(results, sessionStorage.getItem("openrouter_key") || "");
            pushMessage("assistant", `✅ Excel export started (module '@/exports/exportExcel').`);
            return;
          }
        } catch {}
        try {
          const mod = await import("../exports/exportExcel");
          if (mod && mod.exportAsExcel) {
            await mod.exportAsExcel(results, sessionStorage.getItem("openrouter_key") || "");
            pushMessage("assistant", `✅ Excel export started (module '../exports/exportExcel').`);
            return;
          }
        } catch {}
        pushMessage("assistant", "⚠️ exportAsExcel not found in expected paths.");
      }
    } catch (err: any) {
      console.error("export error:", err);
      pushMessage("assistant", `❌ Export failed: ${err?.message || String(err)}`);
    }
  };

  // send normal chat to OpenRouter (or fallback message)
  const sendToOpenRouter = async (text: string) => {
    pushMessage("user", text);

    const key = sessionStorage.getItem("openrouter_key") || "";
    if (!key) {
      pushMessage("assistant", "⚠️ Missing OpenRouter API key. Please add it in the locked panel.");
      return;
    }

    // assemble conversation for API (system + messages + user)
    const conversation = [...messages, { id: Date.now(), role: "user", content: text }];
    const apiMessages = conversation.map((m) => ({
      role: m.role === "user" ? "user" : m.role === "assistant" ? "assistant" : "system",
      content: m.content,
    }));

    // abort previous
    if (abortRef.current) {
      try {
        abortRef.current.abort();
      } catch {}
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);

    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: "openai/gpt-3.5-turbo",
          messages: apiMessages,
        }),
      });

      if (!res.ok) {
        let raw = await res.text().catch(() => "");
        pushMessage("assistant", `❌ OpenRouter returned ${res.status}${raw ? `: ${raw}` : ""}`);
        return;
      }

      const data = await res.json();
      const reply = data?.choices?.[0]?.message?.content || "⚠️ No response from AI.";
      pushMessage("assistant", reply);
    } catch (err: any) {
      if (err?.name === "AbortError") {
        pushMessage("assistant", "⚠️ AI request aborted.");
      } else {
        console.error("OpenRouter request error:", err);
        pushMessage("assistant", `❌ Failed to contact OpenRouter: ${err?.message || String(err)}`);
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  // main handler for chat submit
  const handleSend = async (evt?: React.FormEvent) => {
    evt?.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput("");

    // clear keys command
    if (/^\s*(clear\s+keys|clear\s+api\s+keys)\s*$/i.test(text)) {
      sessionStorage.removeItem("openrouter_key");
      sessionStorage.removeItem("githubToken");
      sessionStorage.removeItem("googleApiKey");
      sessionStorage.removeItem("googleCx");
      setOpenRouterKey("");
      setKeyValid(false);
      setResults([]);
      pushMessage("assistant", "🔐 All API keys cleared from session storage.");
      return;
    }

    // scan command
    if (/\b(scan|check|audit|lookup)\b/i.test(text)) {
      const domain = extractDomain(text);
      if (!domain) {
        pushMessage("assistant", "❗ Please include a domain to scan (e.g., 'scan example.com').");
        return;
      }
      await runScan(domain);
      return;
    }

    // export command
    if (/\bexport\b/i.test(text)) {
      if (/pdf/i.test(text)) {
        await triggerExport("pdf");
        return;
      } else if (/\bjson\b/i.test(text)) {
        await triggerExport("json");
        return;
      } else if (/\b(excel|xls|xlsx)\b/i.test(text)) {
        await triggerExport("excel");
        return;
      } else {
        pushMessage("assistant", "❗ Specify export format: pdf, json, or excel (e.g., 'export pdf').");
        return;
      }
    }

    // otherwise standard chat to OpenRouter
    await sendToOpenRouter(text);
  };

  // UI render
  if (!open) return null;

  return (
    <aside className="fixed top-0 right-0 h-full w-full max-w-md z-[9999] bg-gradient-to-br from-[#071024] via-[#0e1b3a] to-[#08102a] backdrop-blur-md shadow-2xl border-l border-fuchsia-700/30 flex flex-col">
      {/* header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-fuchsia-700/20">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-gradient-to-br from-fuchsia-500 to-indigo-600 p-2 shadow">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-white font-semibold">AI Assistant</div>
            <div className="text-xs text-fuchsia-200/60">Ask, scan, or export — right from chat</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            title="Clear OpenRouter key"
            onClick={() => {
              sessionStorage.removeItem("openrouter_key");
              setOpenRouterKey("");
              setKeyValid(false);
              pushMessage("assistant", "🔐 OpenRouter key cleared from session.");
            }}
            className="text-fuchsia-300 hover:text-white p-2 rounded"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          <button onClick={() => setOpen(false)} className="text-fuchsia-300 hover:text-white p-2 rounded">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 custom-scrollbar">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "assistant" ? "justify-start" : "justify-end"}`}>
            <div
              className={`max-w-[84%] px-4 py-3 rounded-2xl shadow-lg ${m.role === "assistant"
                ? "bg-gradient-to-br from-purple-800/90 to-indigo-800/70 text-white border border-purple-600/20"
                : "bg-gradient-to-br from-cyan-700/80 to-blue-800/70 text-white border border-cyan-400/10"
                }`}
              style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-fuchsia-300">
            <Loader2 className="w-4 h-4 animate-spin" /> AI working...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* input area */}
      <form
        onSubmit={handleSend}
        className="p-4 border-t border-fuchsia-700/10 bg-black/6 flex items-center gap-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type 'scan example.com' or ask a question..."
          className="flex-1 rounded-full px-4 py-3 bg-slate-900/60 border border-fuchsia-700/10 text-white placeholder-fuchsia-300 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-gradient-to-br from-fuchsia-500 to-blue-500 p-3 shadow hover:scale-105 transition-transform disabled:opacity-50"
        >
          <Send className="w-5 h-5 text-white" />
        </button>
      </form>

      {/* Locked overlay: show if key missing */}
      {!keyValid && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-black/40 to-black/60 backdrop-blur-sm p-6 z-50">
          <div className="w-full max-w-xs bg-[#121428]/90 rounded-xl p-6 text-center border border-fuchsia-700/20 relative">
            {/* Close (X) button at top-right */}
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-200 text-xl font-bold focus:outline-none"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <div className="text-lg text-white font-semibold mb-3">🔐 Enter OpenRouter Key</div>
            <input
              value={openRouterKey}
              onChange={(e) => setOpenRouterKey(e.target.value)}
              placeholder="Paste OpenRouter API key"
              className="w-full px-3 py-2 rounded bg-white/5 border border-fuchsia-600/20 text-white mb-3"
            />
            <div className="flex items-center justify-between gap-2">
              <a className="text-xs text-cyan-300 underline" href="https://openrouter.ai/keys" target="_blank" rel="noreferrer">Get Key</a>
              <button
                onClick={() => setOpenRouterKey("")}
                className="text-xs text-red-400"
              >
                Clear
              </button>
            </div>
            <div className="text-xs text-gray-300 mt-3">Stored only in this browser session.</div>
          </div>
        </div>
      )}
    </aside>
  );
}
