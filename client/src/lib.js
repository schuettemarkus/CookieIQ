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

export async function api(path, opts = {}) {
  const res = await fetch(API_BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
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
