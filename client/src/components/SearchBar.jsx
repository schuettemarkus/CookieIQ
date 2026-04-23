import React, { useState, useEffect } from 'react';

const HISTORY_KEY = 'cookieiq.recent';

function readRecent() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
}

export function pushRecent(value) {
  const v = String(value || '').trim();
  if (!v) return;
  const next = [v, ...readRecent().filter(r => r !== v)].slice(0, 5);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('cookieiq:recent-changed'));
}

export default function SearchBar({ onSearch, loading, query }) {
  const [q, setQ] = useState('');
  const [recent, setRecent] = useState(readRecent);

  useEffect(() => {
    const sync = () => setRecent(readRecent());
    window.addEventListener('cookieiq:recent-changed', sync);
    return () => window.removeEventListener('cookieiq:recent-changed', sync);
  }, []);

  // External query (e.g. clicked from scan report) populates the input.
  useEffect(() => {
    if (query !== undefined && query !== null) setQ(query);
  }, [query]);

  const submit = (value) => {
    const v = (value ?? q).trim();
    if (!v) return;
    pushRecent(v);
    onSearch(v);
  };

  return (
    <div className="space-y-3">
      <form onSubmit={e => { e.preventDefault(); submit(); }} className="flex gap-2">
        <input
          className="input font-mono"
          placeholder="Enter a cookie name or vendor (e.g. _ga, _fbp, Hotjar, DoubleClick...)"
          value={q}
          onChange={e => setQ(e.target.value)}
          disabled={loading}
        />
        <button type="submit" className="btn-primary whitespace-nowrap" disabled={loading || !q.trim()}>
          {loading ? 'Researching…' : 'Research'}
        </button>
      </form>
      {recent.length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="text-stone-500 self-center">Recent:</span>
          {recent.map(r => (
            <button key={r} onClick={() => { setQ(r); submit(r); }}
              className="rounded-full bg-white shadow-sm border-0 px-3 py-1 text-xs font-mono hover:shadow-md transition-all">
              {r}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
