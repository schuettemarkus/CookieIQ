import React, { useState } from 'react';
import SearchBar, { pushRecent } from './components/SearchBar.jsx';
import LoadingSteps from './components/LoadingSteps.jsx';
import CookieProfile from './components/CookieProfile.jsx';
import ChatPanel from './components/ChatPanel.jsx';
import SiteScanner from './components/SiteScanner.jsx';
import ScanHistory from './components/ScanHistory.jsx';
import ChatPage from './components/ChatPage.jsx';
import PrivacyPolicy from './components/PrivacyPolicy.jsx';
import TermsOfService from './components/TermsOfService.jsx';
import CookiePolicyPage from './components/CookiePolicyPage.jsx';
import RegulatoryMap from './components/RegulatoryMap.jsx';
import CategoryBadge from './components/CategoryBadge.jsx';
import { api } from './lib.js';

const NAV_ITEMS = [
  { id: 'lookup',     label: 'Lookup' },
  { id: 'scan',       label: 'Scanner' },
  { id: 'chat',       label: 'AI Consultant' },
  { id: 'regulatory', label: 'Regulatory' },
];

export default function App() {
  const [view, setView] = useState('home');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [pendingScan, setPendingScan] = useState(null);
  const [pendingChat, setPendingChat] = useState(null);

  React.useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  const goHome = () => setView('home');

  const research = async (query) => {
    const key = String(query || '').trim().toLowerCase();
    if (!key) return;
    setActiveQuery(query);
    pushRecent(query);
    setView('lookup');

    const cacheKey = 'cookieiq.profile.' + key;
    try {
      const cached = JSON.parse(localStorage.getItem(cacheKey) || 'null');
      if (cached) { setProfile(cached); setLoading(false); setError(''); return; }
    } catch {}

    setProfile(null);
    setLoading(true);
    setError('');
    try {
      const data = await api('/api/research', { method: 'POST', body: { query } });
      setProfile(data);
      try { localStorage.setItem(cacheKey, JSON.stringify(data)); } catch {}
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {view !== 'home' && (
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-stone-200/50 no-print">
          <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
            <button onClick={goHome} className="text-lg font-semibold tracking-tight hover:text-blue-600 transition-all">
              CookieIQ
            </button>
            {!['privacy', 'terms', 'cookies'].includes(view) && (
              <nav className="flex items-center gap-1">
                {NAV_ITEMS.map(n => (
                  <button key={n.id} onClick={() => setView(n.id)}
                    className={'px-3 py-1.5 rounded-full text-sm transition-all ' +
                      (view === n.id
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-stone-500 hover:bg-stone-100 hover:text-stone-700')}>
                    {n.label}
                  </button>
                ))}
              </nav>
            )}
          </div>
        </header>
      )}

      <main className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-6">
        {view === 'home' && <HomePage onNavigate={(v, data) => {
          if (v === 'scan' && data) setPendingScan(data);
          if (v === 'lookup' && data && data.cookieName) {
            setProfile(data);
            setActiveQuery(data.cookieName);
          }
          if (v === 'chat' && data) setPendingChat(data);
          else if (v === 'chat') setPendingChat(null);
          setView(v);
        }} />}

        {view === 'lookup' && (
          <div className="py-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Cookie Lookup</h2>
              <p className="text-xs text-stone-500 mt-0.5">Research any cookie, vendor, or tracking technology</p>
            </div>
            <SearchBar onSearch={research} loading={loading} query={activeQuery} />
            {loading && <LoadingSteps />}
            {error && <div className="card p-4 text-sm text-red-600">{error}</div>}
            {profile && (
              <>
                <CookieProfile profile={profile} onRefresh={() => research(activeQuery)} />
                <ChatPanel cookieProfile={profile} />
              </>
            )}
          </div>
        )}

        {view === 'scan' && (
          <div className="py-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Site Scanner</h2>
              <p className="text-xs text-stone-500 mt-0.5">Scan a website for cookies, trackers, and compliance gaps</p>
            </div>
            <SiteScanner onResearchCookie={research} initialResult={pendingScan} />
            <ScanHistory onResearchCookie={research} />
          </div>
        )}

        {view === 'chat' && (
          <div className="py-6 flex-1 flex flex-col">
            <div className="mb-4">
              <h2 className="text-xl font-semibold tracking-tight">AI Consultant</h2>
              <p className="text-xs text-stone-500 mt-0.5">GDPR guidance, policy review, consent strategy, audit checklists & more</p>
            </div>
            <ChatPage initialMessages={pendingChat} />
          </div>
        )}

        {view === 'regulatory' && <RegulatoryMap />}

        {view === 'privacy' && <PrivacyPolicy />}
        {view === 'terms' && <TermsOfService />}
        {view === 'cookies' && <CookiePolicyPage />}
      </main>

      <Footer onNavigate={setView} />
    </div>
  );
}

function Footer({ onNavigate }) {
  return (
    <footer className="mt-auto py-5 border-t border-stone-200/50 no-print">
      <div className="max-w-5xl mx-auto px-6 flex flex-wrap items-center justify-between gap-3 text-[11px] text-stone-400">
        <span>&copy; {new Date().getFullYear()} CookieIQ. All rights reserved.</span>
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('privacy')} className="hover:text-stone-600 transition-colors">Privacy Policy</button>
          <button onClick={() => onNavigate('cookies')} className="hover:text-stone-600 transition-colors">Cookie Policy</button>
          <button onClick={() => onNavigate('terms')} className="hover:text-stone-600 transition-colors">Terms of Service</button>
        </div>
      </div>
    </footer>
  );
}

function HomePage({ onNavigate }) {
  const TILES = [
    { id: 'lookup',     title: 'Cookie Lookup', subtitle: 'Research any cookie or tracking technology' },
    { id: 'scan',       title: 'Site Scanner', subtitle: 'Audit a website for cookies & compliance gaps' },
    { id: 'chat',       title: 'AI Consultant', subtitle: 'GDPR guidance, policy review, consent strategy & more' },
    { id: 'regulatory', title: 'Regulatory Map', subtitle: 'Global compliance pressure by jurisdiction, updated weekly' },
  ];

  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null); // { type: 'profile'|'scan'|'answer', data }

  const detectAndRoute = async () => {
    const v = input.trim();
    if (!v || busy) return;

    // URL → scan
    if (/^https?:\/\//i.test(v) || /\.[a-z]{2,}$/i.test(v)) {
      const url = v.startsWith('http') ? v : 'https://' + v;
      setBusy(true);
      setResult(null);
      try {
        const data = await api('/api/scan', { method: 'POST', body: { url, depth: 'homepage' } });
        try { localStorage.setItem('cookieiq.lastScan', JSON.stringify(data)); } catch {}
        setResult({ type: 'scan', data });
      } catch (err) {
        setResult({ type: 'error', data: err.message });
      } finally { setBusy(false); }
      return;
    }

    // Cookie-like name → quick lookup
    if (/^[_.\-a-zA-Z0-9]+$/.test(v) && v.length <= 50 && !v.includes(' ')) {
      setBusy(true);
      setResult(null);
      pushRecent(v);
      const cacheKey = 'cookieiq.profile.' + v.toLowerCase();
      try {
        const cached = JSON.parse(localStorage.getItem(cacheKey) || 'null');
        if (cached) { setResult({ type: 'profile', data: cached }); setBusy(false); return; }
      } catch {}
      try {
        const data = await api('/api/research', { method: 'POST', body: { query: v } });
        try { localStorage.setItem(cacheKey, JSON.stringify(data)); } catch {}
        setResult({ type: 'profile', data });
      } catch (err) {
        setResult({ type: 'error', data: err.message });
      } finally { setBusy(false); }
      return;
    }

    // Question → quick AI answer
    setBusy(true);
    setResult(null);
    try {
      const data = await api('/api/chat', {
        method: 'POST',
        body: { messages: [{ role: 'user', content: v + '\n\nKeep your answer concise — 2-3 sentences max.' }], cookieProfile: {} },
      });
      setResult({ type: 'answer', data: { question: v, reply: data.reply || '(no reply)' } });
    } catch (err) {
      setResult({ type: 'error', data: err.message });
    } finally { setBusy(false); }
  };

  return (
    <div className="flex-1 flex flex-col pt-24 pb-12">
      <div className="text-center mb-16">
        <h1 className="text-6xl sm:text-7xl font-bold tracking-tight bg-gradient-to-b from-stone-400 to-stone-800 bg-clip-text text-transparent">
          CookieIQ
        </h1>
        <p className="text-base text-stone-500 mt-4">Cookie research & categorization intelligence</p>
      </div>

      {/* Smart command bar */}
      <div className="max-w-xl mx-auto w-full mb-16">
        <form onSubmit={e => { e.preventDefault(); detectAndRoute(); }}
          className="bg-white/80 backdrop-blur rounded-2xl shadow-sm p-2 flex gap-2">
          <input
            className="border-0 bg-transparent focus:ring-0 focus:outline-none flex-1 text-sm px-3"
            placeholder="Research a cookie, scan a site, or ask a question..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={busy}
          />
          <button type="submit" className="rounded-full bg-blue-600/90 text-white px-5 py-2 text-sm hover:bg-blue-600 transition-all"
            disabled={busy || !input.trim()}>
            {busy ? 'Working...' : 'Go'}
          </button>
        </form>
        <div className="flex justify-center gap-4 mt-2.5 text-[10px] text-stone-400">
          <span><span className="font-mono">_ga</span> → cookie lookup</span>
          <span><span className="font-mono">example.com</span> → site scan</span>
          <span>"What is GDPR?" → AI answer</span>
        </div>
      </div>

      {/* Inline result */}
      {result && (
        <div className="max-w-xl mx-auto w-full mb-16">
          {result.type === 'error' && (
            <div className="card p-4 text-sm text-red-600">{result.data}</div>
          )}
          {result.type === 'profile' && (
            <InlineProfile profile={result.data} onFullLookup={() => onNavigate('lookup', result.data)} />
          )}
          {result.type === 'scan' && (
            <InlineScan scan={result.data} onFullScan={(data) => onNavigate('scan', data)} />
          )}
          {result.type === 'answer' && (
            <InlineAnswer question={result.data.question} reply={result.data.reply} onContinue={() => {
              onNavigate('chat', {
                messages: [
                  { role: 'user', content: result.data.question },
                  { role: 'assistant', content: result.data.reply },
                ],
                autoFollowUp: `I'd like to go deeper on this topic. Expand on your previous answer with detailed, actionable guidance. Include specific regulations, practical steps, and examples where relevant. Structure your response with clear headings.`,
              });
            }} />
          )}
        </div>
      )}

      {busy && !result && (
        <div className="max-w-xl mx-auto w-full mb-16">
          <div className="card p-5 flex items-center gap-3">
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-sm text-stone-500">
              {/\.[a-z]{2,}$/i.test(input.trim()) ? 'Scanning site — this may take up to 60 seconds...' : 'Working on it...'}
            </span>
          </div>
        </div>
      )}

      {/* Feature tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 max-w-4xl mx-auto w-full">
        {TILES.map((tile) => (
          <button key={tile.id} onClick={() => onNavigate(tile.id)}
            className="card px-7 py-8 text-left hover:shadow-md hover:scale-[1.02] transition-all duration-200 group">
            <TileIcon id={tile.id} />
            <div className="text-base font-semibold text-stone-800 group-hover:text-stone-900 mt-4">{tile.title}</div>
            <div className="text-xs text-stone-500 leading-snug mt-2">{tile.subtitle}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function InlineProfile({ profile, onFullLookup }) {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-mono font-semibold text-lg">{profile.cookieName}</div>
          <div className="text-xs text-stone-500">{profile.vendor}</div>
        </div>
        <CategoryBadge category={profile.recommendedCategory} />
      </div>
      <p className="text-sm text-stone-600 leading-relaxed">{profile.purpose}</p>
      <div className="grid grid-cols-3 gap-3 text-xs">
        <div><span className="text-stone-400 uppercase text-[10px]">Duration</span><div>{profile.duration}</div></div>
        <div><span className="text-stone-400 uppercase text-[10px]">Type</span><div>{profile.cookieType}</div></div>
        <div><span className="text-stone-400 uppercase text-[10px]">Consent</span><div>{profile.consentRequired ? 'Required' : 'Not required'}</div></div>
      </div>
      <button onClick={onFullLookup} className="mt-3 w-full text-center text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl py-2.5 transition-all">
        Full lookup →
      </button>
    </div>
  );
}

function InlineScan({ scan, onFullScan }) {
  const cookies = scan.cookies || [];
  const cats = {};
  cookies.forEach(c => { const cat = c.suggestedCategory || 'Unknown'; cats[cat] = (cats[cat] || 0) + 1; });
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-mono font-semibold">{scan.domain}</div>
          <div className="text-xs text-stone-500">{cookies.length} cookies detected</div>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 text-lg">✓</div>
      </div>
      <div className="flex flex-wrap gap-2">
        {Object.entries(cats).map(([cat, count]) => (
          <span key={cat} className="text-xs px-2.5 py-1 rounded-full bg-stone-100 text-stone-600">
            {cat}: {count}
          </span>
        ))}
      </div>
      <button onClick={() => onFullScan(scan)} className="mt-3 w-full text-center text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-xl py-2.5 transition-all">
        View full scan report →
      </button>
    </div>
  );
}

function InlineAnswer({ question, reply, onContinue }) {
  return (
    <div className="card p-5 space-y-3">
      <div className="text-xs text-stone-400 font-medium">{question}</div>
      <p className="text-sm text-stone-700 leading-relaxed">{reply}</p>
      <button onClick={onContinue} className="mt-3 w-full text-center text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-xl py-2.5 transition-all">
        Continue in AI Consultant →
      </button>
    </div>
  );
}

function TileIcon({ id }) {
  const icons = {
    lookup: (
      <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
        <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
      </div>
    ),
    scan: (
      <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center">
        <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-2.247m0 0A8.966 8.966 0 0 1 3 12c0-1.264.26-2.467.732-3.558" />
        </svg>
      </div>
    ),
    chat: (
      <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center">
        <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
        </svg>
      </div>
    ),
    regulatory: (
      <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
        <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-2.247m0 0A8.966 8.966 0 013 12c0-1.264.26-2.467.732-3.558" />
        </svg>
      </div>
    ),
  };
  return icons[id] || null;
}
