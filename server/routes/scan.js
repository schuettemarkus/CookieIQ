import { Router } from 'express';
import puppeteer from 'puppeteer-core';
import { execSync } from 'node:child_process';
import { lookupCookie, vendorFromDomain } from '../cookieLookup.js';
import { recordScan } from '../db.js';

function getChromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  try {
    return execSync('which chromium || which chromium-browser || which google-chrome-stable || which google-chrome 2>/dev/null', { encoding: 'utf8', timeout: 3000 }).trim() || null;
  } catch { return null; }
}

const CHROME_PATH = getChromePath();
console.log('[scan] Chrome path:', CHROME_PATH || 'NOT FOUND');

const router = Router();

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
  if (!CHROME_PATH) throw new Error('Chrome not found. Set CHROME_PATH env var.');

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: CHROME_PATH,
    args: [
      '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
      '--disable-gpu', '--single-process', '--no-zygote',
      '--disable-extensions', '--disable-background-networking',
      '--disable-default-apps', '--disable-sync', '--disable-translate',
      '--mute-audio', '--no-first-run',
    ],
  });

  let page;
  try {
    page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'
    );
    // Set viewport small to reduce rendering work
    await page.setViewport({ width: 800, height: 600 });

    const targetHost = new URL(targetUrl).hostname;
    const trackerHosts = new Map();

    // Block heavy resources + track third parties
    await page.setRequestInterception(true);
    page.on('request', req => {
      const type = req.resourceType();
      try {
        const host = new URL(req.url()).hostname;
        if (host && host !== targetHost && !host.endsWith('.' + targetHost) && !targetHost.endsWith('.' + host)) {
          if (!trackerHosts.has(host)) trackerHosts.set(host, { types: new Set(), requests: 0 });
          const entry = trackerHosts.get(host);
          entry.types.add(type);
          entry.requests++;
        }
      } catch {}
      if (['image', 'media', 'font', 'stylesheet'].includes(type)) {
        req.abort().catch(() => {});
      } else {
        req.continue().catch(() => {});
      }
    });

    // Navigate — catch timeout gracefully, still collect what we got
    let navOk = true;
    try {
      await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
    } catch (e) {
      console.log('[scan] nav partial:', e.message?.slice(0, 80));
      navOk = false;
    }

    // Give scripts a moment to fire cookies
    await new Promise(r => setTimeout(r, navOk ? 2000 : 1000));

    // Collect cookies via CDP — most reliable method
    let cookies = [];
    try {
      const cdp = await page.createCDPSession();
      await cdp.send('Network.enable');
      cookies = (await cdp.send('Network.getAllCookies')).cookies || [];
      await cdp.detach().catch(() => {});
    } catch (e) {
      console.log('[scan] CDP fallback to page.cookies:', e.message?.slice(0, 80));
      try { cookies = await page.cookies(); } catch {}
    }

    // Collect storage — wrapped in try/catch since page might be in bad state
    let storage = { localStorage: [], sessionStorage: [], fingerprintSignals: [] };
    try {
      storage = await page.evaluate(() => {
        const dump = obj => {
          const out = [];
          try { for (let i = 0; i < obj.length; i++) out.push(obj.key(i)); } catch {}
          return out;
        };
        const fpSignals = [];
        try {
          const scripts = [...document.querySelectorAll('script[src]')].map(s => s.src.toLowerCase());
          for (const src of scripts) {
            for (const lib of ['fingerprintjs', 'fp2', 'clientjs', 'evercookie']) {
              if (src.includes(lib)) fpSignals.push(lib);
            }
          }
        } catch {}
        return {
          localStorage: dump(localStorage),
          sessionStorage: dump(sessionStorage),
          fingerprintSignals: fpSignals,
        };
      });
    } catch (e) {
      console.log('[scan] storage eval failed:', e.message?.slice(0, 80));
    }

    // Crawl extra pages if requested
    if (depth === 'crawl') {
      try {
        const links = await page.$$eval('a[href]', as => as.map(a => a.href).slice(0, 20));
        const internal = [...new Set(links.filter(h => {
          try { return new URL(h).hostname === targetHost; } catch { return false; }
        }))].slice(0, 3);
        for (const link of internal) {
          try {
            await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 15000 });
            await new Promise(r => setTimeout(r, 1000));
            const extra = await page.cookies();
            cookies.push(...extra);
          } catch {}
        }
      } catch {}
    }

    // Build results
    const isThirdParty = (d) => {
      const clean = (d || '').replace(/^\./, '').toLowerCase();
      return !!clean && clean !== targetHost && !clean.endsWith('.' + targetHost) && !targetHost.endsWith('.' + clean);
    };

    // Dedupe cookies by name+domain
    const seen = new Set();
    const results = [];
    for (const c of cookies) {
      const key = c.name + '|' + c.domain;
      if (seen.has(key)) continue;
      seen.add(key);
      const meta = lookupCookie(c.name, c.domain);
      const vendor = meta.vendor || vendorFromDomain(c.domain);
      const thirdParty = isThirdParty(c.domain);
      results.push({
        name: c.name,
        domain: c.domain,
        duration: durationFromExpires(c.expires),
        type: thirdParty ? 'HTTP Cookie (3rd party)' : 'HTTP Cookie',
        vendor: vendor || null,
        thirdParty,
        preConsent: true,
        suggestedCategory: meta.suggestedCategory,
        knownCookie: meta.knownCookie,
        description: meta.description || null,
        source: meta.source || null,
      });
    }

    for (const key of storage.localStorage) {
      const meta = lookupCookie(key, targetHost);
      results.push({
        name: key, domain: targetHost, duration: 'Persistent',
        type: 'localStorage', vendor: meta.vendor, preConsent: false,
        suggestedCategory: meta.suggestedCategory, knownCookie: meta.knownCookie,
      });
    }
    for (const key of storage.sessionStorage) {
      const meta = lookupCookie(key, targetHost);
      results.push({
        name: key, domain: targetHost, duration: 'Session',
        type: 'sessionStorage', vendor: meta.vendor, preConsent: false,
        suggestedCategory: meta.suggestedCategory, knownCookie: meta.knownCookie,
      });
    }

    // Third-party tracker hosts (no cookie set)
    const seenHosts = new Set(results.map(r => (r.domain || '').replace(/^\./, '').toLowerCase()));
    for (const [host, info] of trackerHosts) {
      if (seenHosts.has(host)) continue;
      const vendor = vendorFromDomain(host);
      const isBeacon = info.types.has('image') || info.types.has('ping') || info.types.has('beacon');
      results.push({
        name: `tracker · ${host}`, domain: host, duration: 'N/A',
        type: isBeacon ? 'Tracking pixel' : 'Third-party request',
        vendor: vendor || null, thirdParty: true, preConsent: true,
        suggestedCategory: vendor ? 'Advertising' : 'Unknown',
        knownCookie: !!vendor, requestCount: info.requests,
      });
    }

    if (storage.fingerprintSignals?.length > 0) {
      results.push({
        name: `fingerprinting: ${storage.fingerprintSignals.join(', ')}`,
        domain: targetHost, duration: 'N/A', type: 'Fingerprint',
        vendor: null, thirdParty: false, preConsent: true,
        suggestedCategory: 'Advertising', knownCookie: false,
      });
    }

    return results;
  } finally {
    await browser.close().catch(() => {});
  }
}

router.post('/', async (req, res) => {
  let { url, depth = 'homepage' } = req.body || {};
  if (!url) return res.status(400).json({ error: 'url is required' });
  url = url.trim();
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  let target;
  try { target = new URL(url); } catch { return res.status(400).json({ error: 'invalid url' }); }
  try {
    const cookies = await Promise.race([
      runScan(url, depth),
      new Promise((_, rej) => setTimeout(() => rej(new Error('Scan timed out. The site may be blocking automated browsers or is too slow to respond.')), 60000)),
    ]);
    recordScan(target.hostname, cookies);
    res.json({ domain: target.hostname, cookies });
  } catch (err) {
    console.error('[scan]', err.message);
    res.status(500).json({ error: err.message || 'Scan failed' });
  }
});

export default router;
