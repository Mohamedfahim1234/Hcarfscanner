import React, { useEffect, useState } from "react";

const PolicyModal: React.FC = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("policyAccepted")) {
      setOpen(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("policyAccepted", "true");
    setOpen(false);
  };

  const handleExit = () => {
    // Optionally, you can redirect or just block the UI
    document.body.innerHTML = `<div style='display:flex;align-items:center;justify-content:center;height:100vh;background:#181825;color:#fff;font-size:1.5rem;text-align:center;'>Access denied. You must accept the policies to use H-CARF Scanner.</div>`;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-[#23233a] rounded-lg shadow-lg p-8 max-w-md w-full text-center border border-cyan-700">
        <h2 className="text-2xl font-bold mb-4 text-cyan-300">Legal Notice</h2>
        <p className="mb-4 text-gray-200">
          By continuing to use this site, you agree to our <a href="/privacy" className="underline text-cyan-300">Privacy Policy</a> and <a href="/terms" className="underline text-cyan-300">Ethical Use Agreement</a>.
        </p>
        <div className="flex justify-center gap-4 mt-6">
          <button
            className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 px-6 rounded shadow"
            onClick={handleAccept}
            autoFocus
          >
            I Agree & Continue
          </button>
          <button
            className="bg-gray-700 hover:bg-gray-800 text-gray-200 font-semibold py-2 px-6 rounded shadow"
            onClick={handleExit}
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );
};

export default PolicyModal;
