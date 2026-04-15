import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const db = new Database(path.join(__dirname, '..', 'cookieiq.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS scans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    domain TEXT NOT NULL,
    scanned_at TEXT NOT NULL,
    cookie_snapshot TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_scans_domain ON scans(domain);

  CREATE TABLE IF NOT EXISTS schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    domain TEXT NOT NULL UNIQUE,
    url TEXT NOT NULL,
    frequency TEXT NOT NULL,
    last_run_at TEXT
  );
`);

export function recordScan(domain, cookies) {
  return db.prepare(
    'INSERT INTO scans (domain, scanned_at, cookie_snapshot) VALUES (?, ?, ?)'
  ).run(domain, new Date().toISOString(), JSON.stringify(cookies));
}

export function getScans(domain) {
  return db.prepare(
    'SELECT id, domain, scanned_at, cookie_snapshot FROM scans WHERE domain = ? ORDER BY scanned_at DESC'
  ).all(domain).map(r => ({ ...r, cookies: JSON.parse(r.cookie_snapshot) }));
}

export function listDomains() {
  return db.prepare(`
    SELECT domain, COUNT(*) AS scan_count, MAX(scanned_at) AS last_scanned_at
    FROM scans GROUP BY domain ORDER BY last_scanned_at DESC
  `).all();
}

export function diffScans(prev, curr) {
  const byName = arr => Object.fromEntries(arr.map(c => [c.name + '|' + c.domain, c]));
  const a = byName(prev || []);
  const b = byName(curr || []);
  const added = [], removed = [], changed = [];
  for (const k of Object.keys(b)) if (!a[k]) added.push(b[k]);
  for (const k of Object.keys(a)) if (!b[k]) removed.push(a[k]);
  for (const k of Object.keys(b)) {
    if (!a[k]) continue;
    for (const field of ['duration', 'domain', 'suggestedCategory', 'vendor']) {
      if (a[k][field] !== b[k][field]) {
        changed.push({ name: b[k].name, field, from: a[k][field], to: b[k][field] });
      }
    }
  }
  return { added, removed, changed };
}

export function getDueSchedules() {
  const rows = db.prepare('SELECT * FROM schedules').all();
  const now = Date.now();
  return rows.filter(r => {
    if (!r.last_run_at) return true;
    const last = new Date(r.last_run_at).getTime();
    const interval = r.frequency === 'daily' ? 86400e3 : 7 * 86400e3;
    return now - last >= interval;
  });
}

export function upsertSchedule(domain, url, frequency) {
  return db.prepare(`
    INSERT INTO schedules (domain, url, frequency) VALUES (?, ?, ?)
    ON CONFLICT(domain) DO UPDATE SET url = excluded.url, frequency = excluded.frequency
  `).run(domain, url, frequency);
}
