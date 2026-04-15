import React, { useEffect, useState } from 'react';
import { api } from '../lib.js';
import CategoryBadge from './CategoryBadge.jsx';

export default function ScanHistory({ onResearchCookie }) {
  const [domains, setDomains] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [scheduling, setScheduling] = useState(false);
  const [frequency, setFrequency] = useState('weekly');
  const [showReport, setShowReport] = useState(false);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => { loadDomains(); }, []);
  const loadDomains = () => api('/api/history').then(d => setDomains(d.domains || []));

  useEffect(() => {
    if (!selected) return;
    api('/api/history/' + selected).then(setDetail);
  }, [selected]);

  const rescan = async () => {
    if (!selected) return;
    await api('/api/scan', { method: 'POST', body: { url: 'https://' + selected, depth: 'homepage' } });
    const d = await api('/api/history/' + selected);
    setDetail(d);
    loadDomains();
  };

  const saveSchedule = async () => {
    await api(`/api/history/${selected}/schedule`, {
      method: 'POST', body: { url: 'https://' + selected, frequency },
    });
    setScheduling(false);
  };

  if (!domains.length) {
    return <div className="card p-6 text-sm text-stone-500">No scans yet. Run a scan in the Site scanner tab to populate history.</div>;
  }

  return (
    <div className="grid md:grid-cols-[260px_1fr] gap-4">
      <aside className="card overflow-hidden">
        <div className="px-3 py-2 text-xs uppercase text-stone-500 border-b border-stone-200 dark:border-stone-800">Domains</div>
        <ul>
          {domains.map(d => (
            <li key={d.domain}>
              <button onClick={() => setSelected(d.domain)}
                className={'w-full text-left px-3 py-2 text-sm border-b border-stone-100 dark:border-stone-900 ' +
                  (selected === d.domain ? 'bg-stone-100 dark:bg-stone-800' : 'hover:bg-stone-50 dark:hover:bg-stone-900')}>
                <div className="font-mono text-xs">{d.domain}</div>
                <div className="text-xs text-stone-500">{d.scan_count} scans · last {new Date(d.last_scanned_at).toLocaleDateString()}</div>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="space-y-4">
        {!detail && <div className="card p-6 text-sm text-stone-500">Select a domain.</div>}
        {detail && (
          <>
            <div className="card p-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-mono">{detail.domain}</div>
                <div className="text-xs text-stone-500">{detail.scans.length} scans</div>
              </div>
              <div className="flex gap-2">
                <button className="btn" onClick={() => setShowReport(s => !s)}>
                  {showReport ? 'Hide scan report' : `View scan report (${detail.latest.length})`}
                </button>
                <button className="btn" onClick={rescan}>Re-scan now</button>
                <button className="btn" onClick={() => setScheduling(s => !s)}>Set up monitoring</button>
              </div>
            </div>

            {scheduling && (
              <div className="card p-4 flex items-center gap-2">
                <span className="text-sm">Frequency:</span>
                <select className="input w-auto" value={frequency} onChange={e => setFrequency(e.target.value)}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
                <button className="btn-primary" onClick={saveSchedule}>Save schedule</button>
              </div>
            )}

            {showReport && (
              <div className="card overflow-hidden">
                <div className="px-3 py-2 text-xs uppercase text-stone-500 border-b border-stone-200 dark:border-stone-800">
                  Latest scan — {new Date(detail.scans[0]?.scanned_at).toLocaleString()}
                </div>
                <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs text-stone-500 border-b border-stone-200 dark:border-stone-800">
                    <tr>
                      <th className="px-3 py-2">Name</th>
                      <th>Vendor</th>
                      <th>Domain</th>
                      <th>Duration</th>
                      <th>Type</th>
                      <th>Known</th>
                      <th>Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.latest.map((c, i) => {
                      const isOpen = expanded === i;
                      return (
                        <React.Fragment key={i}>
                          <tr
                            onClick={() => setExpanded(isOpen ? null : i)}
                            className={
                              'border-b border-stone-100 dark:border-stone-900 cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-900 ' +
                              (c.suggestedCategory === 'Unknown' ? 'bg-[#FAECE7]/30 ' : '') +
                              (isOpen ? 'bg-stone-100 dark:bg-stone-800' : '')
                            }
                          >
                            <td className="px-3 py-2 font-mono text-xs">
                              <span className="inline-block w-3 text-stone-400">{isOpen ? '▾' : '▸'}</span> {c.name}
                            </td>
                            <td>{c.vendor || <span className="text-stone-400">—</span>}</td>
                            <td className="font-mono text-xs text-stone-500">{c.domain}</td>
                            <td className="text-xs">{c.duration}</td>
                            <td className="text-xs">{c.type}</td>
                            <td className="text-xs">{c.knownCookie ? '✓' : <span className="text-stone-400">?</span>}</td>
                            <td><CategoryBadge category={c.suggestedCategory} /></td>
                          </tr>
                          {isOpen && (
                            <tr className="bg-stone-50 dark:bg-stone-900/50 border-b border-stone-200 dark:border-stone-800">
                              <td colSpan={7} className="px-6 py-4">
                                <CookieDetails cookie={c} onResearch={() => onResearchCookie(c.name)} />
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
                </div>
              </div>
            )}

            <DiffSection title="NEW" tone="coral" items={detail.diff.added} render={c => (
              <span><span className="font-mono text-xs">{c.name}</span> · {c.vendor || 'unknown vendor'} · {c.suggestedCategory}</span>
            )} />
            <DiffSection title="GONE" tone="gray" items={detail.diff.removed} render={c => (
              <span><span className="font-mono text-xs">{c.name}</span> · {c.vendor || 'unknown vendor'}</span>
            )} />
            <DiffSection title="CHANGED" tone="amber" items={detail.diff.changed} render={c => (
              <span><span className="font-mono text-xs">{c.name}</span> · {c.field}: <strong>{c.from}</strong> → <strong>{c.to}</strong></span>
            )} />
          </>
        )}
      </section>
    </div>
  );
}

function CookieDetails({ cookie, onResearch }) {
  const fields = [
    ['Name', cookie.name, true],
    ['Vendor', cookie.vendor || '—'],
    ['Domain', cookie.domain, true],
    ['Type', cookie.type],
    ['Duration', cookie.duration],
    ['Pre-consent', cookie.preConsent ? 'Yes — fired before consent interaction' : 'No'],
    ['Known cookie', cookie.knownCookie ? 'Yes — matched local lookup table' : 'No — unrecognized'],
    ['Local-lookup category', cookie.suggestedCategory],
  ];
  return (
    <div className="space-y-3">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
        {fields.map(([label, value, mono]) => (
          <div key={label}>
            <div className="text-[10px] uppercase text-stone-500 tracking-wide">{label}</div>
            <div className={mono ? 'font-mono text-xs break-all' : 'text-sm'}>{value}</div>
          </div>
        ))}
      </div>
      <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between">
        <div className="text-xs text-stone-500">
          For full legal & regulatory analysis, run a full lookup.
        </div>
        <button onClick={onResearch} className="btn-primary text-xs">
          Research this cookie →
        </button>
      </div>
    </div>
  );
}

function DiffSection({ title, tone, items, render }) {
  const toneCls = {
    coral: 'border-l-4 border-l-[#993C1D] bg-[#FAECE7]/40',
    gray:  'border-l-4 border-l-stone-400 bg-stone-50 dark:bg-stone-900',
    amber: 'border-l-4 border-l-[#854F0B] bg-[#FAEEDA]/40',
  }[tone];
  return (
    <div className={'card p-4 ' + toneCls}>
      <div className="text-xs uppercase font-semibold mb-2">{title} ({items.length})</div>
      {items.length === 0 ? (
        <div className="text-xs text-stone-500">No changes.</div>
      ) : (
        <ul className="space-y-1 text-sm">
          {items.map((it, i) => <li key={i}>{render(it)}</li>)}
        </ul>
      )}
    </div>
  );
}
