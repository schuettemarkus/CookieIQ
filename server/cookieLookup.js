import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Open Cookie Database (~2200 entries, Apache 2.0 licensed).
let OCD_ENTRIES = [];
let OCD_WILDCARD = [];
try {
  const raw = JSON.parse(readFileSync(join(__dirname, 'open-cookie-db.json'), 'utf8'));
  OCD_ENTRIES = raw.filter(e => !e.wildcard);
  OCD_WILDCARD = raw.filter(e => e.wildcard);
} catch {}

const OCD_MAP = new Map();
for (const e of OCD_ENTRIES) OCD_MAP.set(e.name.toLowerCase(), e);

// Hand-curated lookup table — takes precedence over Open Cookie Database.
export const COOKIE_LOOKUP = {
  // Google Analytics / GA4
  '_ga':       { vendor: 'Google Analytics', suggestedCategory: 'Analytics/Performance' },
  '_gid':      { vendor: 'Google Analytics', suggestedCategory: 'Analytics/Performance' },
  '_gat':      { vendor: 'Google Analytics', suggestedCategory: 'Analytics/Performance' },
  '_gac_':     { vendor: 'Google Analytics', suggestedCategory: 'Advertising' },
  '_ga_':      { vendor: 'Google Analytics 4', suggestedCategory: 'Analytics/Performance' },
  '__utma':    { vendor: 'Google Analytics (legacy)', suggestedCategory: 'Analytics/Performance' },
  '__utmb':    { vendor: 'Google Analytics (legacy)', suggestedCategory: 'Analytics/Performance' },
  '__utmc':    { vendor: 'Google Analytics (legacy)', suggestedCategory: 'Analytics/Performance' },
  '__utmz':    { vendor: 'Google Analytics (legacy)', suggestedCategory: 'Analytics/Performance' },
  '__utmt':    { vendor: 'Google Analytics (legacy)', suggestedCategory: 'Analytics/Performance' },

  // Google Ads / DoubleClick
  'IDE':              { vendor: 'Google DoubleClick', suggestedCategory: 'Advertising' },
  'DSID':             { vendor: 'Google DoubleClick', suggestedCategory: 'Advertising' },
  'FLC':              { vendor: 'Google DoubleClick', suggestedCategory: 'Advertising' },
  'AID':              { vendor: 'Google',             suggestedCategory: 'Advertising' },
  'TAID':             { vendor: 'Google',             suggestedCategory: 'Advertising' },
  'NID':              { vendor: 'Google',             suggestedCategory: 'Advertising' },
  '_gcl_au':          { vendor: 'Google Ads',         suggestedCategory: 'Advertising' },
  '_gcl_aw':          { vendor: 'Google Ads',         suggestedCategory: 'Advertising' },
  '_gcl_dc':          { vendor: 'Google Ads',         suggestedCategory: 'Advertising' },
  'ANID':             { vendor: 'Google',             suggestedCategory: 'Advertising' },
  'CONSENT':          { vendor: 'Google',             suggestedCategory: 'Strictly Necessary' },

  // Meta / Facebook
  '_fbp':       { vendor: 'Meta (Facebook)', suggestedCategory: 'Advertising' },
  '_fbc':       { vendor: 'Meta (Facebook)', suggestedCategory: 'Advertising' },
  'fr':         { vendor: 'Meta (Facebook)', suggestedCategory: 'Advertising' },
  'datr':       { vendor: 'Meta (Facebook)', suggestedCategory: 'Strictly Necessary' },
  'sb':         { vendor: 'Meta (Facebook)', suggestedCategory: 'Strictly Necessary' },

  // Hotjar
  '_hjSessionUser_':   { vendor: 'Hotjar', suggestedCategory: 'Analytics/Performance' },
  '_hjSession_':       { vendor: 'Hotjar', suggestedCategory: 'Analytics/Performance' },
  '_hjid':             { vendor: 'Hotjar', suggestedCategory: 'Analytics/Performance' },
  '_hjFirstSeen':      { vendor: 'Hotjar', suggestedCategory: 'Analytics/Performance' },
  '_hjAbsoluteSessionInProgress': { vendor: 'Hotjar', suggestedCategory: 'Analytics/Performance' },
  '_hjIncludedInSessionSample':   { vendor: 'Hotjar', suggestedCategory: 'Analytics/Performance' },
  '_hjIncludedInPageviewSample':  { vendor: 'Hotjar', suggestedCategory: 'Analytics/Performance' },
  '_hjTLDTest':        { vendor: 'Hotjar', suggestedCategory: 'Analytics/Performance' },

  // LinkedIn
  'li_sugr':       { vendor: 'LinkedIn', suggestedCategory: 'Advertising' },
  'bcookie':       { vendor: 'LinkedIn', suggestedCategory: 'Advertising' },
  'bscookie':      { vendor: 'LinkedIn', suggestedCategory: 'Advertising' },
  'lidc':          { vendor: 'LinkedIn', suggestedCategory: 'Functional' },
  'UserMatchHistory': { vendor: 'LinkedIn', suggestedCategory: 'Advertising' },
  'AnalyticsSyncHistory': { vendor: 'LinkedIn', suggestedCategory: 'Advertising' },

  // Twitter / X
  'guest_id':           { vendor: 'X (Twitter)', suggestedCategory: 'Functional' },
  'personalization_id': { vendor: 'X (Twitter)', suggestedCategory: 'Advertising' },
  'muc_ads':            { vendor: 'X (Twitter)', suggestedCategory: 'Advertising' },

  // TikTok
  '_ttp':         { vendor: 'TikTok', suggestedCategory: 'Advertising' },
  'tt_webid':     { vendor: 'TikTok', suggestedCategory: 'Advertising' },
  'tt_webid_v2':  { vendor: 'TikTok', suggestedCategory: 'Advertising' },

  // Microsoft / Bing / Clarity
  'MUID':       { vendor: 'Microsoft', suggestedCategory: 'Advertising' },
  '_uetsid':    { vendor: 'Microsoft Bing Ads', suggestedCategory: 'Advertising' },
  '_uetvid':    { vendor: 'Microsoft Bing Ads', suggestedCategory: 'Advertising' },
  '_clck':      { vendor: 'Microsoft Clarity', suggestedCategory: 'Analytics/Performance' },
  '_clsk':      { vendor: 'Microsoft Clarity', suggestedCategory: 'Analytics/Performance' },

  // Adobe
  's_cc':         { vendor: 'Adobe Analytics', suggestedCategory: 'Analytics/Performance' },
  's_sq':         { vendor: 'Adobe Analytics', suggestedCategory: 'Analytics/Performance' },
  's_vi':         { vendor: 'Adobe Analytics', suggestedCategory: 'Analytics/Performance' },
  'AMCV_':        { vendor: 'Adobe Experience Cloud', suggestedCategory: 'Analytics/Performance' },
  'AMCVS_':       { vendor: 'Adobe Experience Cloud', suggestedCategory: 'Analytics/Performance' },
  'demdex':       { vendor: 'Adobe Audience Manager', suggestedCategory: 'Advertising' },
  'dpm':          { vendor: 'Adobe Audience Manager', suggestedCategory: 'Advertising' },

  // Segment
  'ajs_anonymous_id': { vendor: 'Segment', suggestedCategory: 'Analytics/Performance' },
  'ajs_user_id':      { vendor: 'Segment', suggestedCategory: 'Analytics/Performance' },

  // Mixpanel / Amplitude
  'mp_':            { vendor: 'Mixpanel',  suggestedCategory: 'Analytics/Performance' },
  'amplitude_id_':  { vendor: 'Amplitude', suggestedCategory: 'Analytics/Performance' },

  // Intercom / Drift / Zendesk
  'intercom-id-':         { vendor: 'Intercom', suggestedCategory: 'Functional' },
  'intercom-session-':    { vendor: 'Intercom', suggestedCategory: 'Functional' },
  'driftt_aid':           { vendor: 'Drift',    suggestedCategory: 'Functional' },
  '__zlcmid':             { vendor: 'Zendesk',  suggestedCategory: 'Functional' },

  // Stripe
  '__stripe_mid': { vendor: 'Stripe', suggestedCategory: 'Strictly Necessary' },
  '__stripe_sid': { vendor: 'Stripe', suggestedCategory: 'Strictly Necessary' },

  // Cloudflare / security
  '__cf_bm':  { vendor: 'Cloudflare', suggestedCategory: 'Strictly Necessary' },
  'cf_clearance': { vendor: 'Cloudflare', suggestedCategory: 'Strictly Necessary' },
  '__cflb':   { vendor: 'Cloudflare', suggestedCategory: 'Strictly Necessary' },

  // CMP
  'OptanonConsent':     { vendor: 'OneTrust',  suggestedCategory: 'Strictly Necessary' },
  'OptanonAlertBoxClosed': { vendor: 'OneTrust', suggestedCategory: 'Strictly Necessary' },
  'notice_behavior':    { vendor: 'TrustArc',  suggestedCategory: 'Strictly Necessary' },
  'notice_preferences': { vendor: 'TrustArc',  suggestedCategory: 'Strictly Necessary' },
  'notice_gdpr_prefs':  { vendor: 'TrustArc',  suggestedCategory: 'Strictly Necessary' },

  // Pinterest / Snap / Reddit
  '_pinterest_sess': { vendor: 'Pinterest', suggestedCategory: 'Advertising' },
  '_pin_unauth':     { vendor: 'Pinterest', suggestedCategory: 'Advertising' },
  '_scid':           { vendor: 'Snap',      suggestedCategory: 'Advertising' },
  'sc_at':           { vendor: 'Snap',      suggestedCategory: 'Advertising' },
  '_rdt_uuid':       { vendor: 'Reddit',    suggestedCategory: 'Advertising' },
};

const VENDOR_DOMAINS = {
  'doubleclick.net':      'Google DoubleClick',
  'googletagmanager.com': 'Google Tag Manager',
  'google-analytics.com': 'Google Analytics',
  'googleadservices.com': 'Google Ads',
  'facebook.net':         'Meta (Facebook)',
  'facebook.com':         'Meta (Facebook)',
  'connect.facebook.net': 'Meta (Facebook)',
  'hotjar.com':           'Hotjar',
  'static.hotjar.com':    'Hotjar',
  'linkedin.com':         'LinkedIn',
  'licdn.com':            'LinkedIn',
  'twitter.com':          'X (Twitter)',
  'ads-twitter.com':      'X (Twitter)',
  'tiktok.com':           'TikTok',
  'analytics.tiktok.com': 'TikTok',
  'bing.com':             'Microsoft Bing',
  'clarity.ms':           'Microsoft Clarity',
  'pinterest.com':        'Pinterest',
  'snapchat.com':         'Snap',
  'reddit.com':           'Reddit',
  'segment.io':           'Segment',
  'mixpanel.com':         'Mixpanel',
  'amplitude.com':        'Amplitude',
  'intercom.io':          'Intercom',
  'drift.com':            'Drift',
  'zdassets.com':         'Zendesk',
  'stripe.com':           'Stripe',
  'cloudflare.com':       'Cloudflare',
  'onetrust.com':         'OneTrust',
  'trustarc.com':         'TrustArc',
  'cookielaw.org':        'OneTrust',
  'usercentrics.eu':      'Usercentrics',
  'cookiebot.com':        'Cookiebot',
  'didomi.io':            'Didomi',
  'iubenda.com':          'iubenda',
  'osano.com':            'Osano',
  'krxd.net':             'Salesforce Krux',
  'krux.com':             'Salesforce Krux',
  'optimizely.com':       'Optimizely',
  'split.io':             'Split.io',
  'launchdarkly.com':     'LaunchDarkly',
  'fullstory.com':        'FullStory',
  'fs.com':               'FullStory',
  'hsforms.net':          'HubSpot',
  'hs-analytics.net':     'HubSpot',
  'hs-scripts.com':       'HubSpot',
  'hubspot.com':          'HubSpot',
  'pardot.com':           'Pardot (Salesforce)',
  'marketo.com':          'Marketo',
  'mktoresp.com':         'Marketo',
  'eloqua.com':           'Eloqua (Oracle)',
  'salesforce.com':       'Salesforce',
  'force.com':            'Salesforce',
  'demandbase.com':       'Demandbase',
  '6sense.com':           '6sense',
  'rollbar.com':          'Rollbar',
  'sentry.io':            'Sentry',
  'datadog.com':          'Datadog',
  'datadoghq.com':        'Datadog',
  'newrelic.com':         'New Relic',
  'nr-data.net':          'New Relic',
  'launchpad.net':        'Launchpad',
  'taboola.com':          'Taboola',
  'outbrain.com':         'Outbrain',
  'criteo.com':           'Criteo',
  'criteo.net':           'Criteo',
  'adsrvr.org':           'The Trade Desk',
  'adnxs.com':            'Xandr (Microsoft)',
  'rubiconproject.com':   'Magnite',
  'pubmatic.com':         'PubMatic',
  'openx.net':            'OpenX',
  'casalemedia.com':      'Index Exchange',
  'yieldmo.com':          'Yieldmo',
  'rfihub.com':           'Rocket Fuel',
  'serving-sys.com':      'Sizmek',
  'mathtag.com':          'MediaMath',
  'agkn.com':             'Neustar',
  'bidswitch.net':        'BidSwitch',
  'media.net':            'Media.net',
  'quantserve.com':       'Quantcast',
  'scorecardresearch.com':'Scorecard Research',
  'youtube.com':          'YouTube',
  'ytimg.com':            'YouTube',
  'doubleverify.com':     'DoubleVerify',
  'moatads.com':          'Moat',
  'spotxchange.com':      'SpotX',
  'gemius.pl':            'Gemius',
  'chartbeat.com':        'Chartbeat',
  'parsely.com':          'Parse.ly',
  'cxense.com':           'Cxense',
  'kameleoon.com':        'Kameleoon',
  'vwo.com':              'VWO',
  'qualtrics.com':        'Qualtrics',
  'wistia.com':           'Wistia',
  'wistia.net':           'Wistia',
  'vimeo.com':            'Vimeo',
  'vimeocdn.com':         'Vimeo',
  'recaptcha.net':        'Google reCAPTCHA',
  'gstatic.com':          'Google (CDN)',
  'akamaihd.net':         'Akamai',
  'akamai.net':           'Akamai',
  'fastly.net':           'Fastly',
};

// Domain → category fallback. Used when we know the vendor by domain but
// the cookie name itself is unrecognized. Order matters slightly less than
// for vendor lookup since these are coarse-grained.
const DOMAIN_CATEGORY = [
  // Strictly necessary
  [/(^|\.)cloudflare\.com$/,            'Strictly Necessary'],
  [/(^|\.)recaptcha\.net$/,             'Strictly Necessary'],
  [/(^|\.)stripe\.com$/,                'Strictly Necessary'],
  [/(^|\.)onetrust\.com$/,              'Strictly Necessary'],
  [/(^|\.)cookielaw\.org$/,             'Strictly Necessary'],
  [/(^|\.)trustarc\.com$/,              'Strictly Necessary'],
  [/(^|\.)cookiebot\.com$/,             'Strictly Necessary'],
  [/(^|\.)usercentrics\.eu$/,           'Strictly Necessary'],
  [/(^|\.)didomi\.io$/,                 'Strictly Necessary'],
  // Functional
  [/(^|\.)intercom\.io$/,               'Functional'],
  [/(^|\.)drift\.com$/,                 'Functional'],
  [/(^|\.)zdassets\.com$/,              'Functional'],
  [/(^|\.)wistia\.(com|net)$/,          'Functional'],
  [/(^|\.)vimeo(cdn)?\.com$/,           'Functional'],
  // Analytics / performance
  [/(^|\.)google-analytics\.com$/,      'Analytics/Performance'],
  [/(^|\.)hotjar\.com$/,                'Analytics/Performance'],
  [/(^|\.)clarity\.ms$/,                'Analytics/Performance'],
  [/(^|\.)mixpanel\.com$/,              'Analytics/Performance'],
  [/(^|\.)amplitude\.com$/,             'Analytics/Performance'],
  [/(^|\.)segment\.io$/,                'Analytics/Performance'],
  [/(^|\.)fullstory\.com$/,             'Analytics/Performance'],
  [/(^|\.)chartbeat\.com$/,             'Analytics/Performance'],
  [/(^|\.)parsely\.com$/,               'Analytics/Performance'],
  [/(^|\.)qualtrics\.com$/,             'Analytics/Performance'],
  [/(^|\.)quantserve\.com$/,            'Analytics/Performance'],
  [/(^|\.)scorecardresearch\.com$/,     'Analytics/Performance'],
  [/(^|\.)(rollbar|sentry|datadog|datadoghq|newrelic|nr-data)\.(com|io|net)$/, 'Analytics/Performance'],
  // Advertising — broad catch-all for ad-tech
  [/(^|\.)doubleclick\.net$/,           'Advertising'],
  [/(^|\.)googleadservices\.com$/,      'Advertising'],
  [/(^|\.)googlesyndication\.com$/,     'Advertising'],
  [/(^|\.)facebook\.(com|net)$/,        'Advertising'],
  [/(^|\.)linkedin\.com$/,              'Advertising'],
  [/(^|\.)tiktok\.com$/,                'Advertising'],
  [/(^|\.)pinterest\.com$/,             'Advertising'],
  [/(^|\.)snapchat\.com$/,              'Advertising'],
  [/(^|\.)reddit\.com$/,                'Advertising'],
  [/(^|\.)bing\.com$/,                  'Advertising'],
  [/(^|\.)taboola\.com$/,               'Advertising'],
  [/(^|\.)outbrain\.com$/,              'Advertising'],
  [/(^|\.)criteo\.(com|net)$/,          'Advertising'],
  [/(^|\.)adnxs\.com$/,                 'Advertising'],
  [/(^|\.)adsrvr\.org$/,                'Advertising'],
  [/(^|\.)(rubiconproject|pubmatic|openx|casalemedia|yieldmo|rfihub|serving-sys|mathtag|agkn|bidswitch)\.(com|net|org)$/, 'Advertising'],
  [/(^|\.)media\.net$/,                 'Advertising'],
  [/(^|\.)(doubleverify|moatads|spotxchange|gemius)\./,    'Advertising'],
  // Marketing automation
  [/(^|\.)hubspot\.com$/,               'Functional'],
  [/(^|\.)hs-(analytics|scripts)\.(net|com)$/, 'Analytics/Performance'],
  [/(^|\.)hsforms\.net$/,               'Functional'],
  [/(^|\.)(pardot|marketo|mktoresp|eloqua|demandbase|6sense)\./, 'Advertising'],
];

// Heuristic name patterns. Lower priority than name+vendor lookup, higher
// than the "Unknown" fallback. Maps a regex over the cookie name to a category.
const NAME_HEURISTICS = [
  // Session / auth / security
  [/^(PHPSESSID|JSESSIONID|ASP\.NET_SessionId|connect\.sid|sid|sessionid|session_id)$/i, 'Strictly Necessary'],
  [/^(csrf|xsrf|_csrf|_xsrf|csrftoken|csrf_token|xsrf-token)/i,                          'Strictly Necessary'],
  [/^(auth|authToken|access_token|refresh_token|id_token|jwt|token|user_session)/i,      'Strictly Necessary'],
  [/^(remember_token|remember_me|wordpress_logged_in|wordpress_sec)/i,                   'Strictly Necessary'],
  [/(_session|_sess|sess_|session-)/i,                                                   'Strictly Necessary'],
  [/^(SERVER|BIGipServer|ROUTEID|JSESSION|AWSALB|AWSALBCORS|AWSELB)/i,                   'Strictly Necessary'],
  [/^(__Secure|__Host)-/i,                                                               'Strictly Necessary'],
  [/^(cf_|__cf|_cf)/i,                                                                   'Strictly Necessary'],
  [/cookieconsent|cookie_consent|cookies_accepted|cookieagreed|cmplz_|borlabs/i,         'Strictly Necessary'],

  // Functional preferences
  [/^(locale|lang|language|country|currency|tz|timezone|theme|darkmode)/i,               'Functional'],
  [/^(wp-settings|wp_lang|wpml_|polylang|trp_)/i,                                        'Functional'],
  [/(_preferences|preferences|settings|view_mode|layout|recent)/i,                       'Functional'],
  [/^(cart|basket|wishlist|woocommerce_cart|edd_)/i,                                     'Functional'],

  // Analytics
  [/^(_ga|_gid|_gat|_gac|__utm|_dc_gtm|_pk_|matomo|piwik|_pa|_clck|_clsk|_uet|_hj)/i,   'Analytics/Performance'],
  [/^(amplitude_|mp_|ajs_|mixpanel|heap)/i,                                              'Analytics/Performance'],
  [/^(visitor_id|vuid|_vis|first_visit|last_visit)/i,                                    'Analytics/Performance'],

  // Advertising / tracking
  [/^(_fbp|_fbc|fr|tr|_pin_|_rdt_|_ttp|_scid|sc_at|MUID|IDE|DSID|NID|ANID|li_sugr|UserMatchHistory)/i, 'Advertising'],
  [/^(utm_|gclid|fbclid|msclkid|dclid|ttclid|wbraid|gbraid)/i,                           'Advertising'],
  [/^(_uetsid|_uetvid|adRoll|__adroll|_adsv|_kuid_|km_)/i,                               'Advertising'],
];

export function vendorFromDomain(domain) {
  if (!domain) return null;
  const d = domain.replace(/^\./, '').toLowerCase();
  for (const k of Object.keys(VENDOR_DOMAINS)) {
    if (d === k || d.endsWith('.' + k)) return VENDOR_DOMAINS[k];
  }
  return null;
}

export function categoryFromDomain(domain) {
  if (!domain) return null;
  const d = domain.replace(/^\./, '').toLowerCase();
  for (const [pattern, category] of DOMAIN_CATEGORY) {
    if (pattern.test(d)) return category;
  }
  return null;
}

export function categoryFromNameHeuristic(name) {
  if (!name) return null;
  for (const [pattern, category] of NAME_HEURISTICS) {
    if (pattern.test(name)) return category;
  }
  return null;
}

// Open Cookie Database lookup (exact + wildcard).
function lookupOCD(name) {
  const lower = name.toLowerCase();
  const exact = OCD_MAP.get(lower);
  if (exact) return exact;
  for (const e of OCD_WILDCARD) {
    const base = e.name.replace(/[*_]+$/, '').toLowerCase();
    if (base && lower.startsWith(base)) return e;
  }
  return null;
}

// Layered lookup: curated exact → curated prefix → Open Cookie DB → domain → name heuristic.
export function lookupCookie(name, domain) {
  if (COOKIE_LOOKUP[name]) {
    return { ...COOKIE_LOOKUP[name], knownCookie: true, source: 'exact' };
  }
  for (const key of Object.keys(COOKIE_LOOKUP)) {
    if (key.endsWith('_') && name.startsWith(key)) {
      return { ...COOKIE_LOOKUP[key], knownCookie: true, source: 'prefix' };
    }
  }
  // Open Cookie Database — 2200+ community-curated entries.
  const ocd = lookupOCD(name);
  if (ocd && ocd.category !== 'Unknown') {
    return {
      vendor: ocd.vendor || null,
      suggestedCategory: ocd.category,
      description: ocd.description || null,
      duration: ocd.duration || null,
      knownCookie: true,
      source: 'open-cookie-db',
    };
  }
  // Domain-based fallback.
  if (domain) {
    const vendor = vendorFromDomain(domain);
    const cat = categoryFromDomain(domain);
    if (vendor || cat) {
      return { vendor: vendor || null, suggestedCategory: cat || 'Functional', knownCookie: false, source: 'domain' };
    }
  }
  // Name heuristic.
  const heuristic = categoryFromNameHeuristic(name);
  if (heuristic) {
    return { vendor: null, suggestedCategory: heuristic, knownCookie: false, source: 'heuristic' };
  }
  return { vendor: null, suggestedCategory: 'Unknown', knownCookie: false, source: 'none' };
}
