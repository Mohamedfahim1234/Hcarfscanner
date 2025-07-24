import React from "react";

const Footer: React.FC = () => {
  return (
    <footer style={{ background: "#1f1f2e", color: "#e0e0e0", position: "relative", bottom: 0, width: "100%", padding: "1.2rem 0", marginTop: "auto" }}>
      <div className="text-center text-xs md:text-sm" style={{ lineHeight: 1.6 }}>
        © 2025 H-CARF Scanner. All rights reserved. Unauthorized use is prohibited.<br />
        <span style={{ color: "#aaa" }}>v1.0.0</span> &nbsp;|&nbsp; <a href="mailto:contact@hcarf.dev" className="underline text-cyan-300">contact@hcarf.dev</a>
        <br />
        <a href="/privacy" className="underline text-cyan-300 mx-2">Privacy Policy</a>
        &nbsp;|&nbsp;
        <a href="/terms" className="underline text-cyan-300 mx-2">Ethical Use Agreement</a>
      </div>
    </footer>
  );
};

export default Footer;
