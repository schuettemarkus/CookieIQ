import React, { useEffect, useState } from 'react';
import { api } from '../lib.js';

const CATEGORIES = [
  { id: 'advertising', label: 'Advertising' },
  { id: 'analytics',   label: 'Analytics' },
  { id: 'functional',  label: 'Functional' },
  { id: 'necessary',   label: 'Necessary' },
];

const LEVEL_STYLE = {
  red:   { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500', label: 'Enforcement' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Proposed' },
  green: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Stable' },
};

const ALERT_STYLE = {
  high:   { bg: 'bg-red-50', border: 'border-l-red-400', icon: '🔴' },
  medium: { bg: 'bg-amber-50', border: 'border-l-amber-400', icon: '🟡' },
  low:    { bg: 'bg-blue-50', border: 'border-l-blue-400', icon: '🔵' },
};

export default function RegulatoryMap() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const d = await api('/api/regulatory');
      setData(d);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    try {
      const d = await api('/api/regulatory/refresh', { method: 'POST' });
      setData(d);
    } catch (err) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12">
        <div className="card p-8 max-w-3xl mx-auto flex items-center justify-center gap-3">
          <div className="flex gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-sm text-stone-500">Scanning global regulatory landscape...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12">
        <div className="card p-6 max-w-3xl mx-auto text-sm text-red-600">{error}</div>
      </div>
    );
  }

  if (!data?.jurisdictions) return null;

  const jurisdictions = data.jurisdictions || [];
  const alerts = data.alerts || [];

  // Count pressure levels across all jurisdictions.
  let redCount = 0, amberCount = 0;
  jurisdictions.forEach(j => {
    Object.values(j.categories || {}).forEach(c => {
      if (c.level === 'red') redCount++;
      if (c.level === 'amber') amberCount++;
    });
  });

  return (
    <div className="py-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Regulatory Weather Map</h2>
          <p className="text-xs text-stone-500 mt-0.5">Global cookie & privacy regulation pressure by jurisdiction</p>
        </div>
        <div className="flex items-center gap-3">
          {data._updatedAt && (
            <span className="text-[10px] text-stone-400">
              Updated {new Date(data._updatedAt).toLocaleDateString()}
              {data._stale && ' (refreshing...)'}
            </span>
          )}
          <button onClick={refresh} disabled={refreshing}
            className="btn text-xs">
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="text-3xl font-bold text-red-600">{redCount}</div>
          <div className="text-xs text-stone-500 mt-1">Active enforcement zones</div>
        </div>
        <div className="card p-5">
          <div className="text-3xl font-bold text-amber-600">{amberCount}</div>
          <div className="text-xs text-stone-500 mt-1">Proposed changes</div>
        </div>
        <div className="card p-5">
          <div className="text-3xl font-bold text-stone-800">{jurisdictions.length}</div>
          <div className="text-xs text-stone-500 mt-1">Jurisdictions tracked</div>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">Recent alerts</h3>
          <div className="space-y-2">
            {alerts.map((a, i) => {
              const style = ALERT_STYLE[a.severity] || ALERT_STYLE.low;
              return (
                <div key={i} className={`rounded-xl shadow-sm ${style.bg} border-l-4 ${style.border} px-4 py-3`}>
                  <div className="flex items-start gap-2">
                    <span className="text-sm">{style.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-stone-800">{a.title}</span>
                        {a.date && <span className="text-[10px] text-stone-400">{new Date(a.date).toLocaleDateString()}</span>}
                      </div>
                      <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">{a.detail}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Heat map grid */}
      <div className="card overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1fr_repeat(4,100px)] bg-stone-50 border-b border-stone-100 text-[10px] font-semibold uppercase tracking-wider text-stone-500">
          <div className="px-4 py-3">Jurisdiction</div>
          {CATEGORIES.map(c => (
            <div key={c.id} className="px-2 py-3 text-center">{c.label}</div>
          ))}
        </div>

        {/* Rows */}
        {jurisdictions.map((j, i) => {
          const isOpen = expanded === j.id;
          return (
            <div key={j.id}>
              <button
                onClick={() => setExpanded(isOpen ? null : j.id)}
                className={'w-full grid grid-cols-[1fr_repeat(4,100px)] items-center border-b border-stone-50 hover:bg-stone-50/50 transition-all ' +
                  (isOpen ? 'bg-stone-50/50' : '')}
              >
                <div className="px-4 py-3 text-left flex items-center gap-2">
                  <span className="text-base">{j.flag}</span>
                  <div>
                    <div className="text-sm font-medium text-stone-800">{j.name}</div>
                    <div className="text-[10px] text-stone-400">{j.headline}</div>
                  </div>
                </div>
                {CATEGORIES.map(cat => {
                  const cell = j.categories?.[cat.id];
                  if (!cell) return <div key={cat.id} className="px-2 py-3" />;
                  const s = LEVEL_STYLE[cell.level] || LEVEL_STYLE.green;
                  return (
                    <div key={cat.id} className="px-2 py-3 flex justify-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium ${s.bg} ${s.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </button>

              {/* Expanded detail */}
              {isOpen && (
                <div className="px-6 py-4 bg-stone-50/30 border-b border-stone-100 space-y-3">
                  <div className="grid sm:grid-cols-2 gap-3">
                    {CATEGORIES.map(cat => {
                      const cell = j.categories?.[cat.id];
                      if (!cell) return null;
                      const s = LEVEL_STYLE[cell.level] || LEVEL_STYLE.green;
                      return (
                        <div key={cat.id} className={`rounded-xl p-3 ${s.bg}`}>
                          <div className={`text-xs font-semibold ${s.text} mb-1`}>{cat.label}</div>
                          <p className="text-xs text-stone-700 leading-relaxed">{cell.summary}</p>
                          {cell.developments?.length > 0 && (
                            <ul className="mt-2 space-y-0.5">
                              {cell.developments.map((d, di) => (
                                <li key={di} className="text-[10px] text-stone-600 flex items-start gap-1">
                                  <span className="mt-0.5">·</span><span>{d}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-xs text-stone-500">
        {Object.entries(LEVEL_STYLE).map(([key, s]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
            <span>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
