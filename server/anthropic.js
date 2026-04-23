import Anthropic from '@anthropic-ai/sdk';

export const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
export const MODEL = 'claude-haiku-4-5-20251001';

export function extractText(message) {
  return (message.content || [])
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('\n')
    .trim();
}

function stripCitations(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/<cite[^>]*>([^<]*)<\/cite>/g, '$1').replace(/<\/?cite[^>]*>/g, '');
}

function deepStripCitations(obj) {
  if (typeof obj === 'string') return stripCitations(obj);
  if (Array.isArray(obj)) return obj.map(deepStripCitations);
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) out[k] = deepStripCitations(v);
    return out;
  }
  return obj;
}

export function extractJSON(text) {
  // Strip citation tags and code fences, then find first { ... } block.
  const cleaned = stripCitations(text).replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  try { return deepStripCitations(JSON.parse(cleaned)); } catch {}
  const m = cleaned.match(/[\[{][\s\S]*[\]}]/);
  if (m) {
    try { return deepStripCitations(JSON.parse(m[0])); } catch {}
  }
  throw new Error('Model did not return valid JSON');
}
