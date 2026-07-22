import Link from 'next/link';
import type { ExpertApplicationReadiness } from '@nexthire/types';

interface ReadinessSummaryProps {
  readiness: ExpertApplicationReadiness;
}

function Check({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.5rem',
        padding: '0.35rem 0',
        color: ok ? '#86efac' : '#fca5a5',
      }}
    >
      <span aria-hidden="true" style={{ fontWeight: 700 }}>
        {ok ? '✓' : '✕'}
      </span>
      <span>
        <span
          style={{
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginRight: '0.35rem',
            color: ok ? '#22c55e' : '#ef4444',
          }}
        >
          {ok ? 'Done' : 'Missing'}
        </span>
        <span style={{ color: '#e4e4e7' }}>{children}</span>
      </span>
    </li>
  );
}

export function ReadinessSummary({ readiness }: ReadinessSummaryProps) {
  const { summary, blockers, ready } = readiness;
  const mfaBlocked = blockers.some((b) => b.code === 'MFA_REQUIRED_BY_POLICY');

  return (
    <section
      aria-label="Submission readiness"
      style={{
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '0.75rem',
        padding: '1.25rem',
      }}
    >
      <h2 style={{ margin: '0 0 0.75rem', color: '#f1f5f9', fontSize: '1.05rem' }}>
        Submission checklist
      </h2>

      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        <Check ok={summary.profileComplete}>Professional profile complete</Check>
        <Check ok={summary.requiredDocumentsPresent}>
          Required verification documents uploaded
        </Check>
        <Check ok={summary.mfaEnabled}>Two-factor authentication (MFA) enabled</Check>
      </ul>

      <p style={{ margin: '0.75rem 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
        {summary.documentCount} document{summary.documentCount === 1 ? '' : 's'} uploaded.
      </p>

      {mfaBlocked && (
        <div
          role="note"
          style={{
            marginTop: '0.85rem',
            padding: '0.75rem 0.9rem',
            borderRadius: '0.6rem',
            background: 'rgba(245,158,11,0.12)',
            border: '1px solid rgba(245,158,11,0.4)',
            color: '#fcd34d',
            fontSize: '0.85rem',
          }}
        >
          <strong>MFA required.</strong> Experts must protect their account with two-factor
          authentication before submitting.{' '}
          <Link href="/settings/security" style={{ color: '#fde68a', textDecoration: 'underline' }}>
            Set up MFA
          </Link>
          .
        </div>
      )}

      {blockers.length > 0 && (
        <div style={{ marginTop: '0.85rem' }}>
          <h3
            style={{
              margin: '0 0 0.4rem',
              color: '#fca5a5',
              fontSize: '0.85rem',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Before you can submit
          </h3>
          <ul style={{ margin: 0, paddingLeft: '1.1rem', color: '#e4e4e7', fontSize: '0.85rem' }}>
            {blockers.map((blocker) => (
              <li key={`${blocker.code}-${blocker.field ?? ''}`} style={{ padding: '0.15rem 0' }}>
                {blocker.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p
        role="status"
        style={{
          marginTop: '1rem',
          fontWeight: 600,
          color: ready ? '#86efac' : '#fcd34d',
        }}
      >
        {ready
          ? '✓ Your application is ready to submit.'
          : '! Complete the items above to submit your application.'}
      </p>
    </section>
  );
}
