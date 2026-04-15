// Local lookup table for the most common cookies — vendor + suggested category mapping.
// Used by the scanner to immediately classify well-known cookies without an LLM round-trip.

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
};

export function lookupCookie(name) {
  if (COOKIE_LOOKUP[name]) return { ...COOKIE_LOOKUP[name], knownCookie: true };
  // Prefix-style match (e.g. _ga_<id>, _hjSession_<id>, AMCV_<id>, mp_<id>)
  for (const key of Object.keys(COOKIE_LOOKUP)) {
    if (key.endsWith('_') && name.startsWith(key)) {
      return { ...COOKIE_LOOKUP[key], knownCookie: true };
    }
  }
  return { vendor: null, suggestedCategory: 'Unknown', knownCookie: false };
}

export function vendorFromDomain(domain) {
  if (!domain) return null;
  const d = domain.replace(/^\./, '').toLowerCase();
  for (const k of Object.keys(VENDOR_DOMAINS)) {
    if (d === k || d.endsWith('.' + k)) return VENDOR_DOMAINS[k];
  }
  return null;
}
