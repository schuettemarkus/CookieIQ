import React, { useEffect, useRef, useState } from 'react';
import { api } from '../lib.js';

function renderMarkdown(text) {
  const escape = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  return escape(text)
    .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-stone-200 dark:bg-stone-800 font-mono text-xs">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>');
}

export default function ChatPanel({ cookieProfile }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    setMessages([]);
    setSuggestions([]);
    if (!cookieProfile) return;
    api('/api/chat', { method: 'POST', body: { cookieProfile, generateSuggestions: true } })
      .then(d => {
        const norm = (d.suggestions || [])
          .map(s => typeof s === 'string' ? s : (s?.question || s?.text || s?.q || JSON.stringify(s)))
          .filter(Boolean);
        setSuggestions(norm);
      })
      .catch(() => {});
  }, [cookieProfile?.cookieName]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 9e9, behavior: 'smooth' });
  }, [messages, busy]);

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content) return;
    setInput('');
    const next = [...messages, { role: 'user', content }];
    setMessages(next);
    setBusy(true);
    try {
      const data = await api('/api/chat', { method: 'POST', body: { messages: next, cookieProfile } });
      setMessages([...next, { role: 'assistant', content: data.reply || '(no reply)' }]);
    } catch (err) {
      setMessages([...next, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setBusy(false);
    }
  };

  if (!cookieProfile) return null;

  return (
    <div className="card mt-4">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-stone-200 dark:border-stone-800">
        <span className="font-mono text-sm">{cookieProfile.cookieName}</span>
        <span className="w-2 h-2 rounded-full bg-green-500" />
        <span className="text-xs text-stone-500">Cookie profile loaded as context</span>
      </div>

      {suggestions.length > 0 && messages.length === 0 && (
        <div className="px-4 py-3 flex flex-wrap gap-2 border-b border-stone-200 dark:border-stone-800">
          {suggestions.map((s, i) => (
            <button key={i} onClick={() => send(s)} className="text-xs px-2 py-1 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700">
              {s}
            </button>
          ))}
        </div>
      )}

      <div ref={scrollRef} className="px-4 py-3 max-h-80 overflow-y-auto space-y-3 text-sm">
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'text-right' : ''}>
            <div className={
              'inline-block max-w-[85%] px-3 py-2 rounded-lg ' +
              (m.role === 'user'
                ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                : 'bg-stone-100 dark:bg-stone-800')
            }>
              <div dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }} />
            </div>
          </div>
        ))}
        {busy && <div className="text-xs text-stone-500">CookieIQ is thinking…</div>}
      </div>

      <form onSubmit={e => { e.preventDefault(); send(); }} className="p-3 border-t border-stone-200 dark:border-stone-800 flex gap-2">
        <input className="input" placeholder="Ask a follow-up…"
          value={input} onChange={e => setInput(e.target.value)} disabled={busy} />
        <button type="submit" className="btn-primary" disabled={busy || !input.trim()}>Send</button>
      </form>
    </div>
  );
}
