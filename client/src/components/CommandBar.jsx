import React, { useEffect, useRef, useState } from 'react';
import { api } from '../lib.js';
import { pushRecent } from './SearchBar.jsx';
import CategoryBadge from './CategoryBadge.jsx';

const HISTORY_KEY = 'cookieiq.recent';
function readRecent() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
}

function looksLikeCookieName(input) {
  const v = input.trim();
  if (v.includes('?')) return false;
  if (/^(what|how|why|can|does|is|should|explain|compare|tell|when|where|which|do|are|will)/i.test(v)) return false;
  if (v.length > 50) return false;
  if (/^[_.\-a-zA-Z0-9]+$/.test(v)) return true;
  if (v.split(/\s+/).length <= 2) return true;
  return false;
}

function renderMarkdown(text) {
  const escape = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  return escape(text)
    .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-stone-200 font-mono text-xs">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>');
}

export default function CommandBar({ onProfileResolved, loading, profile, query }) {
  const [input, setInput] = useState('');
  const [recent, setRecent] = useState(readRecent);
  const [feed, setFeed] = useState([]);
  // feed items: { type: 'user'|'profile'|'answer'|'error'|'thinking', content: any }
  const [busy, setBusy] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    const sync = () => setRecent(readRecent());
    window.addEventListener('cookieiq:recent-changed', sync);
    return () => window.removeEventListener('cookieiq:recent-changed', sync);
  }, []);

  useEffect(() => {
    if (query) setInput(query);
  }, [query]);

  useEffect(() => {
    setSuggestions([]);
    if (!profile?.cookieName) return;
    api('/api/chat', { method: 'POST', body: { cookieProfile: profile, generateSuggestions: true } })
      .then(d => {
        const norm = (d.suggestions || [])
          .map(s => typeof s === 'string' ? s : (s?.question || s?.text || s?.q || JSON.stringify(s)))
          .filter(Boolean);
        setSuggestions(norm);
      })
      .catch(() => {});
  }, [profile?.cookieName]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 9e9, behavior: 'smooth' });
  }, [feed, busy]);

  const send = async (value) => {
    const v = (value ?? input).trim();
    if (!v || busy || loading) return;
    setInput('');

    const userItem = { type: 'user', content: v };
    const thinkingItem = { type: 'thinking', content: '' };
    setFeed(f => [...f, userItem, thinkingItem]);

    if (looksLikeCookieName(v)) {
      // Cookie research path.
      pushRecent(v);
      setBusy(true);

      // Check cache first.
      const cacheKey = 'cookieiq.profile.' + v.toLowerCase();
      let cached = null;
      try { cached = JSON.parse(localStorage.getItem(cacheKey) || 'null'); } catch {}

      if (cached) {
        setFeed(f => [...f.slice(0, -1), { type: 'profile', content: cached }]);
        onProfileResolved(cached);
        setBusy(false);
        return;
      }

      try {
        const data = await api('/api/research', { method: 'POST', body: { query: v } });
        try { localStorage.setItem(cacheKey, JSON.stringify(data)); } catch {}
        setFeed(f => [...f.slice(0, -1), { type: 'profile', content: data }]);
        onProfileResolved(data);
      } catch (err) {
        setFeed(f => [...f.slice(0, -1), { type: 'error', content: err.message }]);
      } finally {
        setBusy(false);
      }
    } else {
      // Chat question path.
      setBusy(true);
      const chatMessages = feed
        .filter(i => i.type === 'user' || i.type === 'answer')
        .map(i => ({ role: i.type === 'user' ? 'user' : 'assistant', content: i.content }));
      chatMessages.push({ role: 'user', content: v });

      try {
        const data = await api('/api/chat', {
          method: 'POST',
          body: { messages: chatMessages, cookieProfile: profile || {} },
        });
        setFeed(f => [...f.slice(0, -1), { type: 'answer', content: data.reply || '(no reply)' }]);
      } catch (err) {
        setFeed(f => [...f.slice(0, -1), { type: 'error', content: err.message }]);
      } finally {
        setBusy(false);
      }
    }
  };

  const anyBusy = busy || loading;

  return (
    <div className="card overflow-hidden">
      {/* Feed area */}
      <div ref={scrollRef} className="max-h-[460px] overflow-y-auto">
        {feed.length === 0 ? (
          <EmptyState
            recent={recent}
            suggestions={suggestions}
            profile={profile}
            onChip={send}
          />
        ) : (
          <div className="p-4 space-y-4">
            {feed.map((item, i) => (
              <FeedItem key={i} item={item} />
            ))}
            {suggestions.length > 0 && !anyBusy && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {suggestions.map((s, i) => (
                  <button key={i} onClick={() => send(s)}
                    className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100">
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={e => { e.preventDefault(); send(); }}
        className="p-3 border-t border-stone-200 flex gap-2">
        <input
          className="input font-mono text-sm"
          placeholder={profile ? `Follow up on ${profile.cookieName}, or research another…` : 'Enter a cookie name or ask a question…'}
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={anyBusy}
        />
        <button type="submit" className="btn-primary whitespace-nowrap" disabled={anyBusy || !input.trim()}>
          {anyBusy ? 'Working…' : 'Send'}
        </button>
      </form>
    </div>
  );
}

function EmptyState({ recent, suggestions, profile, onChip }) {
  return (
    <div className="px-4 py-6 space-y-4">
      <div className="text-center">
        <div className="text-sm font-medium">CookieIQ</div>
        <div className="text-xs text-stone-500 mt-1">
          {profile?.cookieName
            ? <>Researched <span className="font-mono">{profile.cookieName}</span> — ask a follow-up or look up another cookie.</>
            : 'Type a cookie name to research it, or ask any cookie compliance question.'}
        </div>
      </div>
      {(recent.length > 0 || suggestions.length > 0) && (
        <div className="flex flex-wrap justify-center gap-2">
          {recent.map(r => (
            <button key={r} onClick={() => onChip(r)}
              className="text-xs px-2.5 py-1 rounded-full bg-stone-100 hover:bg-stone-200 font-mono">
              {r}
            </button>
          ))}
          {suggestions.map((s, i) => (
            <button key={'s' + i} onClick={() => onChip(s)}
              className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100">
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FeedItem({ item }) {
  if (item.type === 'user') {
    return (
      <div className="text-right">
        <div className="inline-block max-w-[85%] px-3 py-2 rounded-lg bg-stone-900 text-white text-sm">
          {item.content}
        </div>
      </div>
    );
  }
  if (item.type === 'thinking') {
    return (
      <div className="flex items-center gap-2 text-xs text-stone-500">
        <span className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-pulse" />
        Thinking…
      </div>
    );
  }
  if (item.type === 'error') {
    return <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{item.content}</div>;
  }
  if (item.type === 'answer') {
    return (
      <div className="max-w-[90%]">
        <div className="bg-stone-50 rounded-lg px-4 py-3 text-sm leading-relaxed">
          <div dangerouslySetInnerHTML={{ __html: renderMarkdown(item.content) }} />
        </div>
      </div>
    );
  }
  if (item.type === 'profile') {
    return <MiniProfile profile={item.content} />;
  }
  return null;
}

function MiniProfile({ profile }) {
  if (!profile) return null;
  const p = profile;
  return (
    <div className="max-w-[90%] rounded-lg border border-stone-200 bg-white overflow-hidden">
      {/* Top bar — verdict */}
      <div className="px-4 py-3 bg-amber-50 border-b border-amber-200 flex items-center gap-3 flex-wrap">
        <CategoryBadge category={p.recommendedCategory} />
        <span className="text-sm font-semibold">{p.recommendedCategory}</span>
        <span className="text-xs text-stone-500">· {p.confidenceLevel} confidence</span>
        <span className="text-xs text-stone-500">· Consent {p.consentRequired ? 'required' : 'not required'}</span>
      </div>
      <div className="px-4 py-3 space-y-3 text-sm">
        {/* Name + vendor */}
        <div>
          <span className="font-mono font-semibold text-base">{p.cookieName}</span>
          <span className="text-stone-500 ml-2">{p.vendor}</span>
        </div>
        {/* Purpose */}
        <p className="text-stone-700 leading-relaxed">{p.purpose}</p>
        {/* Quick facts */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <Fact label="Duration" value={p.duration} />
          <Fact label="Type" value={p.cookieType} />
          <Fact label="Domain" value={p.domain} mono />
          <Fact label="Third party" value={p.thirdParty ? 'Yes' : 'No'} />
        </div>
        {/* Data collected */}
        {p.dataCollected?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {p.dataCollected.map((d, i) => (
              <span key={i} className="pill pill-unknown text-[10px]">{d}</span>
            ))}
          </div>
        )}
        {/* Legal one-liner */}
        <p className="text-xs text-stone-500 italic leading-relaxed border-t border-stone-100 pt-2">
          {p.gdprLawfulBasis}
        </p>
      </div>
    </div>
  );
}

function Fact({ label, value, mono }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-wider text-stone-400">{label}</div>
      <div className={mono ? 'font-mono truncate' : 'truncate'}>{value || '—'}</div>
    </div>
  );
}
