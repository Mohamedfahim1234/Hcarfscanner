import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Eye, EyeOff, ExternalLink } from "lucide-react";

const API_KEY_FIELDS = [
  {
    key: "githubToken",
    label: "GitHub Personal Access Token",
    placeholder: "Enter your GitHub personal access token...",
    link: "https://github.com/settings/tokens",
    tooltip: "Generate your GitHub token",
    icon: <svg className='inline h-4 w-4 mr-1' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'><path d='M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.5.5.09.66-.22.66-.48 0-.24-.01-.87-.01-1.7-2.78.6-3.37-1.34-3.37-1.34-.45-1.15-1.11-1.46-1.11-1.46-.91-.62.07-.61.07-.61 1.01.07 1.54 1.04 1.54 1.04.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02A9.56 9.56 0 0 1 12 6.8c.85.004 1.71.12 2.51.35 1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.85-2.34 4.7-4.57 4.95.36.31.68.92.68 1.85 0 1.34-.01 2.42-.01 2.75 0 .27.16.58.67.48A10.01 10.01 0 0 0 22 12c0-5.52-4.48-10-10-10z'></path></svg>
  },
  {
    key: "googleApiKey",
    label: "Google API Key",
    placeholder: "Enter your Google API key...",
    link: "https://console.developers.google.com/apis/credentials",
    tooltip: "Get your Google API key",
    icon: <svg className='inline h-4 w-4 mr-1' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'><circle cx='12' cy='12' r='10' /><path d='M12 6v6l4 2' /></svg>
  },
  {
    key: "googleCx",
    label: "Google Search Engine ID (CX)",
    placeholder: "Enter your Google Search Engine ID...",
    link: "https://programmablesearchengine.google.com/controlpanel/create",
    tooltip: "Create a Programmable Search Engine",
    icon: <svg className='inline h-4 w-4 mr-1' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'><circle cx='12' cy='12' r='10' /><path d='M12 6v6l4 2' /></svg>
  },
  // AI Assistant API Key removed as per user request
];

export const ApiConfigPanel: React.FC<{
  onConfigured?: (keys: Record<string, string>) => void;
  isCaptchaVerified?: boolean;
}> = ({ onConfigured, isCaptchaVerified = false }) => {
  const [fields, setFields] = useState(() => {
    const initial: Record<string, string> = {};
    API_KEY_FIELDS.forEach(f => {
      initial[f.key] = sessionStorage.getItem(f.key) || "";
    });
    return initial;
  });
  const [show, setShow] = useState<Record<string, boolean>>({});
  const [remember, setRemember] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 2500);
      return () => clearTimeout(t);
    }
  }, [toast]);


  const handleChange = (key: string, value: string) => {
    setFields(f => ({ ...f, [key]: value }));
  };

  // Warn if user tries to focus before captcha
  const handleFocus = () => {
    if (!isCaptchaVerified) {
      alert("Please complete the CAPTCHA before entering your API key.");
    }
  };

  const handleToggleShow = (key: string) => {
    setShow(s => ({ ...s, [key]: !s[key] }));
  };

  const handleSave = () => {
    Object.entries(fields).forEach(([k, v]) => {
      if (v) sessionStorage.setItem(k, v);
      else sessionStorage.removeItem(k);
    });
    setToast("API keys configured successfully");
    if (onConfigured) onConfigured(fields);
  };

  const handleClearKeys = () => {
    API_KEY_FIELDS.forEach(f => sessionStorage.removeItem(f.key));
    setFields(API_KEY_FIELDS.reduce((acc, f) => ({ ...acc, [f.key]: "" }), {}));
    setToast("API keys cleared");
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center">
      {/* Modal Backdrop */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[99998]" />
      {/* Modal Content */}
      <div
        className="relative z-[99999] bg-[#23233a] rounded-xl shadow-2xl p-8 w-full max-w-md border-2 border-[#00e6e6] text-left animate-fade-in api-config-panel flex flex-col"
        style={{
          maxHeight: 'calc(100vh - 32px)',
          overflowY: 'auto',
          width: '95vw',
          maxWidth: '420px',
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-white">API Configuration</h2>
          <button
            className="p-2 rounded hover:bg-slate-800/70 focus:outline-none"
            aria-label="Close API Config"
            onClick={() => {
              if (onConfigured) onConfigured(undefined);
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
        <p className="text-sm text-gray-400 mb-4">
          Keys are stored temporarily and not saved permanently. They are cleared when you click 'Clear Keys'.
        </p>
        <form onSubmit={e => { e.preventDefault(); handleSave(); }}>
          {API_KEY_FIELDS.map(f => (
            <div className="mb-4" key={f.key}>
              <label className="block text-gray-200 font-medium mb-1 flex items-center gap-2">
                {f.icon} {f.label}
                <a
                  href={f.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={f.tooltip}
                  className="ml-1 text-[#00e6e6] hover:text-[#8833ff]"
                  tabIndex={-1}
                >
                  <ExternalLink className="inline h-4 w-4 align-text-bottom" />
                </a>
              </label>
              <div className="relative flex items-center">
                <input
                  type={show[f.key] ? "text" : "password"}
                  className={`w-full px-3 py-2 rounded bg-[#1f1f2e] border border-[#8833ff] text-white focus:border-[#00e6e6] focus:outline-none pr-10 transition-opacity duration-300 ${!isCaptchaVerified ? 'opacity-50 cursor-not-allowed' : ''}`}
                  placeholder={f.placeholder}
                  value={fields[f.key]}
                  onChange={e => isCaptchaVerified ? handleChange(f.key, e.target.value) : undefined}
                  autoComplete="off"
                  disabled={!isCaptchaVerified}
                  onFocus={handleFocus}
                  title={!isCaptchaVerified ? "Complete CAPTCHA to unlock" : ""}
                />
                <button
                  type="button"
                  className="absolute right-2 text-[#00e6e6] hover:text-[#8833ff]"
                  tabIndex={-1}
                  onClick={() => handleToggleShow(f.key)}
                  title={show[f.key] ? "Hide" : "Show"}
                  disabled={!isCaptchaVerified}
                >
                  {show[f.key] ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
                {!isCaptchaVerified && (
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs flex items-center gap-1">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke="#aaa" strokeWidth="2" d="M12 17v.01M12 13a1 1 0 0 1 1-1h.01a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-.01a1 1 0 0 1-1-1v-1Zm0-8a7 7 0 1 1 0 14a7 7 0 0 1 0-14Z"/></svg>
                    Locked
                  </span>
                )}
              </div>
            </div>
          ))}
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="remember"
              checked={remember}
              onChange={e => setRemember(e.target.checked)}
              className="accent-[#00e6e6] mr-2"
            />
            <label htmlFor="remember" className="text-gray-300 text-sm">Remember this session</label>
          </div>
          <div className="flex gap-4 mt-6">
            <button
              type="submit"
              className="bg-gradient-to-r from-[#00e6e6] to-[#8833ff] text-white px-6 py-2 rounded-lg font-semibold shadow hover:from-[#00bcbc] hover:to-[#6a1fbf] focus:outline-none focus:ring-2 focus:ring-[#00e6e6]"
            >
              Save Keys
            </button>
            <button
              type="button"
              className="bg-gray-700 text-gray-200 px-6 py-2 rounded-lg font-semibold border border-gray-500 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#ff5e5e]"
              onClick={handleClearKeys}
            >
              Clear Keys
            </button>
          </div>
        </form>
        {toast && <div className="mt-4 text-center text-[#00e6e6] font-semibold">{toast}</div>}
      </div>
    </div>,
    document.body
  );
};
