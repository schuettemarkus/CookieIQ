# CookieIQ

Cookie research & categorization intelligence for privacy engineers, DPOs, and legal teams.

> Built with React + Vite, Express, Puppeteer, SQLite, node-cron, and the Anthropic Claude API (`claude-haiku-4-5`) with `web_search`.

📚 **Docs**: [Wiki](docs/WIKI.md) · [FAQ](docs/FAQ.md) · [Changelog](docs/CHANGELOG.md) · [Contributing](docs/CONTRIBUTING.md) · [Security](docs/SECURITY.md)

## Setup

```bash
# from /cookieiq
npm run install:all          # installs root + client deps
cp .env .env.local 2>/dev/null || true
# edit .env and set ANTHROPIC_API_KEY
npm run dev                  # starts client (5173) + server (3001)
```

Open http://localhost:5173.

### Environment

`/.env` (server-only — never exposed to the client):

```
ANTHROPIC_API_KEY=sk-ant-...
PORT=3001
```

### Puppeteer / Chromium

Puppeteer downloads its own Chromium on `npm install`. On Linux you may need extra system libraries (`apt install -y libnss3 libatk-bridge2.0-0 libxkbcommon0 libgbm1 libasound2`). On macOS no extra setup is required.

## Tabs

1. **Cookie lookup** — manual cookie/vendor search. Calls `POST /api/research`, which uses Claude (`claude-sonnet-4-20250514`) with the `web_search` tool to look up cookiepedia.co.uk, vendor privacy policies, ICO guidance, and how other sites categorize the cookie. Returns a structured profile plus an interactive chat panel.

2. **Site scanner** — paste a URL, Puppeteer launches headless Chromium and harvests cookies, localStorage/sessionStorage keys, and third-party tracker hosts. Known cookies are auto-classified via a local lookup table (~100 vendors). Unknown cookies surface a "Needs research" link that round-trips to `/api/research`. Includes a TrustArc gap-analysis panel: drop in your TrustArc inventory CSV to see which cookies are missing, stale, or miscategorized.

3. **Scan history** — every scan is persisted to SQLite. Per-domain diff view shows added / removed / changed cookies between the two most recent scans. Schedule daily or weekly re-scans (driven by `node-cron`).

## TrustArc CSV export

In your TrustArc Cookie Manager: **Inventory → Export CSV**. The expected column headers are `Cookie Name, Category, Duration, Vendor, Description, Domain`. CookieIQ also produces a remediation CSV in the same format.

## API

| Route | Method | Description |
| --- | --- | --- |
| `/api/research` | POST | `{ query }` → cookie profile JSON |
| `/api/chat` | POST | `{ messages, cookieProfile, generateSuggestions? }` |
| `/api/scan` | POST | `{ url, depth: 'homepage' \| 'crawl' }` |
| `/api/history` | GET | List of scanned domains |
| `/api/history/:domain` | GET | Latest scans + diff |
| `/api/history/:domain/schedule` | POST | `{ url, frequency: 'daily' \| 'weekly' }` |
