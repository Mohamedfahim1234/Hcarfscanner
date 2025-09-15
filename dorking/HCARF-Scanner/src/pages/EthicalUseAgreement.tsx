import React, { useEffect } from "react";

const EthicalUseAgreement: React.FC = () => {
  useEffect(() => {
    document.title = "Ethical Use Agreement | H-CARF Scanner";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'Read the Ethical Use Agreement for H-CARF Scanner. Understand your responsibilities and the terms of ethical, legal use.');
  }, []);

  return (
    <main className="max-w-2xl mx-auto px-4 py-10 text-gray-100">
      <h1 className="text-3xl font-bold mb-6">Ethical Use Agreement</h1>
      <section className="mb-6">
        <p>
          <strong>Effective Date:</strong> July 24, 2025
        </p>
        <p className="mt-2">
          By using H-CARF Scanner ("the Service"), you agree to comply with the following terms and conditions. This tool is provided for educational, research, and authorized security testing purposes only.
        </p>
      </section>
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">1. Authorized Use Only</h2>
        <p>
          You may only use H-CARF Scanner to analyze domains, systems, or data that you own or have explicit permission to test. Unauthorized scanning of third-party systems is strictly prohibited and may be illegal.
        </p>
      </section>
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">2. Legal Compliance</h2>
        <p>
          You are responsible for ensuring that your use of this tool complies with all applicable laws and regulations in your jurisdiction. Misuse of H-CARF Scanner may violate international, federal, or local cybersecurity laws.
        </p>
      </section>
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">3. Prohibited Activities</h2>
        <ul className="list-disc ml-6">
          <li>Scanning or testing systems without authorization</li>
          <li>Attempting to exploit, disrupt, or damage third-party services</li>
          <li>Using the tool for malicious, illegal, or unethical purposes</li>
        </ul>
      </section>
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">4. Consequences of Misuse</h2>
        <p>
          Abusive or unauthorized use of H-CARF Scanner may result in your access being blocked and may expose you to civil or criminal liability. We reserve the right to restrict or terminate access at our discretion.
        </p>
      </section>
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">5. Disclaimer</h2>
        <p>
          H-CARF Scanner is provided "as is" without warranty of any kind. We are not responsible for any damages or legal consequences resulting from misuse of this tool.
        </p>
      </section>
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">6. Contact</h2>
        <p>
          For questions about this agreement, contact us at <a href="mailto:contact@hcarf.dev" className="text-cyan-300 underline">contact@hcarf.dev</a>.
        </p>
      </section>
      <div className="mt-10 text-xs text-gray-400">© 2025 H-CARF Scanner. All rights reserved.</div>
    </main>
  );
};

export default EthicalUseAgreement;
