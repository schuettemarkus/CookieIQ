# Security

## Reporting a vulnerability

Email security findings privately to the repo owner via GitHub. Do not open public issues for security concerns. Expect an acknowledgement within a few business days.

## Threat model

CookieIQ is a single-user / small-team developer tool. It is **not** designed to be exposed publicly. Notable trust assumptions:

- The Express server is bound to localhost only by default.
- The Anthropic API key lives in `.env` and is read at process start. Anyone with shell access on the host can read it.
- SQLite history (`cookieiq.db`) is unencrypted on disk.
- Puppeteer launches a real browser. Don't point the scanner at sites you don't have authorization to scan.

If you deploy this beyond localhost, add: auth on `/api/*`, HTTPS termination, key rotation, and rate limiting.

## API key hygiene

- **Never commit `.env`.** It's already in `.gitignore`.
- **Rotate immediately** if a key is ever pasted into chat, screenshots, logs, or shared screens. Anthropic console → API Keys → delete + recreate.
- Prefer per-environment keys (one for dev, one for staging) so you can revoke independently.

## Dependencies

`npm audit` is run on PRs. Two moderate advisories from `puppeteer` transitives are currently accepted (no upgrade path without a Puppeteer major bump). Re-evaluate quarterly.

## Data handling

- Scan results stay local in SQLite.
- TrustArc CSV uploads are parsed client-side and never sent to the server.
- The only outbound destinations are the Anthropic API and the user-supplied scan target.
