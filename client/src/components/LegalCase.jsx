import React from 'react';

export default function LegalCase({ profile }) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
        Legal & regulatory justification
      </h3>
      <div className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50/40 dark:bg-blue-950/20 text-sm leading-relaxed">
        {profile.legalCase}
      </div>
      <div className="grid sm:grid-cols-2 gap-3 text-sm">
        <Field label="GDPR Lawful Basis" value={profile.gdprLawfulBasis} />
        <Field label="Consent Required" value={profile.consentRequired ? 'Yes' : 'No'} />
        {profile.consentReason && (
          <div className="sm:col-span-2">
            <div className="text-xs text-stone-500 uppercase">Consent reason</div>
            <div>{profile.consentReason}</div>
          </div>
        )}
      </div>
    </section>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <div className="text-xs text-stone-500 uppercase">{label}</div>
      <div>{value || '—'}</div>
    </div>
  );
}
