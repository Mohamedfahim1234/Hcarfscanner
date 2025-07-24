import React, { useEffect } from "react";

const PrivacyPolicy: React.FC = () => {
  useEffect(() => {
    document.title = "Privacy Policy | H-CARF Scanner";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'Read the full privacy policy for H-CARF Scanner. Learn what data is collected, how your information is handled, and your privacy rights.');
  }, []);

  return (
    <main className="max-w-2xl mx-auto px-4 py-10 text-gray-100">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <section className="mb-6">
        <p>
          <strong>Effective Date:</strong> July 24, 2025
        </p>
        <p className="mt-2">
          H-CARF Scanner ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we handle your information when you use our web application.
        </p>
      </section>
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">1. Data Collection</h2>
        <p>
          H-CARF Scanner does <strong>not</strong> collect, store, or transmit any personal data, scan input, or API keys to our servers. All data you enter, including API keys and scan queries, are processed locally in your browser.
        </p>
      </section>
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">2. Session Storage</h2>
        <p>
          API keys and configuration data are stored temporarily in your browser's <strong>sessionStorage</strong> or <strong>localStorage</strong> for the duration of your session. This data is cleared when you close your browser tab or log out. We do not have access to this information.
        </p>
      </section>
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">3. Cookies</h2>
        <p>
          H-CARF Scanner does <strong>not</strong> use cookies for tracking, analytics, or advertising. Cookies may only be used if you explicitly enable features that require them (e.g., session persistence).
        </p>
      </section>
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">4. Analytics & Logging</h2>
        <p>
          We do <strong>not</strong> use analytics, tracking scripts, or log your activity. Your scan data and API keys remain private and are never sent to any third party.
        </p>
      </section>
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">5. Third-Party Services</h2>
        <p>
          H-CARF Scanner does not share your data with any third parties. If you use third-party APIs (e.g., GitHub, SerpAPI), your credentials are used only for direct requests from your browser.
        </p>
      </section>
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">6. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated effective date.
        </p>
      </section>
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">7. Contact</h2>
        <p>
          For questions about this Privacy Policy, contact us at <a href="mailto:contact@hcarf.dev" className="text-cyan-300 underline">contact@hcarf.dev</a>.
        </p>
      </section>
      <div className="mt-10 text-xs text-gray-400">© 2025 H-CARF Scanner. All rights reserved.</div>
    </main>
  );
};

export default PrivacyPolicy;
