import { Router } from 'express';
import { client, MODEL, extractText, extractJSON } from '../anthropic.js';

const router = Router();

const SYSTEM_PROMPT = `You are CookieIQ — an expert on cookie compliance, GDPR, ePrivacy, and CCPA.

Research the cookie or vendor thoroughly. Perform MULTIPLE web searches:
1. Search cookiepedia.co.uk for the cookie
2. Search cookiedatabase.org for the cookie
3. Search the vendor's official documentation or privacy policy
4. Search for how major websites categorize this cookie in their cookie policies
5. Search for ICO or CNIL guidance on this type of cookie

You MUST populate the "sources" array with every distinct source you find — aim for 5+ sources.
Each source must have a real "url" that you found during search.
The "websitesUsingThisCookie" array should have at least 5 entries if this is a common cookie.

Return ONLY valid JSON (no markdown, no preamble) with this exact shape:

{
  "cookieName": "string",
  "vendor": "string",
  "vendorUrl": "string",
  "purpose": "string — detailed description, 2-3 sentences",
  "duration": "string",
  "cookieType": "string",
  "domain": "string",
  "dataCollected": ["array of specific data types collected"],
  "thirdParty": true,
  "sources": [{ "name": "string", "url": "string — must be a real URL you found", "snippet": "string — what this source says about the cookie" }],
  "websitesUsingThisCookie": [{ "domain": "string", "categoryAssigned": "string", "source": "string — URL where you found this" }],
  "categoryBreakdown": { "StrictlyNecessary": 0, "Functional": 0, "AnalyticsPerformance": 0, "Advertising": 0, "Unknown": 0 },
  "recommendedCategory": "Strictly Necessary | Functional | Analytics/Performance | Advertising",
  "confidenceLevel": "High | Medium | Low",
  "confidenceReason": "string",
  "impactAnalysis": [{ "impact": "string", "severity": "High | Medium | Low | None", "affectedParty": "string", "detail": "string" }],
  "legalCase": "string (3-5 sentences citing GDPR Art 5/6, ePrivacy Directive, ICO guidance, CCPA, and relevant DPA decisions)",
  "gdprLawfulBasis": "string",
  "consentRequired": true,
  "consentReason": "string",
  "notes": "string — caveats, implementation variations, or important context",
  "lastResearched": "ISO timestamp"
}

Severity: High = revenue/key journeys broken, Medium = degraded UX/reporting, Low = minor gaps, None = no breakage.
Always include at least one "None" impact row. categoryBreakdown counts must reflect actual data found.`;

router.post('/', async (req, res) => {
  const { query } = req.body || {};
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'query is required' });
  }
  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 8 }],
      messages: [{ role: 'user', content: `Research this cookie or vendor thoroughly: ${query}` }],
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
