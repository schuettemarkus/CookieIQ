export const CATEGORY_PILL = {
  'Strictly Necessary': 'pill pill-necessary',
  'Functional':         'pill pill-functional',
  'Analytics/Performance': 'pill pill-analytics',
  'Advertising':        'pill pill-advertising',
  'Unknown':            'pill pill-unknown',
};

export const SEVERITY_PILL = {
  High:   'pill pill-high',
  Medium: 'pill pill-medium',
  Low:    'pill pill-low',
  None:   'pill pill-none',
};

export const SEVERITY_ICON = { High: '✕', Medium: '⚠', Low: '✓', None: '✓' };
export const SEVERITY_BG = {
  High:   '#FAECE7',
  Medium: '#FAEEDA',
  Low:    '#EAF3DE',
  None:   '#EAF3DE',
};

const API_BASE = import.meta.env.VITE_API_URL || '';

export async function api(path, opts = {}, _retries = 0) {
  const res = await fetch(API_BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.error || `Request failed (${res.status})`;
    // Auto-retry rate limits up to 2 times with backoff.
    if (res.status === 429 || msg.includes('rate_limit')) {
      if (_retries < 2) {
        const wait = ((_retries + 1) * 15) + Math.random() * 5;
        await new Promise(r => setTimeout(r, wait * 1000));
        return api(path, opts, _retries + 1);
      }
      throw new Error('Rate limit reached — too many requests. Wait a moment and try again.');
    }
    throw new Error(msg);
  }
  return data;
}

export function downloadCSV(filename, rows) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = v => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const csv = [headers.join(','), ...rows.map(r => headers.map(h => escape(r[h])).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
