import React, { useState, useEffect } from 'react';
import { api, downloadCSV, CATEGORY_PILL } from '../lib.js';
import CategoryBadge from './CategoryBadge.jsx';
import LoadingSteps from './LoadingSteps.jsx';
import GapAnalysis from './GapAnalysis.jsx';
import ComplianceScorecard from './ComplianceScorecard.jsx';

const SCAN_STEPS = [
  'Launching browser...',
  'Loading page...',
  'Harvesting cookies...',
  'Identifying vendors...',
];

export default function SiteScanner({ onResearchCookie, initialResult }) {
  const [url, setUrl] = useState('');
  const [depth, setDepth] = useState('homepage');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [filter, setFilter] = useState('All');
  const [hideKnown, setHideKnown] = useState(false);
  const [hideNecessary, setHideNecessary] = useState(false);
  const [didInit, setDidInit] = useState(false);

  useEffect(() => {
    if (initialResult && !didInit) {
      setResult(initialResult);
      setUrl(initialResult.domain ? 'https://' + initialResult.domain : '');
      setDidInit(true);
    }
  }, [initialResult, didInit]);

  const scan = async () => {
    setError(''); setResult(null);
    let target = url.trim();
    if (!target) return;
    if (!/^https?:\/\//i.test(target)) target = 'https://' + target;
    setUrl(target);
    setBusy(true);
    try {
      const data = await api('/api/scan', { method: 'POST', body: { url: target, depth } });
      setResult(data);
      try { localStorage.setItem('cookieiq.lastScan', JSON.stringify(data)); } catch {}
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const cookies = result?.cookies || [];
  const counts = {
    Total: cookies.length,
    Advertising: cookies.filter(c => c.suggestedCategory === 'Advertising').length,
    Analytics: cookies.filter(c => c.suggestedCategory === 'Analytics/Performance').length,
    Functional: cookies.filter(c => c.suggestedCategory === 'Functional').length,
    Uncategorized: cookies.filter(c => c.suggestedCategory === 'Unknown').length,
  };
  const visible = cookies.filter(c => {
    if (filter !== 'All' && c.suggestedCategory !== filter) return false;
    if (hideKnown && c.knownCookie) return false;
    if (hideNecessary && c.suggestedCategory === 'Strictly Necessary') return false;
    return true;
  });

  const researchUnknowns = async () => {
    const unknowns = cookies.filter(c => c.suggestedCategory === 'Unknown');
    for (const c of unknowns) {
      try { await onResearchCookie(c.name); } catch {}
    }
  };

  return (
    <div className="space-y-4">
      <div className="card p-4 space-y-3">
        <form onSubmit={e => { e.preventDefault(); scan(); }} className="flex flex-wrap gap-2 items-center">
          <input
            className="input flex-1 min-w-[260px]"
            placeholder="example.com"
            value={url}
            onChange={e => setUrl(e.target.value)}
            disabled={busy}
          />
          <button type="submit" className="btn-primary" disabled={busy || !url.trim()}>
            {busy ? 'Scanning…' : 'Scan site'}
          </button>
        </form>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-stone-500">
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input type="checkbox" className="accent-blue-500 rounded" checked={depth === 'crawl'} onChange={e => setDepth(e.target.checked ? 'crawl' : 'homepage')} disabled={busy} />
            <span>Crawl internal pages</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input type="checkbox" className="accent-blue-500 rounded" checked={hideKnown} onChange={e => setHideKnown(e.target.checked)} />
            <span>Hide known cookies</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input type="checkbox" className="accent-blue-500 rounded" checked={hideNecessary} onChange={e => setHideNecessary(e.target.checked)} />
            <span>Hide strictly necessary</span>
          </label>
        </div>
      </div>

      {busy && <LoadingSteps steps={SCAN_STEPS} />}
      {error && <div className="card p-4 text-sm text-red-600">{error}</div>}

      {result && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {Object.entries(counts).map(([k, v]) => (
              <div key={k} className="card p-3">
                <div className="text-xs text-stone-500 uppercase">{k}</div>
                <div className="text-2xl font-mono">{v}</div>
              </div>
            ))}
          </div>

          <div className="card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 border-b border-stone-200">
              <div className="flex flex-wrap gap-1.5">
                {['All', ...Object.keys(CATEGORY_PILL)].map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={'text-xs px-2.5 py-1 rounded-full transition-all ' + (filter === f ? 'bg-blue-50 text-blue-700 font-medium' : 'bg-stone-100 text-stone-600 hover:bg-stone-200')}>
                    {f}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button className="btn" onClick={researchUnknowns} disabled={counts.Uncategorized === 0}>
                  Research all unknowns
                </button>
                <button className="btn" onClick={() => downloadCSV(`${result.domain}-scan.csv`, cookies)}>
                  Export scan CSV
                </button>
                <button className="btn" onClick={() => downloadCSV(`${result.domain}-trustarc.csv`, cookies.map(c => ({
                  'Cookie Name': c.name,
                  'Category': c.suggestedCategory,
                  'Duration': c.duration,
                  'Vendor': c.vendor || '',
                  'Description': '',
                  'Domain': c.domain,
                })))}>
                  Export TrustArc import CSV
                </button>
              </div>
            </div>

            <table className="w-full text-sm">
              <thead className="text-left text-xs text-stone-500 border-b border-stone-200">
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th>Vendor</th>
                  <th>Duration</th>
                  <th>Category</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((c, i) => (
                  <tr key={i} className={
                    'border-b border-stone-100 ' +
                    (c.suggestedCategory === 'Unknown' ? 'bg-[#FAECE7]/40' : '')
                  }>
                    <td className="px-3 py-2 font-mono text-xs">{c.name}</td>
                    <td>{c.vendor || <span className="text-stone-400">—</span>}</td>
                    <td className="text-xs">{c.duration}</td>
                    <td><CategoryBadge category={c.suggestedCategory} /></td>
                    <td className="px-3 text-right">
                      <button onClick={() => onResearchCookie(c.name)} className="text-xs text-blue-600 hover:underline">
                        {c.suggestedCategory === 'Unknown' ? 'Needs research →' : 'View profile →'}
                      </button>
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr><td colSpan="5" className="px-3 py-6 text-center text-sm text-stone-500">No cookies match this filter.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <ComplianceScorecard cookies={cookies} />
          <GapAnalysis scanCookies={cookies} />
        </>
      )}
    </div>
  );
}
