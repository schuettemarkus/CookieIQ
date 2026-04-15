import React, { useState, useEffect, useRef } from 'react';
import CategoryBadge from './CategoryBadge.jsx';
import CategoryChart from './CategoryChart.jsx';
import ImpactAnalysis from './ImpactAnalysis.jsx';
import LegalCase from './LegalCase.jsx';
import SourcesList from './SourcesList.jsx';

export default function CookieProfile({ profile }) {
  if (!profile) return null;
  const total = Object.values(profile.categoryBreakdown || {}).reduce((a, b) => a + b, 0);
  const recPct = total > 0
    ? Math.round((catCount(profile.categoryBreakdown, profile.recommendedCategory) / total) * 100)
    : 0;

  return (
    <article className="card p-6 space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-mono font-semibold">{profile.cookieName}</h2>
          <div className="text-sm text-stone-500 mt-1">
            {profile.vendor}
            {profile.vendorUrl && (
              <> · <a href={profile.vendorUrl} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">{profile.vendorUrl}</a></>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CategoryBadge category={profile.recommendedCategory} />
          <span className="pill pill-unknown">Confidence: {profile.confidenceLevel}</span>
          <span className="pill pill-unknown">Consent: {profile.consentRequired ? 'Required' : 'Not required'}</span>
        </div>
      </header>

      <section className="grid sm:grid-cols-2 gap-3 text-sm">
        <Field label="Purpose" value={profile.purpose} />
        <Field label="Duration" value={profile.duration} />
        <Field label="Cookie type" value={profile.cookieType} />
        <Field label="Domain" value={profile.domain} mono />
        <Field label="Third party" value={profile.thirdParty ? 'Yes' : 'No'} />
        <div>
          <div className="text-xs text-stone-500 uppercase">Data collected</div>
          <div className="flex flex-wrap gap-1 mt-1">
            {(profile.dataCollected || []).map((d, i) => (
              <span key={i} className="pill pill-unknown">{d}</span>
            ))}
          </div>
        </div>
      </section>

      <ImpactAnalysis items={profile.impactAnalysis} />
      <CategoryChart breakdown={profile.categoryBreakdown} />

      <section className="rounded-md p-4" style={{ background: '#FAEEDA', color: '#5b3300' }}>
        <div className="text-sm font-semibold">Recommended category: {profile.recommendedCategory}</div>
        <div className="text-sm mt-1">
          We found that {recPct}% of websites categorize this cookie as {profile.recommendedCategory}.
        </div>
        <div className="text-xs mt-2">
          Confidence: <span className="font-medium">{profile.confidenceLevel}</span> — {profile.confidenceReason}
        </div>
      </section>

      <LegalCase profile={profile} />
      <SourcesList sources={profile.sources} websites={profile.websitesUsingThisCookie} />

      {profile.notes && (
        <section>
          <div className="text-xs text-stone-500 uppercase">Notes</div>
          <p className="text-sm mt-1">{profile.notes}</p>
        </section>
      )}

      <footer className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-stone-200 dark:border-stone-800 no-print">
        <OptionsMenu profile={profile} />
        <div className="text-xs text-stone-500">
          {(profile.sources || []).length} sources · researched {new Date(profile.lastResearched).toLocaleString()}
        </div>
      </footer>
    </article>
  );
}

function OptionsMenu({ profile }) {
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
        <div className="absolute left-0 bottom-full mb-1 w-56 card shadow-lg z-10 py-1">
          <MenuItem onClick={() => { navigator.clipboard.writeText(JSON.stringify(profile, null, 2)); setOpen(false); }}>
            Copy profile as JSON
          </MenuItem>
          <MenuItem onClick={() => { window.print(); setOpen(false); }}>
            Export as PDF report
          </MenuItem>
        </div>
      )}
    </div>
  );
}

function MenuItem({ children, onClick }) {
  return (
    <button onClick={onClick}
      className="w-full text-left px-3 py-2 text-sm hover:bg-stone-100 dark:hover:bg-stone-800">
      {children}
    </button>
  );
}

function Field({ label, value, mono }) {
  return (
    <div>
      <div className="text-xs text-stone-500 uppercase">{label}</div>
      <div className={mono ? 'font-mono text-xs' : ''}>{value || '—'}</div>
    </div>
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
