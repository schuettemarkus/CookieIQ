import React from 'react';

const SEGMENTS = [
  { key: 'StrictlyNecessary',   label: 'Strictly Necessary',  color: '#3B6D11' },
  { key: 'Functional',          label: 'Functional',          color: '#185FA5' },
  { key: 'AnalyticsPerformance',label: 'Analytics/Performance', color: '#854F0B' },
  { key: 'Advertising',         label: 'Advertising',         color: '#993C1D' },
  { key: 'Unknown',             label: 'Unknown',             color: '#5F5E5A' },
];

export default function CategoryChart({ breakdown = {} }) {
  const total = SEGMENTS.reduce((sum, s) => sum + (breakdown[s.key] || 0), 0) || 1;
  return (
    <div className="space-y-3">
      <div className="flex h-4 w-full rounded-full overflow-hidden border border-stone-200">
        {SEGMENTS.map(s => {
          const pct = ((breakdown[s.key] || 0) / total) * 100;
          if (pct === 0) return null;
          return <div key={s.key} style={{ width: `${pct}%`, background: s.color }} title={`${s.label}: ${pct.toFixed(0)}%`} />;
        })}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
        {SEGMENTS.map(s => {
          const v = breakdown[s.key] || 0;
          const pct = ((v / total) * 100).toFixed(0);
          return (
            <div key={s.key} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} />
              <span className="text-stone-600">{s.label}</span>
              <span className="font-mono">{pct}%</span>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-stone-500">
        Based on analysis of {total} cookie policy reference{total === 1 ? '' : 's'} found online
      </p>
    </div>
  );
}
