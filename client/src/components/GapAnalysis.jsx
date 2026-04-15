import React, { useState } from 'react';
import Papa from 'papaparse';
import { downloadCSV } from '../lib.js';

const CATEGORY_NORMALIZE = s => (s || '').toLowerCase().replace(/[^a-z]/g, '');

export default function GapAnalysis({ scanCookies }) {
  const [inventory, setInventory] = useState(null);
  const [error, setError] = useState('');

  const onFile = (file) => {
    setError('');
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data, errors }) => {
        if (errors?.length) {
          setError('CSV parse error. Expected columns: Cookie Name, Category, Duration, Vendor, Description, Domain.');
          return;
        }
        const normalized = data.map(r => ({
          name: r['Cookie Name'] || r.name || r.cookie_name || '',
          category: r['Category'] || r.category || '',
          vendor: r['Vendor'] || r.vendor || '',
          duration: r['Duration'] || r.duration || '',
        })).filter(r => r.name);
        if (!normalized.length) {
          setError('No rows recognized. Expected a header row with at least "Cookie Name" and "Category".');
          return;
        }
        setInventory(normalized);
      },
      error: () => setError('Could not read file'),
    });
  };

  if (!inventory) {
    return (
      <div className="card p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-500 mb-2">
          TrustArc sync & gap analysis
        </h3>
        <label className="block border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-lg p-6 text-center cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-900">
          <input type="file" accept=".csv" className="hidden" onChange={e => e.target.files[0] && onFile(e.target.files[0])} />
          <div className="text-sm">Drop TrustArc cookie inventory CSV here</div>
          <div className="text-xs text-stone-500 mt-1">Export from TrustArc Cookie Manager → Inventory → Export CSV</div>
        </label>
        {error && <div className="text-sm text-red-600 mt-2">{error}</div>}
      </div>
    );
  }

  const invByName = Object.fromEntries(inventory.map(i => [i.name, i]));
  const scanByName = Object.fromEntries(scanCookies.map(c => [c.name, c]));

  const notInTrustArc = scanCookies.filter(c => !invByName[c.name]);
  const stale = inventory.filter(i => !scanByName[i.name]);
  const miscategorized = scanCookies
    .filter(c => invByName[c.name])
    .filter(c => CATEGORY_NORMALIZE(invByName[c.name].category) !== CATEGORY_NORMALIZE(c.suggestedCategory))
    .map(c => ({ name: c.name, oldCategory: invByName[c.name].category, newCategory: c.suggestedCategory }));

  const exportRemediation = () => {
    const rows = [
      ...notInTrustArc.map(c => ({ action: 'add', name: c.name, category: c.suggestedCategory, vendor: c.vendor || '', duration: c.duration, domain: c.domain })),
      ...stale.map(i => ({ action: 'remove', name: i.name, category: i.category, vendor: i.vendor, duration: i.duration, domain: '' })),
      ...miscategorized.map(m => ({ action: 'recategorize', name: m.name, category: m.newCategory, vendor: '', duration: '', domain: '' })),
    ];
    downloadCSV('trustarc-remediation.csv', rows);
  };

  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
          TrustArc sync & gap analysis
        </h3>
        <div className="flex gap-2">
          <button className="btn" onClick={() => setInventory(null)}>Upload different CSV</button>
          <button className="btn-primary" onClick={exportRemediation}>Export TrustArc remediation CSV</button>
        </div>
      </div>

      <Bucket title="Not in TrustArc" tone="red" empty="Every detected cookie is already inventoried.">
        {notInTrustArc.map(c => (
          <li key={c.name} className="font-mono text-xs">{c.name} <span className="text-stone-500">— {c.suggestedCategory}</span></li>
        ))}
      </Bucket>
      <Bucket title="Stale entries" tone="gray" empty="Every TrustArc entry is still detected on the site.">
        {stale.map(i => (
          <li key={i.name} className="font-mono text-xs">{i.name} <span className="text-stone-500">— inventoried as {i.category}</span></li>
        ))}
      </Bucket>
      <Bucket title="Miscategorized" tone="amber" empty="No category mismatches.">
        {miscategorized.map(m => (
          <li key={m.name} className="font-mono text-xs">
            {m.name} — In TrustArc as <strong>{m.oldCategory}</strong> → Should be <strong>{m.newCategory}</strong>
            <button className="ml-2 text-blue-600 dark:text-blue-400 hover:underline">Fix</button>
          </li>
        ))}
      </Bucket>
    </div>
  );
}

function Bucket({ title, tone, empty, children }) {
  const toneMap = {
    red:    'border-red-300 bg-red-50/50 dark:bg-red-950/20',
    gray:   'border-stone-300 bg-stone-50 dark:bg-stone-900',
    amber:  'border-amber-300 bg-amber-50/50 dark:bg-amber-950/20',
  };
  const items = React.Children.toArray(children);
  return (
    <div className={'rounded-md border p-3 ' + toneMap[tone]}>
      <div className="text-xs font-semibold uppercase mb-2">{title} ({items.length})</div>
      {items.length ? <ul className="space-y-1">{items}</ul> : <div className="text-xs text-stone-500">{empty}</div>}
    </div>
  );
}
