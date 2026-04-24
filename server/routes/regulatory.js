import { Router } from 'express';
import { client, MODEL, extractText, extractJSON } from '../anthropic.js';
import { db } from '../db.js';

const router = Router();

// Create cache table.
db.exec(`
  CREATE TABLE IF NOT EXISTS regulatory_cache (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    data TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

const SYSTEM_PROMPT = `You are a regulatory intelligence analyst specializing in global cookie and privacy law.

Search for the LATEST regulatory developments, enforcement actions, proposed legislation, and DPA guidance affecting cookies and tracking technologies. Focus on news from the last 3 months.

Return ONLY valid JSON (no markdown) with this structure:

{
  "asOf": "ISO date",
  "jurisdictions": [
    {
      "id": "eu",
      "name": "European Union",
      "flag": "🇪🇺",
      "categories": {
        "analytics": { "level": "amber", "summary": "short description of current regulatory pressure", "developments": ["specific development 1", "development 2"] },
        "advertising": { "level": "red", "summary": "...", "developments": ["..."] },
        "functional": { "level": "green", "summary": "...", "developments": ["..."] },
        "necessary": { "level": "green", "summary": "...", "developments": ["..."] }
      },
      "headline": "One-line overall assessment"
    }
  ],
  "alerts": [
    { "severity": "high|medium|low", "title": "short title", "detail": "1-2 sentences", "jurisdiction": "id", "category": "analytics|advertising|functional|necessary", "date": "ISO date" }
  ]
}

Levels: "red" = active enforcement/fines/bans, "amber" = proposed legislation/guidance/investigations, "green" = stable/no pressure.

You MUST include these jurisdictions (search for recent developments in each):
- EU (European Union — GDPR, ePrivacy, DMA)
- UK (ICO, UK GDPR, PECR)
- US-CA (California — CCPA/CPRA)
- US-CO (Colorado Privacy Act)
- US-CT (Connecticut Data Privacy Act)
- BR (Brazil — LGPD)
- CA (Canada — PIPEDA/Bill C-27)
- AU (Australia — Privacy Act reform)
- JP (Japan — APPI)
- KR (South Korea — PIPA)
- IN (India — DPDP Act)
- CH (Switzerland — nDSG)

Include 3-8 alerts for the most significant recent developments globally.
Be specific — cite actual DPA names, fine amounts, company names, bill numbers.`;

async function fetchRegulatory() {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 }],
    messages: [{ role: 'user', content: 'What are the latest global regulatory developments affecting cookies, tracking, and consent as of today? Search for recent enforcement actions, new legislation, and DPA guidance. Return ONLY the JSON object, no other text.' }],
  });
  const text = extractText(message);
  try {
    return extractJSON(text);
  } catch (e) {
    // If full parse fails, try a second pass asking the model to fix it.
    console.error('[regulatory] JSON parse failed, attempting repair. Raw length:', text.length);
    const repair = await client.messages.create({
      model: MODEL,
      max_tokens: 4000,
      system: 'Convert the following text into valid JSON matching the structure described. Return ONLY the JSON, no markdown, no preamble, no <cite> tags.',
      messages: [{ role: 'user', content: text }],
    });
    return extractJSON(extractText(repair));
  }
}

function getCached() {
  const row = db.prepare('SELECT data, updated_at FROM regulatory_cache WHERE id = 1').get();
  if (!row) return null;
  const age = Date.now() - new Date(row.updated_at).getTime();
  const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
  return { data: JSON.parse(row.data), updatedAt: row.updated_at, stale: age > ONE_WEEK };
}

function saveCache(data) {
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO regulatory_cache (id, data, updated_at) VALUES (1, ?, ?)
    ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
  `).run(JSON.stringify(data), now);
}

router.get('/', async (_req, res) => {
  try {
    const cached = getCached();
    if (cached && !cached.stale) {
      return res.json({ ...cached.data, _cached: true, _updatedAt: cached.updatedAt });
    }
    // Return stale data immediately but refresh in background.
    if (cached) {
      res.json({ ...cached.data, _cached: true, _stale: true, _updatedAt: cached.updatedAt });
      fetchRegulatory().then(saveCache).catch(err => console.error('[regulatory] bg refresh failed:', err.message));
      return;
    }
    // First fetch ever.
    const data = await fetchRegulatory();
    saveCache(data);
    res.json({ ...data, _cached: false, _updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('[regulatory]', err);
    res.status(500).json({ error: err.message || 'Failed to fetch regulatory data' });
  }
});

// Force refresh.
router.post('/refresh', async (_req, res) => {
  try {
    const data = await fetchRegulatory();
    saveCache(data);
    res.json({ ...data, _cached: false, _updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('[regulatory]', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
