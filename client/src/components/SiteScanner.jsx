import React, { useState } from 'react';
import { api, downloadCSV, CATEGORY_PILL } from '../lib.js';
import CategoryBadge from './CategoryBadge.jsx';
import LoadingSteps from './LoadingSteps.jsx';
import GapAnalysis from './GapAnalysis.jsx';

const SCAN_STEPS = [
  'Launching browser...',
  'Loading page...',
  'Harvesting cookies...',
  'Identifying vendors...',
];

export default function SiteScanner({ onResearchCookie }) {
  const [url, setUrl] = useState('');
  const [depth, setDepth] = useState('homepage');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [filter, setFilter] = useState('All');

  const scan = async () => {
    setError(''); setResult(null);
    if (!url) return;
    setBusy(true);
    try {
      const data = await api('/api/scan', { method: 'POST', body: { url, depth } });
      setResult(data);
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
  const visible = filter === 'All' ? cookies : cookies.filter(c => c.suggestedCategory === filter);

  const researchUnknowns = async () => {
    const unknowns = cookies.filter(c => c.suggestedCategory === 'Unknown');
    for (const c of unknowns) {
      try { await onResearchCookie(c.name); } catch {}
    }
  };

  return (
    <div className="space-y-4">
      <div className="card p-4 flex flex-wrap gap-2 items-center">
        <input
          className="input flex-1 min-w-[260px]"
          placeholder="https://example.com"
          value={url}
          onChange={e => setUrl(e.target.value)}
          disabled={busy}
        />
        <select className="input w-auto" value={depth} onChange={e => setDepth(e.target.value)} disabled={busy}>
          <option value="homepage">Homepage only</option>
          <option value="crawl">Full crawl</option>
        </select>
        <button onClick={scan} className="btn-primary" disabled={busy || !url}>
          {busy ? 'Scanning…' : 'Scan site'}
        </button>
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
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 border-b border-stone-200 dark:border-stone-800">
              <div className="flex flex-wrap gap-1.5">
                {['All', ...Object.keys(CATEGORY_PILL)].map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={'text-xs px-2 py-1 rounded-full ' + (filter === f ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900' : 'bg-stone-100 dark:bg-stone-800')}>
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
              <thead className="text-left text-xs text-stone-500 border-b border-stone-200 dark:border-stone-800">
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
                    'border-b border-stone-100 dark:border-stone-900 ' +
                    (c.suggestedCategory === 'Unknown' ? 'bg-[#FAECE7]/40' : '')
                  }>
                    <td className="px-3 py-2 font-mono text-xs">{c.name}</td>
                    <td>{c.vendor || <span className="text-stone-400">—</span>}</td>
                    <td className="text-xs">{c.duration}</td>
                    <td><CategoryBadge category={c.suggestedCategory} /></td>
                    <td className="px-3 text-right">
                      <button onClick={() => onResearchCookie(c.name)} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
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

          <GapAnalysis scanCookies={cookies} />
        </>
      )}
    </div>
  );
}
