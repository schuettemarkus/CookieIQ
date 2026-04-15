import React from 'react';
import { SEVERITY_PILL, SEVERITY_ICON, SEVERITY_BG } from '../lib.js';

export default function ImpactAnalysis({ items = [] }) {
  if (!items.length) return null;
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
        What breaks if this cookie doesn't fire
      </h3>
      <div className="space-y-2">
        {items.map((it, idx) => (
          <div key={idx} className="flex gap-3 p-3 rounded-md border border-stone-200 dark:border-stone-800">
            <div
              className="flex-shrink-0 w-9 h-9 rounded-md flex items-center justify-center text-lg"
              style={{ background: SEVERITY_BG[it.severity] || SEVERITY_BG.None, color: '#3b3b3b' }}
            >
              {SEVERITY_ICON[it.severity] || '•'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold">{it.impact}</span>
                <span className={SEVERITY_PILL[it.severity] || SEVERITY_PILL.None}>{it.severity}</span>
                {it.affectedParty && (
                  <span className="text-xs text-stone-500">· {it.affectedParty}</span>
                )}
              </div>
              {it.detail && <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">{it.detail}</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
