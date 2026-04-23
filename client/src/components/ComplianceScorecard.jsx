import React from 'react';

function calculateScore(cookies) {
  const issues = [];
  let score = 100;

  const unknowns = cookies.filter(c => c.suggestedCategory === 'Unknown');
  const preConsentAds = cookies.filter(c => c.preConsent && c.suggestedCategory === 'Advertising');
  const preConsentAnalytics = cookies.filter(c => c.preConsent && c.suggestedCategory === 'Analytics/Performance');
  const noVendor = cookies.filter(c => !c.vendor);

  unknowns.forEach(c => {
    score -= 5;
    issues.push({ cookie: c.name, reason: 'Unknown / uncategorized cookie', deduction: 5 });
  });
  preConsentAds.forEach(c => {
    score -= 3;
    issues.push({ cookie: c.name, reason: 'Advertising cookie fires before consent', deduction: 3 });
  });
  preConsentAnalytics.forEach(c => {
    score -= 2;
    issues.push({ cookie: c.name, reason: 'Analytics cookie fires before consent', deduction: 2 });
  });
  noVendor.forEach(c => {
    score -= 1;
    issues.push({ cookie: c.name, reason: 'No vendor identified', deduction: 1 });
  });

  score = Math.max(0, score);

  const recommendations = [];
  if (unknowns.length > 0)
    recommendations.push(`Research and categorize ${unknowns.length} unknown cookie${unknowns.length > 1 ? 's' : ''}`);
  if (preConsentAds.length > 0)
    recommendations.push(`${preConsentAds.length} advertising cookie${preConsentAds.length > 1 ? 's' : ''} fire before consent \u2014 implement consent gating`);
  if (preConsentAnalytics.length > 0)
    recommendations.push(`Consider deferring ${preConsentAnalytics.length} analytics cookie${preConsentAnalytics.length > 1 ? 's' : ''} until consent`);
  if (noVendor.length > 0)
    recommendations.push(`Identify vendors for ${noVendor.length} unattributed cookie${noVendor.length > 1 ? 's' : ''}`);

  return { score, issues, recommendations };
}

function getGrade(score) {
  if (score >= 90) return { letter: 'A', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', ring: 'stroke-green-500' };
  if (score >= 80) return { letter: 'B', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', ring: 'stroke-blue-500' };
  if (score >= 70) return { letter: 'C', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', ring: 'stroke-amber-500' };
  if (score >= 60) return { letter: 'D', color: 'text-red-400', bg: 'bg-red-50', border: 'border-red-200', ring: 'stroke-red-400' };
  return { letter: 'F', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', ring: 'stroke-red-500' };
}

export default function ComplianceScorecard({ cookies }) {
  if (!cookies || cookies.length === 0) return null;

  const { score, issues, recommendations } = calculateScore(cookies);
  const grade = getGrade(score);

  // SVG circular gauge
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="card p-6 space-y-6 overflow-hidden">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">Compliance Scorecard</h3>

      {/* Score display */}
      <div className="flex items-center gap-8">
        <div className="relative w-32 h-32 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r={radius} fill="none" stroke="#e7e5e4" strokeWidth="8" />
            <circle cx="60" cy="60" r={radius} fill="none" className={grade.ring} strokeWidth="8"
              strokeDasharray={circumference} strokeDashoffset={offset}
              strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-bold ${grade.color}`}>{score}</span>
            <span className={`text-lg font-semibold ${grade.color}`}>{grade.letter}</span>
          </div>
        </div>
        <div>
          <div className="text-sm text-stone-600">
            {score >= 90 && 'Excellent compliance posture. Minor improvements possible.'}
            {score >= 70 && score < 90 && 'Good foundation with some issues to address.'}
            {score >= 50 && score < 70 && 'Several compliance gaps need attention.'}
            {score < 50 && 'Significant compliance risks detected. Immediate action recommended.'}
          </div>
          <div className="text-xs text-stone-400 mt-1">{cookies.length} cookies scanned, {issues.length} issue{issues.length !== 1 ? 's' : ''} found</div>
        </div>
      </div>

      {/* Issues */}
      {issues.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">Issues found</h4>
          <div className="space-y-1">
            {issues.map((issue, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-1.5 px-3 rounded-xl bg-stone-50">
                <span>
                  <span className="font-mono text-xs text-stone-700">{issue.cookie}</span>
                  <span className="text-stone-500 ml-2">{issue.reason}</span>
                </span>
                <span className="text-xs text-red-500 font-medium">-{issue.deduction}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">Recommendations</h4>
          <ul className="space-y-1.5">
            {recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-stone-700">
                <span className="text-stone-400 mt-0.5">&#8226;</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
