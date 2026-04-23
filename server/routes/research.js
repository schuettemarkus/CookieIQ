import { Router } from 'express';
import { client, MODEL, extractText, extractJSON } from '../anthropic.js';

const router = Router();

const SYSTEM_PROMPT = `You are CookieIQ — an expert on cookie compliance, GDPR, ePrivacy, and CCPA.
Use web_search to look up: cookiepedia.co.uk, cookiedatabase.org, and cookiesearch.org for the cookie.
Also search the vendor's privacy policy and how major websites categorize this cookie.
Return ONLY valid JSON (no markdown, no preamble) with this exact shape:

{
  "cookieName": "string",
  "vendor": "string",
  "vendorUrl": "string",
  "purpose": "string",
  "duration": "string",
  "cookieType": "string",
  "domain": "string",
  "dataCollected": ["..."],
  "thirdParty": true,
  "sources": [{ "name": "string", "url": "string", "snippet": "string" }],
  "websitesUsingThisCookie": [{ "domain": "string", "categoryAssigned": "string", "source": "string" }],
  "categoryBreakdown": { "StrictlyNecessary": 0, "Functional": 0, "AnalyticsPerformance": 0, "Advertising": 0, "Unknown": 0 },
  "recommendedCategory": "Strictly Necessary | Functional | Analytics/Performance | Advertising",
  "confidenceLevel": "High | Medium | Low",
  "confidenceReason": "string",
  "impactAnalysis": [{ "impact": "string", "severity": "High | Medium | Low | None", "affectedParty": "string", "detail": "string" }],
  "legalCase": "string (2-3 sentences citing GDPR Art 5/6, ePrivacy, ICO, CCPA)",
  "gdprLawfulBasis": "string",
  "consentRequired": true,
  "consentReason": "string",
  "notes": "string",
  "lastResearched": "ISO timestamp"
}

Severity: High = revenue/key journeys broken, Medium = degraded UX/reporting, Low = minor gaps, None = no breakage.
Always include at least one "None" impact row. categoryBreakdown counts must reflect what you found.`;

router.post('/', async (req, res) => {
  const { query } = req.body || {};
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'query is required' });
  }
  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 2500,
      system: SYSTEM_PROMPT,
      tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 4 }],
      messages: [{ role: 'user', content: `Research: ${query}` }],
    });
    const text = extractText(message);
    const profile = extractJSON(text);
    if (!profile.lastResearched) profile.lastResearched = new Date().toISOString();
    res.json(profile);
  } catch (err) {
    console.error('[research]', err);
    res.status(500).json({ error: err.message || 'Research failed' });
  }
});

export default router;
