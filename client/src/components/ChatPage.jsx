import React, { useEffect, useRef, useState } from 'react';
import { api } from '../lib.js';
import renderRichHTML from '../renderHTML.js';

function splitIntoSections(text) {
  const lines = text.split('\n');
  const sections = [];
  let current = { heading: null, lines: [] };

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,2})\s+(.+)$/);
    if (headingMatch && headingMatch[1].length <= 2) {
      if (current.heading || current.lines.some(l => l.trim())) {
        sections.push({ ...current });
      }
      current = { heading: headingMatch[2].trim(), level: headingMatch[1].length, lines: [] };
    } else {
      current.lines.push(line);
    }
  }
  if (current.heading || current.lines.some(l => l.trim())) {
    sections.push(current);
  }

  if (sections.length <= 1 && !sections[0]?.heading) {
    return [{ heading: null, body: text }];
  }

  return sections.map(s => ({
    heading: s.heading || null,
    level: s.level || 0,
    body: s.lines.join('\n').trim(),
  }));
}

// SF Symbol-style SVG icons for section themes.
const ICONS = {
  check: '<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>',
  warning: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>',
  scale: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z"/>',
  lightbulb: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"/>',
  beaker: '<path stroke-linecap="round" stroke-linejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"/>',
  shield: '<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>',
  cookie: '<path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>',
  database: '<path stroke-linecap="round" stroke-linejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"/>',
  arrow: '<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"/>',
  star: '<path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/>',
  users: '<path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"/>',
  doc: '<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>',
  chart: '<path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/>',
};

function SvgIcon({ name, className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"
      dangerouslySetInnerHTML={{ __html: ICONS[name] || ICONS.check }} />
  );
}

const SECTION_THEMES = [
  { keywords: /checklist|verification|audit|review|assess|inspect/i,            icon: 'check',     color: 'emerald',  style: 'checklist' },
  { keywords: /warning|risk|caution|danger|critical|important|alert/i,          icon: 'warning',   color: 'amber',    style: 'callout' },
  { keywords: /legal|regulation|gdpr|ccpa|eprivacy|article|directive|law/i,     icon: 'scale',     color: 'blue',     style: 'legal' },
  { keywords: /recommend|suggestion|best practice|tip|advice|should/i,          icon: 'lightbulb', color: 'violet',   style: 'tip' },
  { keywords: /example|case study|scenario|illustration|instance/i,             icon: 'beaker',    color: 'cyan',     style: 'example' },
  { keywords: /consent|permission|opt-in|opt-out|banner|cmp/i,                  icon: 'shield',    color: 'indigo',   style: 'accent' },
  { keywords: /cookie|tracking|pixel|fingerprint|storage|session/i,             icon: 'cookie',    color: 'orange',   style: 'accent' },
  { keywords: /data|process|transfer|collect|store|retain|delete/i,             icon: 'database',  color: 'teal',     style: 'accent' },
  { keywords: /step|process|procedure|workflow|implementation|how to/i,         icon: 'arrow',     color: 'sky',      style: 'steps' },
  { keywords: /summary|conclusion|overview|key takeaway|next step|action/i,     icon: 'star',      color: 'rose',     style: 'summary' },
  { keywords: /vendor|third.party|partner|contractor|dpa|contract/i,            icon: 'users',     color: 'fuchsia',  style: 'accent' },
  { keywords: /document|record|log|evidence|proof|maintain/i,                   icon: 'doc',       color: 'stone',    style: 'default' },
  { keywords: /categor|breakdown|distribut|percent|proportion|ratio/i,          icon: 'chart',     color: 'sky',      style: 'chart' },
];

function detectTheme(heading, body, index) {
  const text = (heading || '') + ' ' + (body || '').slice(0, 200);
  for (const t of SECTION_THEMES) {
    if (t.keywords.test(text)) return t;
  }
  const fallbackColors = ['blue', 'violet', 'emerald', 'amber', 'cyan', 'indigo', 'teal', 'rose'];
  const fallbackIcons = ['lightbulb', 'shield', 'doc', 'check', 'arrow', 'database', 'star', 'scale'];
  const ci = index % fallbackColors.length;
  return { icon: fallbackIcons[ci], color: fallbackColors[ci], style: 'default' };
}

// Extract percentages/numbers from body text to render inline mini charts.
function extractChartData(body) {
  const items = [];
  const pctRegex = /(\w[\w\s/]*?)\s*[:–—-]\s*(\d{1,3})%/g;
  let m;
  while ((m = pctRegex.exec(body)) !== null) {
    items.push({ label: m[1].trim(), value: parseInt(m[2]) });
  }
  if (items.length >= 2 && items.length <= 8) return items;
  return null;
}

function MiniBarChart({ data }) {
  const max = Math.max(...data.map(d => d.value), 1);
  const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#06b6d4', '#6366f1', '#14b8a6', '#f43f5e'];
  return (
    <div className="mt-4 space-y-2">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3 text-xs">
          <span className="w-28 text-right text-stone-500 truncate">{d.label}</span>
          <div className="flex-1 h-5 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(d.value / max) * 100}%`, backgroundColor: colors[i % colors.length] }}
            />
          </div>
          <span className="w-10 text-stone-600 font-mono">{d.value}%</span>
        </div>
      ))}
    </div>
  );
}

function MiniDonut({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#06b6d4', '#6366f1', '#14b8a6', '#f43f5e'];
  let cumulative = 0;
  const r = 40, cx = 50, cy = 50;
  const circumference = 2 * Math.PI * r;

  return (
    <div className="mt-4 flex items-center gap-6 justify-center">
      <svg viewBox="0 0 100 100" className="w-24 h-24">
        {data.map((d, i) => {
          const pct = d.value / total;
          const offset = circumference * (1 - cumulative / total);
          cumulative += d.value;
          return (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={colors[i % colors.length]} strokeWidth={12}
              strokeDasharray={`${circumference * pct} ${circumference * (1 - pct)}`}
              strokeDashoffset={offset}
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          );
        })}
      </svg>
      <div className="space-y-1">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
            <span className="text-stone-600">{d.label}</span>
            <span className="font-mono text-stone-800">{d.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const COLOR_MAP = {
  emerald:  { bg: 'bg-emerald-50/60', border: 'border-l-emerald-400', iconBg: 'bg-emerald-100', iconText: 'text-emerald-600', heading: 'text-emerald-900' },
  amber:    { bg: 'bg-amber-50/60',   border: 'border-l-amber-400',   iconBg: 'bg-amber-100',   iconText: 'text-amber-600',   heading: 'text-amber-900' },
  blue:     { bg: 'bg-blue-50/60',    border: 'border-l-blue-400',    iconBg: 'bg-blue-100',    iconText: 'text-blue-600',    heading: 'text-blue-900' },
  violet:   { bg: 'bg-violet-50/60',  border: 'border-l-violet-400',  iconBg: 'bg-violet-100',  iconText: 'text-violet-600',  heading: 'text-violet-900' },
  cyan:     { bg: 'bg-cyan-50/60',    border: 'border-l-cyan-400',    iconBg: 'bg-cyan-100',    iconText: 'text-cyan-600',    heading: 'text-cyan-900' },
  indigo:   { bg: 'bg-indigo-50/60',  border: 'border-l-indigo-400',  iconBg: 'bg-indigo-100',  iconText: 'text-indigo-600',  heading: 'text-indigo-900' },
  orange:   { bg: 'bg-orange-50/60',  border: 'border-l-orange-400',  iconBg: 'bg-orange-100',  iconText: 'text-orange-600',  heading: 'text-orange-900' },
  teal:     { bg: 'bg-teal-50/60',    border: 'border-l-teal-400',    iconBg: 'bg-teal-100',    iconText: 'text-teal-600',    heading: 'text-teal-900' },
  sky:      { bg: 'bg-sky-50/60',     border: 'border-l-sky-400',     iconBg: 'bg-sky-100',     iconText: 'text-sky-600',     heading: 'text-sky-900' },
  rose:     { bg: 'bg-rose-50/60',    border: 'border-l-rose-400',    iconBg: 'bg-rose-100',    iconText: 'text-rose-600',    heading: 'text-rose-900' },
  fuchsia:  { bg: 'bg-fuchsia-50/60', border: 'border-l-fuchsia-400', iconBg: 'bg-fuchsia-100', iconText: 'text-fuchsia-600', heading: 'text-fuchsia-900' },
  stone:    { bg: 'bg-stone-50',      border: 'border-l-stone-300',   iconBg: 'bg-stone-200',   iconText: 'text-stone-600',   heading: 'text-stone-900' },
};

function ResponseSections({ content }) {
  const sections = splitIntoSections(content);

  // Single plain section — simple card.
  if (sections.length === 1 && !sections[0].heading) {
    return (
      <article className="card p-6 sm:p-8">
        <div dangerouslySetInnerHTML={{ __html: renderRichHTML(content) }} />
      </article>
    );
  }

  return (
    <div className="space-y-4">
      {sections.map((s, i) => {
        const theme = detectTheme(s.heading, s.body, i);
        const c = COLOR_MAP[theme.color] || COLOR_MAP.blue;

        // Intro/preamble (no heading) — subtle card.
        if (!s.heading) {
          return (
            <article key={i} className="card p-6 sm:p-8 text-stone-600">
              <div dangerouslySetInnerHTML={{ __html: renderRichHTML(s.body) }} />
            </article>
          );
        }

        const chartData = extractChartData(s.body);
        const IconEl = <SvgIcon name={theme.icon} className={`w-4 h-4 ${c.iconText}`} />;
        const heading = (
          <div className="flex items-center gap-2.5 mb-3">
            <span className={`flex-shrink-0 w-8 h-8 rounded-xl ${c.iconBg} flex items-center justify-center`}>
              {IconEl}
            </span>
            <h3 className={`text-base font-semibold ${c.heading}`}>{s.heading}</h3>
          </div>
        );
        const bodyHtml = <div dangerouslySetInnerHTML={{ __html: renderRichHTML(s.body) }} />;
        const chart = chartData && (i % 2 === 0
          ? <MiniBarChart data={chartData} />
          : <MiniDonut data={chartData} />);

        // Callout style.
        if (theme.style === 'callout') {
          return (
            <article key={i} className={`rounded-2xl shadow-sm ${c.bg} border-l-4 ${c.border} p-6 sm:p-8`}>
              {heading}{bodyHtml}{chart}
            </article>
          );
        }

        // Summary style.
        if (theme.style === 'summary') {
          return (
            <article key={i} className={`rounded-2xl shadow-sm ${c.bg} p-6 sm:p-8`}>
              {heading}{bodyHtml}{chart}
            </article>
          );
        }

        // Legal style.
        if (theme.style === 'legal') {
          return (
            <article key={i} className={`rounded-2xl shadow-sm bg-white border-l-4 ${c.border} p-6 sm:p-8`}>
              {heading}<div className="pl-1">{bodyHtml}</div>{chart}
            </article>
          );
        }

        // Checklist / steps.
        if (theme.style === 'checklist' || theme.style === 'steps') {
          return (
            <article key={i} className={`rounded-2xl shadow-sm bg-white border-l-4 ${c.border} p-6 sm:p-8`}>
              {heading}{bodyHtml}{chart}
            </article>
          );
        }

        // Tip style.
        if (theme.style === 'tip') {
          return (
            <article key={i} className={`rounded-2xl shadow-sm ${c.bg} p-6 sm:p-8`}>
              {heading}{bodyHtml}{chart}
            </article>
          );
        }

        // Example style.
        if (theme.style === 'example') {
          return (
            <article key={i} className="rounded-2xl shadow-sm bg-white border border-dashed border-stone-200 p-6 sm:p-8">
              {heading}{bodyHtml}{chart}
            </article>
          );
        }

        // Chart-focused style.
        if (theme.style === 'chart') {
          return (
            <article key={i} className={`rounded-2xl shadow-sm bg-white border-t-4 ${c.border} p-6 sm:p-8`}>
              {heading}{bodyHtml}
              {chart || <MiniBarChart data={[{ label: 'Data', value: 100 }]} />}
            </article>
          );
        }

        // Default — white card with colored top bar.
        return (
          <article key={i} className="rounded-2xl shadow-sm bg-white overflow-hidden">
            <div className={`h-1 ${c.iconBg}`} />
            <div className="p-6 sm:p-8">
              {heading}{bodyHtml}{chart}
            </div>
          </article>
        );
      })}
    </div>
  );
}

const SCENARIOS = [
  {
    icon: '🛡️', iconBg: 'bg-blue-50',
    title: 'Prepare for a DPA audit',
    description: 'Step-by-step checklist for Data Protection Authority audits',
    prompt: 'I need to prepare for a Data Protection Authority audit. Walk me through a step-by-step checklist covering: cookie inventory verification, consent mechanism review, data processing records, third-party vendor assessment, and documentation requirements.',
  },
  {
    icon: '🔍', iconBg: 'bg-green-50',
    title: 'Evaluate a vendor\'s cookies',
    description: 'Assess third-party cookie usage, data flows, and DPA requirements',
    prompt: 'Help me evaluate a new third-party vendor\'s cookie usage. I need to assess: what cookies they set, their categorization, data flows, GDPR lawful basis, required consent mechanisms, and contractual requirements I should include in our DPA.',
  },
  {
    icon: '📋', iconBg: 'bg-purple-50',
    title: 'Build a cookie policy',
    description: 'Comprehensive policy covering GDPR, ePrivacy, and CCPA',
    prompt: 'Help me build a comprehensive cookie policy from scratch. Guide me through each section: what cookies we use, purposes, durations, third parties, user rights, consent management, and how to keep it updated. Make it legally sound for GDPR, ePrivacy, and CCPA.',
  },
  {
    icon: '⚠️', iconBg: 'bg-amber-50',
    title: 'Compliance gap review',
    description: 'Identify gaps in consent, categorization, and data retention',
    prompt: 'Conduct a compliance gap review for my website\'s cookie implementation. Help me identify gaps in: consent collection, cookie categorization accuracy, pre-consent cookie firing, data retention alignment, cross-border transfer considerations, and user rights mechanisms.',
  },
];

function getScanContext() {
  try {
    const raw = localStorage.getItem('cookieiq.lastScan');
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || !data.cookies) return null;
    return { domain: data.domain || 'unknown', cookieCount: data.cookies.length, lastScan: data };
  } catch { return null; }
}

function formatDate() {
  return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function ChatPage({ onSendRef, initialMessages }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [contextMode, setContextMode] = useState('general');
  const scrollRef = useRef(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const [initId, setInitId] = useState(null);

  useEffect(() => {
    const id = initialMessages ? JSON.stringify(initialMessages).slice(0, 100) : null;
    if (id === initId) return;
    setInitId(id);

    if (!initialMessages) {
      setMessages([]);
      return;
    }
    const msgs = initialMessages.messages || initialMessages;
    if (!Array.isArray(msgs) || !msgs.length) return;
    setMessages(msgs);

    if (initialMessages.autoFollowUp) {
      setTimeout(() => {
        sendMessage(msgs, initialMessages.autoFollowUp);
      }, 300);
    }
  }, [initialMessages]);

  const scanContext = contextMode === 'mysite' ? getScanContext() : null;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 9e9, behavior: 'smooth' });
  }, [messages, busy]);

  const sendMessage = async (currentMessages, text) => {
    const content = String(text).trim();
    if (!content) return;
    const next = [...currentMessages, { role: 'user', content }];
    setMessages(next);
    setBusy(true);
    try {
      let cookieProfile = {};
      if (contextMode === 'mysite') {
        const ctx = getScanContext();
        if (ctx) cookieProfile = { _siteContext: true, lastScan: ctx.lastScan };
      }
      const data = await api('/api/chat', { method: 'POST', body: { messages: next, cookieProfile } });
      setMessages([...next, { role: 'assistant', content: data.reply || '(no reply)' }]);
    } catch (err) {
      setMessages([...next, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setBusy(false);
    }
  };

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || busy) return;
    setInput('');
    await sendMessage(messagesRef.current, content);
  };

  useEffect(() => {
    if (onSendRef) onSendRef(() => send);
  }, [onSendRef]);

  const isEmpty = messages.length === 0;

  const copyMarkdown = () => {
    const lines = [`# CookieIQ Consultation — ${formatDate()}\n`];
    messages.forEach(m => {
      lines.push(`## ${m.role === 'user' ? 'User' : 'CookieIQ'}`);
      lines.push(m.content);
      lines.push('');
    });
    navigator.clipboard.writeText(lines.join('\n'));
  };

  return (
    <div className="flex flex-col flex-1">
      {/* Scenario cards */}
      {isEmpty && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {SCENARIOS.map((s, i) => (
            <button key={i} onClick={() => send(s.prompt)}
              className="card px-5 py-5 text-left hover:shadow-md hover:scale-[1.02] transition-all duration-200 group cursor-pointer">
              <div className={'w-10 h-10 rounded-xl flex items-center justify-center text-lg ' + s.iconBg}>
                {s.icon}
              </div>
              <div className="text-sm font-semibold text-stone-800 group-hover:text-stone-900 mt-3">{s.title}</div>
              <div className="text-xs text-stone-500 leading-snug mt-1">{s.description}</div>
            </button>
          ))}
        </div>
      )}

      {/* Content area — rich flowing document */}
      {!isEmpty && (
        <div ref={scrollRef} className="flex-1 overflow-y-auto pb-4">
          {/* Actions bar */}
          <div className="flex justify-end items-center gap-3 mb-4">
            <button onClick={copyMarkdown} className="text-[10px] text-stone-400 hover:text-blue-600 transition-all">
              Copy as Markdown
            </button>
            <button onClick={() => window.print()} className="text-[10px] text-stone-400 hover:text-blue-600 transition-all">
              Export PDF
            </button>
            <button onClick={() => setMessages([])} className="text-[10px] text-stone-400 hover:text-red-500 transition-all">
              Clear
            </button>
          </div>

          {/* Rendered sections */}
          <div className="space-y-5">
            {messages.map((m, i) => (
              m.role === 'user' ? (
                <div key={i} className="flex items-center gap-3 my-2">
                  <div className="h-px flex-1 bg-stone-200" />
                  <span className="text-xs text-stone-400 font-medium shrink-0 px-2">{m.content}</span>
                  <div className="h-px flex-1 bg-stone-200" />
                </div>
              ) : (
                <ResponseSections key={i} content={m.content} />
              )
            ))}
          </div>

          {/* Thinking indicator */}
          {busy && (
            <div className="card p-6 mt-6 flex items-center gap-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-sm text-stone-500">CookieIQ is preparing your consultation...</span>
            </div>
          )}
        </div>
      )}

      {/* Context toggle + input */}
      <div className={isEmpty ? '' : 'mt-4'}>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex bg-stone-100 rounded-full p-0.5">
            <button
              onClick={() => setContextMode('general')}
              className={'px-3 py-1 rounded-full text-xs transition-all ' +
                (contextMode === 'general' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-stone-500 hover:text-stone-700')}>
              General
            </button>
            <button
              onClick={() => setContextMode('mysite')}
              className={'px-3 py-1 rounded-full text-xs transition-all ' +
                (contextMode === 'mysite' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-stone-500 hover:text-stone-700')}>
              My Site
            </button>
          </div>
          {contextMode === 'mysite' && (
            <span className="text-[10px] text-stone-400">
              {scanContext
                ? `${scanContext.cookieCount} cookies from ${scanContext.domain}`
                : 'No scan data — run a scan first'}
            </span>
          )}
        </div>

        <form onSubmit={e => { e.preventDefault(); send(); }} className="bg-white/80 backdrop-blur rounded-2xl shadow-sm p-2 flex gap-2">
          <input
            className="border-0 bg-transparent focus:ring-0 focus:outline-none flex-1 text-sm px-3"
            placeholder="Ask about cookies, compliance, or privacy law..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={busy}
          />
          <button type="submit" className="rounded-full bg-blue-600/90 text-white px-4 py-2 text-sm hover:bg-blue-600 transition-all" disabled={busy || !input.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
