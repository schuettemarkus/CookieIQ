import { Router } from 'express';
import puppeteer from 'puppeteer';
import { lookupCookie, vendorFromDomain } from '../cookieLookup.js';
import { recordScan } from '../db.js';

const router = Router();

const CONSENT_SELECTORS = [
  '#onetrust-banner-sdk', '#onetrust-accept-btn-handler',
  '.truste_box_overlay', '#truste-consent-track',
  '[id*="cookie"][id*="banner"]', '[class*="cookie"][class*="banner"]',
  '[id*="consent"]', '[class*="consent"]',
];

function durationFromExpires(expires) {
  if (!expires || expires < 0) return 'Session';
  const seconds = expires - Date.now() / 1000;
  if (seconds < 0) return 'Session';
  const days = Math.round(seconds / 86400);
  if (days < 1) return 'Session';
  if (days < 30) return `${days} days`;
  if (days < 365) return `${Math.round(days / 30)} months`;
  return `${(days / 365).toFixed(1)} years`;
}

export async function runScan(targetUrl, depth = 'homepage') {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'
    );
    const thirdPartyDomains = new Set();
    const targetHost = new URL(targetUrl).hostname;
    page.on('request', req => {
      try {
        const host = new URL(req.url()).hostname;
        if (host && !host.endsWith(targetHost)) thirdPartyDomains.add(host);
      } catch {}
    });

    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    // Pre-consent snapshot.
    const preConsentCookies = await page.cookies();
    const preConsentNames = new Set(preConsentCookies.map(c => c.name + '|' + c.domain));

    // Try to dismiss consent banners (best-effort).
    for (const sel of CONSENT_SELECTORS) {
      try {
        const el = await page.$(sel);
        if (el) {
          await el.click({ delay: 50 }).catch(() => {});
          await new Promise(r => setTimeout(r, 600));
        }
      } catch {}
    }

    if (depth === 'crawl') {
      // Light same-origin crawl: visit up to 3 internal links.
      const links = await page.$$eval('a[href]', as =>
        as.map(a => a.href).slice(0, 30)
      );
      const internal = [...new Set(links.filter(h => {
        try { return new URL(h).hostname === targetHost; } catch { return false; }
      }))].slice(0, 3);
      for (const link of internal) {
        try {
          await page.goto(link, { waitUntil: 'networkidle2', timeout: 20000 });
        } catch {}
      }
    }

    const cookies = await page.cookies();

    const storage = await page.evaluate(() => {
      const dump = obj => {
        const out = [];
        try { for (let i = 0; i < obj.length; i++) out.push(obj.key(i)); } catch {}
        return out;
      };
      return {
        localStorage: dump(localStorage),
        sessionStorage: dump(sessionStorage),
        documentCookie: document.cookie,
      };
    });

    const results = cookies.map(c => {
      const meta = lookupCookie(c.name);
      const vendor = meta.vendor || vendorFromDomain(c.domain);
      return {
        name: c.name,
        domain: c.domain,
        duration: durationFromExpires(c.expires),
        type: 'HTTP Cookie',
        vendor: vendor || null,
        preConsent: preConsentNames.has(c.name + '|' + c.domain),
        suggestedCategory: meta.suggestedCategory,
        knownCookie: meta.knownCookie,
      };
    });

    for (const key of storage.localStorage) {
      const meta = lookupCookie(key);
      results.push({
        name: key, domain: targetHost, duration: 'Persistent',
        type: 'localStorage', vendor: meta.vendor, preConsent: false,
        suggestedCategory: meta.suggestedCategory, knownCookie: meta.knownCookie,
      });
    }
    for (const key of storage.sessionStorage) {
      const meta = lookupCookie(key);
      results.push({
        name: key, domain: targetHost, duration: 'Session',
        type: 'sessionStorage', vendor: meta.vendor, preConsent: false,
        suggestedCategory: meta.suggestedCategory, knownCookie: meta.knownCookie,
      });
    }

    // Surface tracking-pixel third parties even if no cookie was set.
    const seenVendors = new Set(results.map(r => r.vendor).filter(Boolean));
    for (const host of thirdPartyDomains) {
      const vendor = vendorFromDomain(host);
      if (vendor && !seenVendors.has(vendor)) {
        results.push({
          name: `(pixel from ${host})`,
          domain: host,
          duration: 'N/A',
          type: 'Pixel',
          vendor,
          preConsent: true,
          suggestedCategory: 'Advertising',
          knownCookie: true,
        });
        seenVendors.add(vendor);
      }
    }

    return results;
  } finally {
    await browser.close();
  }
}

router.post('/', async (req, res) => {
  const { url, depth = 'homepage' } = req.body || {};
  if (!url) return res.status(400).json({ error: 'url is required' });
  let target;
  try { target = new URL(url); } catch { return res.status(400).json({ error: 'invalid url' }); }
  try {
    const cookies = await Promise.race([
      runScan(url, depth),
      new Promise((_, rej) => setTimeout(() => rej(new Error('Scan timeout (>30s)')), 35000)),
    ]);
    recordScan(target.hostname, cookies);
    res.json({ domain: target.hostname, cookies });
  } catch (err) {
    console.error('[scan]', err);
    res.status(500).json({ error: err.message || 'Scan failed' });
  }
});

export default router;
