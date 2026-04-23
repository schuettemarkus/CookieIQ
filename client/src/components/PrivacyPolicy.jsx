import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="py-8 max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold tracking-tight mb-1">Privacy Policy</h2>
      <p className="text-xs text-stone-400 mb-8">Last updated: April 2026</p>

      <div className="card p-8 space-y-6 text-sm leading-relaxed text-stone-700">
        <Section title="1. Introduction">
          <p>CookieIQ ("we", "our", "us") is a cookie research and categorization tool designed for privacy engineers, DPOs, and legal teams. This Privacy Policy explains how we collect, use, and protect information when you use our service.</p>
        </Section>

        <Section title="2. Information We Collect">
          <p><strong>Information you provide:</strong></p>
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li>Cookie names and vendor names you search for</li>
            <li>Website URLs you submit for scanning</li>
            <li>Questions and messages you send via the AI Consultant</li>
            <li>TrustArc CSV files you upload for gap analysis</li>
          </ul>
          <p className="mt-3"><strong>Information collected automatically:</strong></p>
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li>Recent search history (stored locally in your browser via localStorage)</li>
            <li>Cached cookie profiles (stored locally in your browser via localStorage)</li>
            <li>Scan history and results (stored in a local SQLite database on the server)</li>
          </ul>
        </Section>

        <Section title="3. How We Use Your Information">
          <ul className="list-disc ml-5 space-y-1">
            <li>To research and classify cookies using the Anthropic Claude API</li>
            <li>To scan websites for cookies and tracking technologies using headless browser technology</li>
            <li>To provide AI-powered compliance guidance</li>
            <li>To maintain scan history and detect cookie drift over time</li>
          </ul>
        </Section>

        <Section title="4. Third-Party Services">
          <p>CookieIQ integrates with the following third-party services:</p>
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li><strong>Anthropic Claude API</strong> — your search queries, chat messages, and scanned cookie data are sent to Anthropic's API for processing. Anthropic's privacy policy applies to their handling of this data.</li>
            <li><strong>Open Cookie Database</strong> — we use this open-source database (Apache 2.0 license) for local cookie classification. No data is sent to this service.</li>
            <li><strong>Google Fonts</strong> — the Inter typeface is loaded from Google Fonts. Google's privacy policy applies.</li>
          </ul>
        </Section>

        <Section title="5. Data Storage & Security">
          <p>CookieIQ is designed as a local-first tool:</p>
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li>Search history and cached profiles are stored in your browser's localStorage</li>
            <li>Scan history is stored in a local SQLite database on the server machine</li>
            <li>TrustArc CSV uploads are parsed entirely client-side and never sent to our server</li>
            <li>Your Anthropic API key is stored server-side in an environment file and never exposed to the browser</li>
          </ul>
        </Section>

        <Section title="6. Data Retention">
          <p>Browser localStorage data persists until you clear your browser data. SQLite scan history persists until the database file is deleted. There is no automatic data retention limit; you may delete data at any time.</p>
        </Section>

        <Section title="7. Your Rights">
          <p>Under GDPR, CCPA, and other applicable privacy laws, you have the right to:</p>
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li>Access the data we hold about you</li>
            <li>Request deletion of your data</li>
            <li>Export your data in a portable format</li>
            <li>Object to data processing</li>
          </ul>
          <p className="mt-2">Since CookieIQ operates locally, you can exercise these rights by clearing localStorage in your browser and deleting the SQLite database file.</p>
        </Section>

        <Section title="8. Children's Privacy">
          <p>CookieIQ is a professional compliance tool and is not directed at children under 16. We do not knowingly collect data from children.</p>
        </Section>

        <Section title="9. Changes to This Policy">
          <p>We may update this Privacy Policy from time to time. Changes will be reflected in the "Last updated" date at the top of this page.</p>
        </Section>

        <Section title="10. Contact">
          <p>For privacy-related inquiries, please contact us through the repository's issue tracker or the email address listed in the project documentation.</p>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section>
      <h3 className="text-base font-semibold text-stone-900 mb-2">{title}</h3>
      {children}
    </section>
  );
}
