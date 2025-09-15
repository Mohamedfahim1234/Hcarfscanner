import React, { useState } from 'react';

export default function AIAssistantApiKeyModal({ open, onClose, onSave }) {
  const [key, setKey] = useState(localStorage.getItem('openrouter_api_key') || '');
  const [show, setShow] = useState(false);

  const handleSave = () => {
    localStorage.setItem('openrouter_api_key', key);
    onSave(key);
    onClose();
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-xl w-full max-w-sm relative">
        {/* Close (X) button at top-right */}
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-white text-xl font-bold focus:outline-none"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        <h2 className="text-lg font-bold mb-2">Enter OpenRouter API Key</h2>
        <input
          type={show ? 'text' : 'password'}
          className="w-full border rounded px-3 py-2 mb-2 bg-slate-100 dark:bg-slate-800"
          value={key}
          onChange={e => setKey(e.target.value)}
          placeholder="sk-..."
        />
        <button className="text-xs text-blue-500 mb-4" onClick={() => setShow(s => !s)}>{show ? 'Hide' : 'Show'} Key</button>
        <div className="flex gap-2 justify-end">
          <button className="px-3 py-1 rounded bg-slate-200 dark:bg-slate-700" onClick={onClose}>Cancel</button>
          <button className="px-3 py-1 rounded bg-purple-600 text-white" onClick={handleSave} disabled={!key}>Save</button>
        </div>
      </div>
    </div>
  );
}
