import React, { useState, useEffect, useRef } from 'react';
import CategoryBadge from './CategoryBadge.jsx';
import CategoryChart from './CategoryChart.jsx';
import ImpactAnalysis from './ImpactAnalysis.jsx';
import LegalCase from './LegalCase.jsx';
import SourcesList from './SourcesList.jsx';

export default function CookieProfile({ profile, onRefresh }) {
  if (!profile) return null;
  const total = Object.values(profile.categoryBreakdown || {}).reduce((a, b) => a + b, 0);
  const recPct = total > 0
    ? Math.round((catCount(profile.categoryBreakdown, profile.recommendedCategory) / total) * 100)
    : 0;

  return (
    <div className="space-y-4">
      {/* Recommendation callout */}
      <section className="rounded-2xl bg-amber-50/60 shadow-sm p-6">
        <div className="flex items-baseline justify-between flex-wrap gap-2">
          <div className="text-xs uppercase font-semibold tracking-wide text-amber-700">
            Recommended category
          </div>
          <div className="text-xs text-stone-500">based on {total} reference{total === 1 ? '' : 's'}</div>
        </div>
        <div className="mt-2 flex items-center gap-3 flex-wrap">
          <span className="text-xl font-semibold">{profile.recommendedCategory}</span>
          <CategoryBadge category={profile.recommendedCategory} />
          <span className="text-sm text-stone-500">— {recPct}% of sources agree</span>
        </div>
        {profile.confidenceReason && (
          <p className="mt-3 text-sm leading-relaxed text-stone-700">
            <span className="font-medium">{profile.confidenceLevel} confidence:</span> {profile.confidenceReason}
          </p>
        )}
      </section>

      <article className="card overflow-hidden">
        {/* Header */}
        <header className="px-6 pt-6 pb-5 border-b border-stone-100">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-3xl font-mono font-semibold tracking-tight break-all">{profile.cookieName}</h2>
              <div className="text-sm text-stone-500 mt-2">
                {profile.vendor}
                {profile.vendorUrl && (
                  <> · <a href={profile.vendorUrl} target="_blank" rel="noreferrer"
                      className="text-blue-600 hover:underline">{profile.vendorUrl}</a></>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <CategoryBadge category={profile.recommendedCategory} />
              <span className="pill pill-unknown">Confidence: {profile.confidenceLevel}</span>
              <span className={'pill ' + (profile.consentRequired ? 'pill-advertising' : 'pill-necessary')}>
                {profile.consentRequired ? 'Consent required' : 'No consent needed'}
              </span>
            </div>
          </div>
        </header>

        {/* Accordion sections */}
        <div className="divide-y divide-stone-100">
          <Accordion title="Cookie Details" count={6}>
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
              <Field label="Purpose" value={profile.purpose} wide />
              <Field label="Duration" value={profile.duration} />
              <Field label="Cookie type" value={profile.cookieType} />
              <Field label="Domain" value={profile.domain} mono />
              <Field label="Third party" value={profile.thirdParty ? 'Yes' : 'No'} />
              <div className="sm:col-span-2">
                <Label>Data collected</Label>
                <div className="flex flex-wrap gap-1.5">
                  {(profile.dataCollected || []).map((d, i) => (
                    <span key={i} className="pill pill-unknown">{d}</span>
                  ))}
                </div>
              </div>
            </div>
          </Accordion>

          <Accordion
            title="Impact Analysis"
            subtitle="What breaks if this cookie doesn't fire"
            count={(profile.impactAnalysis || []).length}
          >
            <ImpactAnalysis items={profile.impactAnalysis} />
          </Accordion>

          <Accordion title="Category Distribution" count={total}>
            <CategoryChart breakdown={profile.categoryBreakdown} />
          </Accordion>

          <Accordion title="Legal & Regulatory" subtitle="GDPR, ePrivacy, CCPA justification">
            <LegalCase profile={profile} />
          </Accordion>

          <Accordion
            title="Sources & References"
            count={(profile.sources || []).length + (profile.websitesUsingThisCookie || []).length}
          >
            <SourcesContent sources={profile.sources} websites={profile.websitesUsingThisCookie} />
          </Accordion>

          {profile.notes && (
            <Accordion title="Notes">
              <p className="text-sm leading-relaxed text-stone-700">{profile.notes}</p>
            </Accordion>
          )}
        </div>

        {/* Footer */}
        <footer className="px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 bg-stone-50 rounded-b-2xl no-print">
          <OptionsMenu profile={profile} onRefresh={onRefresh} />
          <div className="text-xs text-stone-500">
            {(profile.sources || []).length} sources · researched {new Date(profile.lastResearched).toLocaleString()}
          </div>
        </footer>
      </article>
    </div>
  );
}

function Accordion({ title, subtitle, count, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full px-6 py-4 flex items-center justify-between gap-3 hover:bg-stone-50/50 transition-all group"
      >
        <div className="flex items-center gap-3 min-w-0">
          <svg
            className={'w-4 h-4 text-stone-400 transition-transform duration-200 shrink-0 ' + (open ? 'rotate-90' : '')}
            fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
          <span className="text-sm font-semibold text-stone-800 group-hover:text-stone-900">{title}</span>
          {subtitle && <span className="text-xs text-stone-400 hidden sm:inline">· {subtitle}</span>}
        </div>
        {count !== undefined && (
          <span className="text-[10px] font-medium text-stone-400 bg-stone-100 rounded-full px-2 py-0.5 shrink-0">
            {count}
          </span>
        )}
      </button>
      {open && (
        <div className="px-6 pb-5 pt-1">
          {children}
        </div>
      )}
    </div>
  );
}

function SourcesContent({ sources = [], websites = [] }) {
  return (
    <div className="space-y-4">
      {sources.length > 0 && (
        <div className="space-y-2">
          {sources.map((s, i) => (
            <div key={i} className="text-sm">
              <a href={s.url} target="_blank" rel="noreferrer" className="font-medium text-blue-600 hover:underline">
                {s.name}
              </a>
              {s.snippet && <p className="text-stone-500 mt-0.5">{s.snippet}</p>}
            </div>
          ))}
        </div>
      )}
      {websites.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase text-stone-500 mb-1.5">Websites using this cookie</h4>
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-stone-500 border-b border-stone-100">
              <tr><th className="py-1.5">Domain</th><th>Category assigned</th><th>Source</th></tr>
            </thead>
            <tbody>
              {websites.map((w, i) => (
                <tr key={i} className="border-b border-stone-50">
                  <td className="py-1.5 font-mono text-xs">{w.domain}</td>
                  <td>{w.categoryAssigned}</td>
                  <td className="text-xs text-stone-500">{w.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Label({ children }) {
  return <div className="text-[10px] uppercase tracking-wider text-stone-500 mb-1.5">{children}</div>;
}

function Field({ label, value, mono, wide }) {
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <Label>{label}</Label>
      <div className={(mono ? 'font-mono text-xs break-all ' : 'text-sm leading-relaxed ')}>
        {value || <span className="text-stone-400">—</span>}
      </div>
    </div>
  );
}

function OptionsMenu({ profile, onRefresh }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const close = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button className="btn" onClick={() => setOpen(o => !o)} aria-label="More options">
        <span className="text-lg leading-none">⋯</span>
      </button>
      {open && (
        <div className="absolute left-0 bottom-full mb-1 w-56 bg-white rounded-xl shadow-lg z-10 py-1">
          <MenuItem onClick={() => { navigator.clipboard.writeText(JSON.stringify(profile, null, 2)); setOpen(false); }}>
            Copy profile as JSON
          </MenuItem>
          <MenuItem onClick={() => { window.print(); setOpen(false); }}>
            Export as PDF report
          </MenuItem>
          {onRefresh && (
            <MenuItem onClick={() => { onRefresh(); setOpen(false); }}>
              Refresh research (re-query)
            </MenuItem>
          )}
        </div>
      )}
    </div>
  );
}

function MenuItem({ children, onClick }) {
  return (
    <button onClick={onClick}
      className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 transition-all">
      {children}
    </button>
  );
}

function catCount(breakdown = {}, recommended) {
  const map = {
    'Strictly Necessary': 'StrictlyNecessary',
    'Functional': 'Functional',
    'Analytics/Performance': 'AnalyticsPerformance',
    'Advertising': 'Advertising',
  };
  return breakdown[map[recommended]] || 0;
}
