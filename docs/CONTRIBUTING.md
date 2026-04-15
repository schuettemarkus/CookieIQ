# Contributing

## Quick start
```bash
npm run install:all
cp .env .env.example  # if needed
npm run dev
```

## Project layout
- `client/` — React + Vite + Tailwind frontend
- `server/` — Express API, SQLite, Puppeteer, cron
- `server/cookieLookup.js` — local known-cookie table; PRs welcome
- `docs/` — markdown reference (this folder)

## Code style
- ES modules everywhere (`"type": "module"`).
- No semicolons-at-the-end battles — match surrounding style.
- Tailwind utility classes for styling. Reusable patterns go in `client/src/index.css` under `@layer components`.
- Don't introduce a state library — local React state is fine for this app's scope.

## Adding a known cookie
Edit `server/cookieLookup.js`:
```js
'_my_cookie': { vendor: 'My Vendor', suggestedCategory: 'Analytics/Performance' },
```
Use the prefix form (`'_mc_'`) for cookies with dynamic IDs. Restart the server.

## Adding an API route
1. Create `server/routes/<name>.js` exporting an Express router.
2. Mount it in `server/index.js`.
3. Document it in `docs/WIKI.md` under "API reference".

## Anthropic prompts
- Keep system prompts terse. Each saved token is real money on the long tail.
- Update `docs/CHANGELOG.md` if you change models or token budgets.
- Test JSON-only outputs by inspecting raw responses; the `extractJSON` helper tolerates code fences and stray prose but the goal is to produce neither.

## Pull requests
- One concern per PR.
- Update `docs/CHANGELOG.md` under an `[Unreleased]` heading.
- Verify both client and server start cleanly with `npm run dev`.
- Manually exercise the changed flow in the browser before requesting review — type checks alone don't catch UX regressions.
