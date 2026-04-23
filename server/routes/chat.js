import { Router } from 'express';
import { client, MODEL, extractText, extractJSON } from '../anthropic.js';

const router = Router();

// Compact profile to just the fields the chat actually needs as context.
function compactProfile(p = {}) {
  return {
    cookieName: p.cookieName,
    vendor: p.vendor,
    purpose: p.purpose,
    duration: p.duration,
    cookieType: p.cookieType,
    thirdParty: p.thirdParty,
    recommendedCategory: p.recommendedCategory,
    confidenceLevel: p.confidenceLevel,
    consentRequired: p.consentRequired,
    gdprLawfulBasis: p.gdprLawfulBasis,
  };
}

function summariseScan(lastScan) {
  if (!lastScan || !lastScan.cookies) return '';
  const domain = lastScan.domain || lastScan.url || 'unknown';
  const cookies = lastScan.cookies;
  const total = cookies.length;
  const cats = {};
  cookies.forEach(c => {
    const cat = c.suggestedCategory || 'Unknown';
    cats[cat] = (cats[cat] || 0) + 1;
  });
  const breakdown = Object.entries(cats).map(([k, v]) => `${k}: ${v}`).join(', ');
  const unknowns = cookies.filter(c => (c.suggestedCategory || 'Unknown') === 'Unknown').map(c => c.name).slice(0, 10);
  let summary = `\nThe user has scanned ${domain} and found ${total} cookies. Breakdown by category: ${breakdown}.`;
  if (unknowns.length > 0) {
    summary += ` Uncategorized cookies: ${unknowns.join(', ')}.`;
  }
  summary += ' Reference this data when the user asks about their site.';
  return summary;
}

function buildSystem(cookieProfile) {
  let base = 'You are CookieIQ, an expert on cookie compliance, GDPR, ePrivacy, CCPA. Be direct and cite regulations precisely. You serve privacy engineers and DPOs.';
  if (cookieProfile && cookieProfile._siteContext) {
    base += summariseScan(cookieProfile.lastScan);
  } else {
    base += `\nCookie context: ${JSON.stringify(compactProfile(cookieProfile))}`;
  }
  return base;
}

router.post('/', async (req, res) => {
  const { messages = [], cookieProfile = {}, generateSuggestions = false } = req.body || {};
  try {
    const system = buildSystem(cookieProfile);
    const apiMessages = generateSuggestions
      ? [{ role: 'user', content: 'Return ONLY a JSON array of 4 short follow-up questions about this cookie. No preamble.' }]
      : messages.map(m => ({ role: m.role, content: m.content }));

    const message = await client.messages.create({
      model: MODEL,
      max_tokens: generateSuggestions ? 250 : 800,
      system,
      messages: apiMessages,
    });
    const text = extractText(message);

    if (generateSuggestions) {
      try {
        const arr = extractJSON(text);
        return res.json({ suggestions: Array.isArray(arr) ? arr.slice(0, 4) : [] });
      } catch {
        return res.json({ suggestions: [] });
      }
    }
    res.json({ reply: text });
  } catch (err) {
    console.error('[chat]', err);
    res.status(500).json({ error: err.message || 'Chat failed' });
  }
});

export default router;
