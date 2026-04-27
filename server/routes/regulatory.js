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

const SYSTEM_PROMPT = `You are a regulatory intelligence analyst. Return ONLY valid JSON (no markdown, no preamble).

JSON structure:
{"asOf":"ISO date","jurisdictions":[{"id":"string","name":"string","flag":"emoji","categories":{"analytics":{"level":"red|amber|green","summary":"short","developments":["..."]},"advertising":{...},"functional":{...},"necessary":{...}},"headline":"one line"}],"alerts":[{"severity":"high|medium|low","title":"short","detail":"1-2 sentences","jurisdiction":"id","category":"string","date":"ISO date"}]}

Levels: red=enforcement/fines, amber=proposed/investigation, green=stable.
Include: EU, UK, US-CA, US-CO, BR, CA, AU, JP, IN. 3-5 alerts. Be specific with DPA names and fine amounts.`;

async function fetchRegulatory() {
  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 3000,
      system: SYSTEM_PROMPT,
      tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 3 }],
      messages: [{ role: 'user', content: 'Latest global cookie/privacy regulatory developments. Return ONLY JSON, no other text.' }],
    });
    const text = extractText(message);
    try {
      return extractJSON(text);
    } catch {
      console.error('[regulatory] JSON parse failed, attempting repair.');
      const repair = await client.messages.create({
        model: MODEL,
        max_tokens: 3000,
        system: 'Convert this into valid JSON. Return ONLY JSON, no markdown, no <cite> tags.',
        messages: [{ role: 'user', content: text }],
      });
      return extractJSON(extractText(repair));
    }
  } catch (err) {
    // Surface rate limit and API errors clearly.
    const msg = err.message || '';
    if (msg.includes('rate_limit') || msg.includes('429')) {
      throw new Error('Rate limit reached. Please wait 60 seconds and try again.');
    }
    throw err;
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
