# CookieIQ Wiki

Architecture, data model, and operational reference.

---

## Architecture

```
┌────────────┐   /api/*    ┌───────────────────┐
│  Vite/React│ ──────────► │  Express server    │
│  client    │             │  (port 3001)       │
│  :5173     │             ├───────────────────┤
└────────────┘             │  routes/research   │──► Anthropic API + web_search
                           │  routes/chat       │──► Anthropic API
                           │  routes/scan       │──► Puppeteer (headless Chromium)
                           │  routes/history    │──► better-sqlite3
                           │  cron tick (hourly)│──► due schedules → scan + persist
                           └───────────────────┘
                                     │
                                     ▼
                           cookieiq.db (SQLite)
```

### Why this shape

- **API key never reaches the client.** All Anthropic calls go through Express. The browser only talks to `/api/*`.
- **SQLite chosen over Postgres** because scan history is local-first, write-light, and we need zero ops to demo the tool. `better-sqlite3` is synchronous and fast.
- **Puppeteer over fetch+regex** because real consent banners require JS execution to fire (or not fire) cookies. Network-level inspection alone misses `document.cookie` writes and `localStorage`.
- **Local lookup table** (`server/cookieLookup.js`) handles the most common ~100 cookies instantly. The LLM is reserved for the long tail and for full legal analysis.

---

## Data model

### `scans`
| column | type | notes |
| --- | --- | --- |
| `id` | INTEGER PK | autoincrement |
| `domain` | TEXT | normalized hostname |
| `scanned_at` | TEXT | ISO timestamp |
| `cookie_snapshot` | TEXT (JSON) | array of cookie objects (see "Scan cookie shape") |

Indexed on `domain`.

### `schedules`
| column | type | notes |
| --- | --- | --- |
| `id` | INTEGER PK | |
| `domain` | TEXT UNIQUE | |
| `url` | TEXT | full URL passed to Puppeteer |
| `frequency` | TEXT | `daily` or `weekly` |
| `last_run_at` | TEXT | ISO timestamp, nullable |

The hourly cron tick (`server/index.js`) reads `schedules`, filters to those past their interval, runs a scan, and updates `last_run_at`.

### Scan cookie shape (in `cookie_snapshot`)
```json
{
  "name": "_ga",
  "domain": ".example.com",
  "duration": "2.0 years",
  "type": "HTTP Cookie",
  "vendor": "Google Analytics",
  "preConsent": true,
  "suggestedCategory": "Analytics/Performance",
  "knownCookie": true
}
```

---

## API reference

| Route | Method | Body | Returns |
| --- | --- | --- | --- |
| `/api/research` | POST | `{ query }` | Full cookie profile JSON (see prompt) |
| `/api/chat` | POST | `{ messages, cookieProfile, generateSuggestions? }` | `{ reply }` or `{ suggestions: [...] }` |
| `/api/scan` | POST | `{ url, depth: 'homepage' \| 'crawl' }` | `{ domain, cookies: [...] }` |
| `/api/history` | GET | — | `{ domains: [{ domain, scan_count, last_scanned_at }] }` |
| `/api/history/:domain` | GET | — | `{ domain, scans, latest, previous, diff }` |
| `/api/history/:domain/schedule` | POST | `{ url, frequency }` | `{ ok: true }` |
| `/api/health` | GET | — | `{ ok: true }` |

---

## Cost & rate-limit notes

- Free-tier Anthropic accounts cap at **30,000 input tokens/min**. `web_search` results inflate input tokens fast — each search round can pull in 5–10K tokens of search snippets.
- CookieIQ caps `web_search.max_uses` at **2** for this reason. Bumping it improves recall but burns the budget.
- A single research call now runs ~5–10K input tokens + 2.5K output tokens on Haiku.
- The chat panel sends a compact 10-field profile (not the full JSON) as system context to keep follow-ups cheap.

---

## Local development

```bash
npm run install:all
# edit .env → ANTHROPIC_API_KEY=sk-ant-...
npm run dev
```

`node --watch server/index.js` reloads on JS changes only. **`.env` changes require a manual restart.**

Vite dev server runs on `5173`, falls back to `5174` if taken. The proxy forwards `/api/*` to `:3001`.

---

## Puppeteer caveats

- First `npm install` downloads its own Chromium (~150 MB). On Linux you may need `libnss3 libatk-bridge2.0-0 libxkbcommon0 libgbm1 libasound2`.
- The scanner sets a desktop Chrome user agent. Some sites serve different cookie sets to mobile UA — adjust if needed.
- `page.cookies()` returns only HTTP cookies. `localStorage` and `sessionStorage` are read separately via `page.evaluate`.
- "Pre-consent" detection is best-effort: the scanner snapshots cookies, then attempts to click a known-selectors list of consent banners, then re-snapshots. False negatives are common on bespoke CMP implementations.

---

## Cookie lookup table

`server/cookieLookup.js` ships ~100 entries spanning major analytics, advertising, social, support, payment, and CMP vendors. Prefix matching handles dynamic IDs (`_ga_<id>`, `_hjSession_<id>`, `AMCV_<id>`, `mp_<id>`).

Adding a vendor:
1. Edit `COOKIE_LOOKUP` (cookie-name → `{ vendor, suggestedCategory }`).
2. Edit `VENDOR_DOMAINS` if you also want network-level pixel detection.
3. Restart the server.

---

## Scheduled monitoring

A single `node-cron` job runs every hour at minute 0. It reads `schedules`, filters to those past their `frequency` interval, runs a scan, persists the snapshot, and logs the diff. The cron tick is the only place where new scans happen automatically — there is no other background work.
