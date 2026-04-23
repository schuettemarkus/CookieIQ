import React from 'react';

export default function TermsOfService() {
  return (
    <div className="py-8 max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold tracking-tight mb-1">Terms of Service</h2>
      <p className="text-xs text-stone-400 mb-8">Last updated: April 2026</p>

      <div className="card p-8 space-y-6 text-sm leading-relaxed text-stone-700">
        <Section title="1. Acceptance of Terms">
          <p>By accessing and using CookieIQ ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Service.</p>
        </Section>

        <Section title="2. Description of Service">
          <p>CookieIQ is a cookie research, website scanning, and compliance intelligence tool. The Service provides:</p>
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li>AI-powered cookie research and categorization</li>
            <li>Website cookie scanning using headless browser technology</li>
            <li>TrustArc inventory gap analysis</li>
            <li>AI compliance consulting</li>
            <li>Scan history and cookie drift detection</li>
          </ul>
        </Section>

        <Section title="3. Use of the Service">
          <p>You agree to use CookieIQ only for lawful purposes and in accordance with these terms. Specifically, you agree not to:</p>
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li>Scan websites without proper authorization</li>
            <li>Circumvent anti-bot protections or security measures on scanned sites</li>
            <li>Use the Service to conduct unauthorized penetration testing</li>
            <li>Overload the Service or Anthropic API with excessive requests</li>
            <li>Redistribute or commercially resell the Service without permission</li>
          </ul>
        </Section>

        <Section title="4. AI-Generated Content Disclaimer">
          <p><strong>CookieIQ's AI features are for informational purposes only and do not constitute legal advice.</strong></p>
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li>Cookie categorization recommendations are based on AI analysis and publicly available data. They may contain errors or omissions.</li>
            <li>Legal and regulatory guidance provided by the AI Consultant should be verified by a qualified legal professional before reliance.</li>
            <li>Compliance scores and gap analysis results are estimates and should not be treated as formal audit findings.</li>
          </ul>
          <p className="mt-2">You assume full responsibility for any decisions made based on CookieIQ's output.</p>
        </Section>

        <Section title="5. API Key & Account">
          <p>You are responsible for maintaining the confidentiality of your Anthropic API key. You are solely responsible for any charges incurred through your API key's usage within CookieIQ.</p>
        </Section>

        <Section title="6. Intellectual Property">
          <p>CookieIQ is open-source software released under the MIT License. The Open Cookie Database is used under the Apache 2.0 License. You retain all rights to your data, including search queries, scan results, and chat conversations.</p>
        </Section>

        <Section title="7. Third-Party Websites">
          <p>The Site Scanner feature accesses third-party websites on your behalf. We are not responsible for the content, practices, or availability of these websites. You are responsible for ensuring you have authorization to scan any website you submit.</p>
        </Section>

        <Section title="8. Limitation of Liability">
          <p>CookieIQ is provided "AS IS" without warranty of any kind, express or implied. To the fullest extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service, including but not limited to:</p>
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li>Inaccurate cookie categorization or compliance recommendations</li>
            <li>Regulatory penalties resulting from reliance on AI-generated guidance</li>
            <li>Data loss or corruption of scan history</li>
            <li>Disruption to scanned third-party websites</li>
          </ul>
        </Section>

        <Section title="9. Modifications">
          <p>We reserve the right to modify these Terms at any time. Continued use of the Service after modifications constitutes acceptance of the updated terms.</p>
        </Section>

        <Section title="10. Governing Law">
          <p>These Terms shall be governed by and construed in accordance with applicable law, without regard to conflict of law provisions.</p>
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
