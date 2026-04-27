import React, { useEffect, useRef, useState } from 'react';
import { api } from '../lib.js';
import renderRichHTML from '../renderHTML.js';

export default function ChatPanel({ cookieProfile }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    setMessages([]);
    setSuggestions([]);
    if (!cookieProfile?.cookieName) return;
    api('/api/chat', { method: 'POST', body: { cookieProfile, generateSuggestions: true } })
      .then(d => {
        const norm = (d.suggestions || [])
          .map(s => typeof s === 'string' ? s : (s?.question || s?.text || s?.q || JSON.stringify(s)))
          .filter(Boolean);
        setSuggestions(norm.slice(0, 4));
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

  if (!cookieProfile?.cookieName) return null;

  return (
    <div className="card mt-4 overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-stone-100">
        <span className="font-mono text-sm">{cookieProfile.cookieName}</span>
        <span className="w-2 h-2 rounded-full bg-green-500" />
        <span className="text-xs text-stone-500">Profile loaded as context</span>
      </div>

      {suggestions.length > 0 && messages.length === 0 && (
        <div className="px-5 py-3 flex flex-wrap gap-2 border-b border-stone-100">
          {suggestions.map((s, i) => (
            <button key={i} onClick={() => send(s)} className="text-xs px-3 py-1.5 rounded-full bg-white shadow-sm border border-stone-200/80 hover:shadow-md hover:border-stone-300 transition-all duration-200">
              {s}
            </button>
          ))}
        </div>
      )}

      <div ref={scrollRef} className="px-5 py-3 max-h-60 overflow-y-auto space-y-3 text-sm">
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <div className={
              'inline-block max-w-[85%] px-4 py-2.5 ' +
              (m.role === 'user'
                ? 'bg-blue-600/90 text-white rounded-2xl rounded-br-md'
                : 'bg-white shadow-sm rounded-2xl rounded-bl-md text-stone-800')
            }>
              <div dangerouslySetInnerHTML={{ __html: renderRichHTML(m.content) }} />
            </div>
          </div>
        ))}
        {busy && <div className="text-xs text-stone-500">CookieIQ is thinking...</div>}
      </div>

      <form onSubmit={e => { e.preventDefault(); send(); }} className="p-2 border-t border-stone-100">
        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-sm p-2 flex gap-2">
          <input className="border-0 bg-transparent focus:ring-0 focus:outline-none flex-1 text-sm px-3" placeholder="Ask a follow-up..."
            value={input} onChange={e => setInput(e.target.value)} disabled={busy} />
          <button type="submit" className="rounded-full bg-blue-600/90 text-white px-4 py-2 text-sm hover:bg-blue-600 transition-all" disabled={busy || !input.trim()}>Send</button>
        </div>
      </form>
    </div>
  );
}
