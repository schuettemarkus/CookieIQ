import React, { useEffect, useState } from 'react';

const DEFAULT_STEPS = [
  'Scanning cookiepedia.co.uk...',
  'Searching cookie policies...',
  'Analyzing categorizations...',
  'Building legal profile...',
];

export default function LoadingSteps({ steps = DEFAULT_STEPS, intervalMs = 1500 }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI(x => (x + 1) % steps.length), intervalMs);
    return () => clearInterval(t);
  }, [steps, intervalMs]);
  return (
    <div className="card p-6 flex items-center gap-3 animate-pulse">
      <div className="w-2 h-2 rounded-full bg-stone-400 animate-pulse" />
      <div className="font-mono text-sm">{steps[i]}</div>
    </div>
  );
}
