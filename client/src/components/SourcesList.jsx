import React, { useState } from 'react';

export default function SourcesList({ sources = [], websites = [] }) {
  const [open, setOpen] = useState(false);
  return (
    <section>
      <button
        onClick={() => setOpen(o => !o)}
        className="text-sm font-semibold uppercase tracking-wide text-stone-500 hover:text-stone-700 flex items-center gap-2"
      >
        <span>{open ? '▾' : '▸'}</span> Sources & references ({sources.length + websites.length})
      </button>
      {open && (
        <div className="mt-3 space-y-4">
          {sources.length > 0 && (
            <div className="space-y-2">
              {sources.map((s, i) => (
                <div key={i} className="text-sm">
                  <a href={s.url} target="_blank" rel="noreferrer" className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
                    {s.name}
                  </a>
                  {s.snippet && <p className="text-stone-600 dark:text-stone-400 mt-0.5">{s.snippet}</p>}
                </div>
              ))}
            </div>
          )}
          {websites.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase text-stone-500 mb-1.5">Websites using this cookie</h4>
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-stone-500 border-b border-stone-200 dark:border-stone-800">
                  <tr><th className="py-1.5">Domain</th><th>Category assigned</th><th>Source</th></tr>
                </thead>
                <tbody>
                  {websites.map((w, i) => (
                    <tr key={i} className="border-b border-stone-100 dark:border-stone-900">
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
      )}
    </section>
  );
}
