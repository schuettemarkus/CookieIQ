# FAQ

### What is CookieIQ for?
Cookie research and categorization for privacy engineers, DPOs, and legal teams. It looks up cookies, scans live sites, diffs your TrustArc inventory against reality, and tracks drift over time.

### Who should *not* use it?
End users. The chat panel and JSON output assume you know what GDPR Article 6, "consent gating," and "Functional vs Strictly Necessary" mean.

### Why Claude / why an LLM at all?
Cookie classification is a long-tail problem: there are thousands of niche tracking cookies and most don't appear in any public registry. The LLM (with `web_search`) reads cookiepedia, vendor privacy policies, ICO guidance, and other sites' cookie banners on demand — far more current than any static database.

### Is my Anthropic API key sent to the browser?
No. The key is read from `.env` server-side only. The browser only sees `/api/*`.

### Why is the first research call slow (10–60s)?
Each call runs up to 2 web search rounds. Web search is the bottleneck. Output is JSON-only so streaming wouldn't visibly help — wait for the full response.

### I refreshed and got a 429 rate-limit error. What happened?
You probably triggered the request twice. The original call kept running on the server even after the browser disconnected, then your retry hit the 30K-input-tokens-per-minute cap. Wait 60s and try once.

### How do I raise the rate limit?
Add billing credit at https://console.anthropic.com/settings/billing — that bumps you out of the free tier and the limits scale.

### Why Haiku and not Sonnet?
Haiku 4.5 is ~3× cheaper and handles structured-JSON cookie classification well. Sonnet is overkill here. Swap in `server/anthropic.js` if you disagree.

### Why does the scanner sometimes miss cookies?
Three reasons:
1. **Consent gating** — many cookies only fire after the user accepts. We attempt to dismiss known banners, but bespoke CMPs slip through.
2. **Lazy/SPA loads** — third-party scripts that fire on user interaction (scroll, click) won't appear in a passive scan.
3. **First-party cookies set server-side** are detected, but those set only on follow-up navigation may need `depth: crawl`.

### What's the difference between "Category" and the Lookup recommendation?
- **Category** in the scan report is the local-lookup classification (instant, deterministic, ~100 known cookies).
- The **Lookup tab recommendation** is the model's full analysis with sources and legal justification. Use it when the local table says "Unknown" or you want documentation-grade reasoning.

### Can I bulk-research all unknown cookies on a scan?
Yes — the Scan tab has a "Research all unknowns" button. Each cookie costs one API call, so be mindful of rate limits.

### Where does the SQLite DB live?
`./cookieiq.db` (project root). Not committed. To reset history, stop the server and `rm cookieiq.db`.

### Is the scheduled monitoring reliable?
The cron tick runs hourly *while the server process is alive*. There is no daemonization. For production, run under a process manager (pm2, systemd) and consider externalizing to a real scheduler.

### Why doesn't my `.env` change take effect?
`node --watch` only watches `.js`. Restart the dev server after editing `.env`.

### Can I use this on competitor sites?
Scanning publicly accessible pages is generally fine. Don't try to defeat anti-bot systems and don't crawl behind auth without permission. Standard scraping etiquette applies.

### Is there a CSV import path *back* into TrustArc?
Yes — the Scan tab exports a TrustArc-compatible CSV (Cookie Name, Category, Duration, Vendor, Description, Domain). The Gap Analysis panel exports a remediation CSV with `add` / `remove` / `recategorize` actions.

### What happens to my data?
SQLite file lives on your machine. Cookie scan results and TrustArc CSVs never leave your environment. The only outbound calls are to the Anthropic API (research/chat) and the target sites (scanner).
