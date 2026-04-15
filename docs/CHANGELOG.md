# Changelog

All notable changes to CookieIQ are documented here. Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.1.0] — 2026-04-15
Initial release. Full-stack scaffold built from spec.

### Added
- **Lookup tab** — single-input cookie/vendor research powered by Claude (`claude-haiku-4-5`) with the `web_search` tool. Renders a structured cookie profile: header (name, vendor, recommended category, confidence, consent indicator), profile details grid, impact analysis (severity-coded), category distribution bar chart, recommendation panel, legal & regulatory justification, sources & "websites using this cookie" table.
- **Contextual chat panel** — appears below the cookie profile. Auto-generates 4 follow-up question chips on profile load. Maintains session-only chat history. Renders basic markdown (bold, inline code, line breaks).
- **Scan tab** — Puppeteer-driven site scanner. Harvests cookies, localStorage/sessionStorage keys, and third-party tracker hosts. ~100-cookie local lookup table classifies known cookies (GA, Meta, Hotjar, DoubleClick, LinkedIn, TikTok, Microsoft Clarity, Adobe, Segment, Stripe, Cloudflare, OneTrust, TrustArc, etc.). Filterable summary table + CSV exports (raw scan + TrustArc import format). "Research all unknowns" batch action.
- **TrustArc gap analysis** — drag-drop CSV inventory parser (PapaParse, client-side). Diff into three buckets: not in TrustArc, stale entries, miscategorized. Remediation CSV export.
- **History tab** — per-domain scan history persisted to SQLite (`better-sqlite3`). Diff view shows added/removed/changed cookies between the two most recent scans. Click any row in the latest scan report to expand a details panel with a "Research this cookie →" action that round-trips to the Lookup tab. Re-scan now button. Daily/weekly monitoring schedule (driven by `node-cron`).
- **Search bar sync** — research triggered from anywhere (search bar, recent chips, scan tables, history details) populates the search input and pushes onto the recent-searches list.
- **Dark mode** toggle.
- **Options menu** (kebab) on the cookie profile for "Copy profile as JSON" and "Export as PDF report".

### Cost optimizations
- Switched from `claude-sonnet-4` to `claude-haiku-4-5` (~3× cheaper).
- Trimmed research system prompt from ~750 tokens to ~280.
- Reduced research `max_tokens` (4096 → 2500) and `web_search.max_uses` (8 → 2).
- Compacted chat context to ~10-field profile subset.
- Reduced chat `max_tokens` (1500 → 800 reply, 250 suggestions).

### Fixed
- Defensive normalization of chat suggestion shape — handles both `["..."]` and `[{question: "..."}]` model outputs.
