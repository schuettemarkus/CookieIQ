import React, { useState } from 'react';
import SearchBar, { pushRecent } from './components/SearchBar.jsx';
import LoadingSteps from './components/LoadingSteps.jsx';
import CookieProfile from './components/CookieProfile.jsx';
import ChatPanel from './components/ChatPanel.jsx';
import SiteScanner from './components/SiteScanner.jsx';
import ScanHistory from './components/ScanHistory.jsx';
import { api } from './lib.js';

const TABS = [
  { id: 'lookup',  label: 'Lookup' },
  { id: 'scanner', label: 'Scan' },
  { id: 'history', label: 'History' },
];

export default function App() {
  const [tab, setTab] = useState('lookup');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [dark, setDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);

  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  const research = async (query) => {
    setError(''); setProfile(null); setLoading(true);
    setTab('lookup');
    setActiveQuery(query);
    pushRecent(query);
    try {
      const data = await api('/api/research', { method: 'POST', body: { query } });
      setProfile(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 no-print">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">CookieIQ</h1>
            <p className="text-xs text-stone-500">Cookie research & categorization intelligence.</p>
          </div>
          <button onClick={() => setDark(d => !d)} className="btn">{dark ? '☀ Light' : '☾ Dark'}</button>
        </div>
        <nav className="max-w-6xl mx-auto px-6 flex gap-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={'px-3 py-2 text-sm border-b-2 -mb-px ' +
                (tab === t.id ? 'border-stone-900 dark:border-stone-100 font-medium' : 'border-transparent text-stone-500 hover:text-stone-700 dark:hover:text-stone-300')}>
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {tab === 'lookup' && (
          <>
            <SearchBar onSearch={research} loading={loading} query={activeQuery} />
            {error && <div className="card p-4 text-sm text-red-600">{error}</div>}
            {loading && <LoadingSteps />}
            {profile && (
              <>
                <CookieProfile profile={profile} />
                <ChatPanel cookieProfile={profile} />
              </>
            )}
          </>
        )}
        {tab === 'scanner' && <SiteScanner onResearchCookie={research} />}
        {tab === 'history' && <ScanHistory onResearchCookie={research} />}
      </main>
    </div>
  );
}
