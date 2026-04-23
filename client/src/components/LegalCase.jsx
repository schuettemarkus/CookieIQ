import React from 'react';

export default function LegalCase({ profile }) {
  return (
    <div className="space-y-5">
      <blockquote className="rounded-xl bg-blue-50/60 border-l-4 border-blue-400 pl-4 py-3 text-sm leading-relaxed text-stone-700">
        {profile.legalCase}
      </blockquote>
      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
        <Field label="GDPR Lawful Basis" value={profile.gdprLawfulBasis} />
        <Field label="Consent Required" value={profile.consentRequired ? 'Yes' : 'No'} />
        {profile.consentReason && (
          <Field label="Consent reason" value={profile.consentReason} wide />
        )}
      </div>
    </div>
  );
}

function Field({ label, value, wide }) {
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <div className="text-[10px] uppercase tracking-wider text-stone-500 mb-1">{label}</div>
      <div className="leading-relaxed">{value || <span className="text-stone-400">—</span>}</div>
    </div>
  );
}
