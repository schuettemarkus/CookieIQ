import React, { useEffect, useRef, useState } from 'react';
import { api } from '../lib.js';
import CategoryBadge from './CategoryBadge.jsx';

export default function ScanHistory({ onResearchCookie }) {
  const [domains, setDomains] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [scheduling, setScheduling] = useState(false);
  const [frequency, setFrequency] = useState('weekly');
  const [expanded, setExpanded] = useState(null);
  const [activeTab, setActiveTab] = useState('report');

  useEffect(() => { loadDomains(); }, []);
  const loadDomains = () => api('/api/history').then(d => setDomains(d.domains || []));

  useEffect(() => {
    if (!selected) return;
    setActiveTab('report');
    setExpanded(null);
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

  if (!domains.length) return null;

  const hasDiff = detail && (detail.diff.added.length > 0 || detail.diff.removed.length > 0 || detail.diff.changed.length > 0);

  return (
    <section className="space-y-3 mt-8">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500">Scan history</h2>
      <div className="grid md:grid-cols-[240px_1fr] gap-4">
        <aside className="card overflow-hidden">
          <div className="px-4 py-2.5 text-xs uppercase text-stone-500 border-b border-stone-100 font-medium">Domains</div>
          <ul>
            {domains.map(d => (
              <li key={d.domain}>
                <button onClick={() => setSelected(d.domain)}
                  className={'w-full text-left px-4 py-2.5 text-sm border-b border-stone-50 transition-all ' +
                    (selected === d.domain ? 'bg-blue-50/60 text-blue-800' : 'hover:bg-stone-50')}>
                  <div className="font-mono text-xs">{d.domain}</div>
                  <div className="text-[10px] text-stone-500 mt-0.5">{d.scan_count} scans · {new Date(d.last_scanned_at).toLocaleDateString()}</div>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="space-y-4">
          {!detail && <div className="card p-6 text-sm text-stone-500">Select a domain.</div>}
          {detail && (
            <>
              {/* Header with options menu */}
              <div className="card p-4 flex items-center justify-between gap-3">
                <div>
                  <div className="font-mono font-medium">{detail.domain}</div>
                  <div className="text-xs text-stone-500">{detail.scans.length} scans · latest {new Date(detail.scans[0]?.scanned_at).toLocaleString()}</div>
                </div>
                <HistoryMenu
                  onRescan={rescan}
                  onSchedule={() => setScheduling(s => !s)}
                />
              </div>

              {/* Scheduling panel */}
              {scheduling && (
                <div className="card p-4 flex items-center gap-3">
                  <span className="text-sm">Frequency:</span>
                  <select className="input w-auto" value={frequency} onChange={e => setFrequency(e.target.value)}>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                  <button className="btn-primary" onClick={saveSchedule}>Save schedule</button>
                  <button className="btn" onClick={() => setScheduling(false)}>Cancel</button>
                </div>
              )}

              {/* Tabs: Report / Changes */}
              <div className="flex gap-1">
                <button onClick={() => setActiveTab('report')}
                  className={'px-3 py-1.5 rounded-full text-xs transition-all ' +
                    (activeTab === 'report' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-stone-500 hover:bg-stone-100')}>
                  Scan Report ({detail.latest.length})
                </button>
                {hasDiff && (
                  <button onClick={() => setActiveTab('diff')}
                    className={'px-3 py-1.5 rounded-full text-xs transition-all ' +
                      (activeTab === 'diff' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-stone-500 hover:bg-stone-100')}>
                    Changes ({detail.diff.added.length + detail.diff.removed.length + detail.diff.changed.length})
                  </button>
                )}
              </div>

              {/* Scan Report */}
              {activeTab === 'report' && (
                <div className="card overflow-hidden">
                  <table className="w-full text-sm table-fixed">
                    <thead className="text-left text-xs text-stone-500 border-b border-stone-100">
                      <tr>
                        <th className="px-4 py-2.5 w-[30%]">Name</th>
                        <th className="w-[18%]">Vendor</th>
                        <th className="w-[15%]">Duration</th>
                        <th className="w-[15%]">Type</th>
                        <th className="w-[8%] text-center">Known</th>
                        <th className="w-[14%]">Category</th>
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
                                'border-b border-stone-50 cursor-pointer hover:bg-stone-50 transition-colors ' +
                                (c.suggestedCategory === 'Unknown' ? 'bg-red-50/30 ' : '') +
                                (isOpen ? 'bg-blue-50/30' : '')
                              }
                            >
                              <td className="px-4 py-2.5 font-mono text-xs truncate">
                                <span className="inline-block w-3 text-stone-400 text-[10px]">{isOpen ? '▾' : '▸'}</span> {c.name}
                              </td>
                              <td className="text-xs truncate">{c.vendor || <span className="text-stone-400">—</span>}</td>
                              <td className="text-xs truncate">{c.duration}</td>
                              <td className="text-xs truncate">{c.type}</td>
                              <td className="text-xs text-center">{c.knownCookie ? '✓' : <span className="text-stone-400">?</span>}</td>
                              <td><CategoryBadge category={c.suggestedCategory} /></td>
                            </tr>
                            {isOpen && (
                              <tr className="border-b border-stone-100">
                                <td colSpan={6} className="px-4 py-4 bg-stone-50/50">
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
              )}

              {/* Changes diff */}
              {activeTab === 'diff' && (
                <div className="space-y-3">
                  <DiffSection title="NEW" tone="coral" items={detail.diff.added} render={c => (
                    <span><span className="font-mono text-xs">{c.name}</span> · {c.vendor || 'unknown vendor'} · {c.suggestedCategory}</span>
                  )} />
                  <DiffSection title="GONE" tone="gray" items={detail.diff.removed} render={c => (
                    <span><span className="font-mono text-xs">{c.name}</span> · {c.vendor || 'unknown vendor'}</span>
                  )} />
                  <DiffSection title="CHANGED" tone="amber" items={detail.diff.changed} render={c => (
                    <span><span className="font-mono text-xs">{c.name}</span> · {c.field}: <strong>{c.from}</strong> → <strong>{c.to}</strong></span>
                  )} />
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </section>
  );
}

function HistoryMenu({ onRescan, onSchedule }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const close = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)} className="btn" aria-label="Options">
        <span className="text-lg leading-none">⋯</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-lg z-10 py-1">
          <MenuBtn onClick={() => { onRescan(); setOpen(false); }}>Re-scan now</MenuBtn>
          <MenuBtn onClick={() => { onSchedule(); setOpen(false); }}>Set up monitoring</MenuBtn>
          <div className="h-px bg-stone-100 my-1" />
          <MenuBtn onClick={() => { setOpen(false); }}>Export scan CSV</MenuBtn>
          <MenuBtn onClick={() => { setOpen(false); }}>Compare scans</MenuBtn>
        </div>
      )}
    </div>
  );
}

function MenuBtn({ children, onClick }) {
  return (
    <button onClick={onClick}
      className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 transition-all">
      {children}
    </button>
  );
}

function CookieDetails({ cookie, onResearch }) {
  const sourceLabel = {
    exact: 'Curated lookup', prefix: 'Curated lookup (prefix)',
    'open-cookie-db': 'Open Cookie Database', domain: 'Domain heuristic',
    heuristic: 'Name heuristic', none: 'Unrecognized',
  }[cookie.source] || (cookie.knownCookie ? 'Known' : 'Unrecognized');

  const fields = [
    ['Name', cookie.name, true],
    ['Vendor', cookie.vendor || '—'],
    ['Domain', cookie.domain, true],
    ['Type', cookie.type],
    ['Duration', cookie.duration],
    ['Pre-consent', cookie.preConsent ? 'Yes — fired before consent' : 'No'],
    ['Category', cookie.suggestedCategory],
    ['Data source', sourceLabel],
  ];
  return (
    <div className="space-y-3">
      {cookie.description && (
        <p className="text-sm text-stone-600 leading-relaxed">{cookie.description}</p>
      )}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
        {fields.map(([label, value, mono]) => (
          <div key={label}>
            <div className="text-[10px] uppercase text-stone-500 tracking-wide">{label}</div>
            <div className={mono ? 'font-mono text-xs break-all' : 'text-sm'}>{value}</div>
          </div>
        ))}
      </div>
      <div className="pt-2 border-t border-stone-200 flex items-center justify-between">
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
    gray:  'border-l-4 border-l-stone-400 bg-stone-50',
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
