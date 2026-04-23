import React from 'react';
import CategoryBadge from './CategoryBadge.jsx';

const SITE_COOKIES = [
  { name: 'cookieiq.recent', type: 'localStorage', duration: 'Persistent', category: 'Strictly Necessary', purpose: 'Stores the 5 most recent cookie search queries for quick re-access.' },
  { name: 'cookieiq.profile.*', type: 'localStorage', duration: 'Persistent', category: 'Functional', purpose: 'Caches researched cookie profiles locally to avoid repeat API calls. One entry per researched cookie.' },
  { name: 'cookieiq.lastScan', type: 'localStorage', duration: 'Persistent', category: 'Functional', purpose: 'Stores the most recent site scan results so the AI Consultant can reference your site data in "My Site" mode.' },
];

const THIRD_PARTY = [
  { name: 'Google Fonts', domain: 'fonts.googleapis.com, fonts.gstatic.com', purpose: 'Loads the Inter typeface. Google may set cookies or collect usage data per their privacy policy.', category: 'Functional' },
  { name: 'Anthropic API', domain: 'api.anthropic.com', purpose: 'Processes cookie research queries, chat messages, and scan data. No cookies are set by this service in the browser.', category: 'Strictly Necessary' },
];

export default function CookiePolicyPage() {
  return (
    <div className="py-8 max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold tracking-tight mb-1">Cookie Policy</h2>
      <p className="text-xs text-stone-400 mb-8">Last updated: April 2026</p>

      <div className="card p-8 space-y-8 text-sm leading-relaxed text-stone-700">
        <section>
          <h3 className="text-base font-semibold text-stone-900 mb-2">What are cookies?</h3>
          <p>Cookies and similar technologies (localStorage, sessionStorage) are small pieces of data stored in your browser. They help websites remember your preferences and provide functionality.</p>
        </section>

        <section>
          <h3 className="text-base font-semibold text-stone-900 mb-2">How CookieIQ uses cookies</h3>
          <p>CookieIQ is a local-first tool. <strong>We do not use third-party tracking, advertising, or analytics cookies.</strong> All data storage is functional — used to improve your experience with the tool itself.</p>
          <p className="mt-2">CookieIQ uses <strong>localStorage</strong> (not HTTP cookies) to persist data in your browser. This data never leaves your device unless you explicitly use features that send data to the Anthropic API.</p>
        </section>

        <section>
          <h3 className="text-base font-semibold text-stone-900 mb-3">Cookies & storage used on this site</h3>
          <div className="rounded-xl overflow-hidden border border-stone-100">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 text-left text-xs text-stone-500">
                <tr>
                  <th className="px-4 py-2.5">Name</th>
                  <th>Type</th>
                  <th>Duration</th>
                  <th>Category</th>
                  <th>Purpose</th>
                </tr>
              </thead>
              <tbody>
                {SITE_COOKIES.map((c, i) => (
                  <tr key={i} className="border-t border-stone-100">
                    <td className="px-4 py-3 font-mono text-xs align-top">{c.name}</td>
                    <td className="text-xs align-top py-3">{c.type}</td>
                    <td className="text-xs align-top py-3">{c.duration}</td>
                    <td className="align-top py-3"><CategoryBadge category={c.category} /></td>
                    <td className="text-xs text-stone-600 align-top py-3 max-w-[240px]">{c.purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h3 className="text-base font-semibold text-stone-900 mb-3">Third-party services</h3>
          <div className="rounded-xl overflow-hidden border border-stone-100">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 text-left text-xs text-stone-500">
                <tr>
                  <th className="px-4 py-2.5">Service</th>
                  <th>Domain</th>
                  <th>Category</th>
                  <th>Purpose</th>
                </tr>
              </thead>
              <tbody>
                {THIRD_PARTY.map((s, i) => (
                  <tr key={i} className="border-t border-stone-100">
                    <td className="px-4 py-3 font-medium align-top">{s.name}</td>
                    <td className="font-mono text-xs align-top py-3">{s.domain}</td>
                    <td className="align-top py-3"><CategoryBadge category={s.category} /></td>
                    <td className="text-xs text-stone-600 align-top py-3 max-w-[280px]">{s.purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h3 className="text-base font-semibold text-stone-900 mb-2">Server-side storage</h3>
          <p>CookieIQ stores scan history in a local SQLite database on the server. This includes:</p>
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li><strong>Scan snapshots</strong> — domain, scan timestamp, and the full cookie inventory as JSON</li>
            <li><strong>Monitoring schedules</strong> — domain, URL, frequency (daily/weekly), and last run time</li>
          </ul>
          <p className="mt-2">This data is stored only on the machine running the CookieIQ server. It is not transmitted to any external service. You can delete all server-side data by removing the <code className="px-1 py-0.5 rounded bg-stone-100 font-mono text-xs">cookieiq.db</code> file.</p>
        </section>

        <section>
          <h3 className="text-base font-semibold text-stone-900 mb-2">Managing your data</h3>
          <div className="space-y-3">
            <div>
              <p className="font-medium text-stone-900">Clear browser storage:</p>
              <p className="mt-1">Open your browser's Developer Tools → Application → Local Storage → select the CookieIQ origin → click "Clear All". This removes all cached profiles, recent searches, and scan data from your browser.</p>
            </div>
            <div>
              <p className="font-medium text-stone-900">Clear server storage:</p>
              <p className="mt-1">Stop the CookieIQ server and delete <code className="px-1 py-0.5 rounded bg-stone-100 font-mono text-xs">cookieiq.db</code> from the project root. Restart the server — a fresh database will be created.</p>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-base font-semibold text-stone-900 mb-2">Changes to this policy</h3>
          <p>We may update this Cookie Policy when new storage mechanisms are added. Changes will be reflected in the "Last updated" date.</p>
        </section>
      </div>
    </div>
  );
}
