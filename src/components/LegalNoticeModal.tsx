import React, { useEffect, useState } from "react";

const LEGAL_NOTICE_KEY = "acceptedPolicy";

export const LegalNoticeModal: React.FC = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(LEGAL_NOTICE_KEY)) {
      setOpen(true);
    }
  }, []);

  const handleAgree = () => {
    localStorage.setItem(LEGAL_NOTICE_KEY, "true");
    setOpen(false);
  };

  const handleExit = () => {
    window.location.href = "https://www.google.com";
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1f1f2e]/95">
      <div className="bg-[#23233a] rounded-xl shadow-2xl p-8 max-w-lg w-full border-2 border-[#00e6e6] text-center relative animate-fade-in">
        <div className="flex flex-col items-center">
          <div className="mb-4">
            <span className="inline-block bg-gradient-to-r from-[#00e6e6] to-[#8833ff] text-white rounded-full px-4 py-2 text-lg font-bold shadow-lg">
              ⚠️ Security Disclaimer
            </span>
          </div>
          <p className="text-gray-200 text-base mb-4">
            This scanner is intended for <span className="text-[#00e6e6] font-semibold">educational, ethical cybersecurity</span> purposes only.<br/>
            <span className="text-[#ff5e5e]">Do not use this tool to attack or scan systems you do not own or have explicit permission for.</span>
          </p>
          <p className="text-gray-400 text-sm mb-6">
            By proceeding, you accept our <a href="/privacy" className="underline text-[#00e6e6] hover:text-[#8833ff]">privacy policy</a> and <a href="/ethics" className="underline text-[#00e6e6] hover:text-[#8833ff]">ethical use agreement</a>.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              className="bg-gradient-to-r from-[#00e6e6] to-[#8833ff] text-white px-6 py-2 rounded-lg font-semibold shadow hover:from-[#00bcbc] hover:to-[#6a1fbf] focus:outline-none focus:ring-2 focus:ring-[#00e6e6]"
              onClick={handleAgree}
            >
              Agree & Continue
            </button>
            <button
              className="bg-gray-700 text-gray-200 px-6 py-2 rounded-lg font-semibold border border-gray-500 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#ff5e5e]"
              onClick={handleExit}
            >
              Exit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
