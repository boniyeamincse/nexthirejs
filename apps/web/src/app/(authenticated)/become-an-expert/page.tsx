'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ApiClientError, createMyExpertApplication } from '@/lib/api-client';
import { useExpertApplicant } from '@/features/experts/hooks/useExpertApplicant';
import { StatusBadge } from '@/features/experts/components/StatusBadge';
import { isApplicationEditable } from '@/features/experts/lib/expert-presentation';

const BENEFITS = [
  'Run paid mock interviews and share your expertise with candidates.',
  'Build a verified professional reputation on NextHire.',
  'Control your own availability once you are approved.',
];

const RESPONSIBILITIES = [
  'Provide accurate professional information and genuine credentials.',
  'Complete identity and professional verification.',
  'Protect your account with two-factor authentication (MFA).',
];

export default function BecomeAnExpertPage() {
  const { authStatus, loading, error, application, refetch, getAccessToken } = useExpertApplicant();
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const handleStart = async () => {
    const token = getAccessToken();
    if (!token) return;
    setStarting(true);
    setStartError(null);
    try {
      await createMyExpertApplication(token);
      router.push('/expert/profile');
    } catch (err) {
      if (err instanceof ApiClientError && err.statusCode === 409) {
        // Application already exists — continue the existing one.
        await refetch();
        router.push('/expert/profile');
        return;
      }
      setStartError(
        err instanceof Error
          ? err.message
          : 'We could not start your application. Please try again.',
      );
    } finally {
      setStarting(false);
    }
  };

  if (authStatus === 'unknown' || authStatus === 'loading' || loading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <p style={{ color: '#94a3b8' }}>Loading…</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 style={{ color: '#f1f5f9', fontSize: '1.8rem', fontWeight: 700, margin: '0 0 0.5rem' }}>
        Become an Expert
      </h1>
      <p style={{ color: '#94a3b8', margin: '0 0 1.75rem' }}>
        Apply to offer mock interviews and mentorship. Applications are reviewed by our team before
        the Expert role is granted.
      </p>

      {error && (
        <div
          role="alert"
          style={{
            marginBottom: '1.25rem',
            padding: '0.75rem 0.9rem',
            borderRadius: '0.6rem',
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.4)',
            color: '#fca5a5',
          }}
        >
          {error}{' '}
          <button
            onClick={() => void refetch()}
            style={{
              marginLeft: '0.5rem',
              textDecoration: 'underline',
              background: 'none',
              border: 'none',
              color: '#fca5a5',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {application && (
        <section
          aria-label="Current application status"
          style={{
            marginBottom: '1.75rem',
            padding: '1.1rem',
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ color: '#e4e4e7', fontWeight: 600 }}>Your application:</span>
            <StatusBadge status={application.status} />
          </div>
          <div style={{ marginTop: '0.85rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link
              href="/expert/application-status"
              style={{ color: '#93c5fd', textDecoration: 'underline' }}
            >
              View application status
            </Link>
            {isApplicationEditable(application.status) && (
              <Link
                href="/expert/profile"
                style={{ color: '#93c5fd', textDecoration: 'underline' }}
              >
                Continue editing
              </Link>
            )}
          </div>
        </section>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        <section
          aria-label="Benefits"
          style={{
            padding: '1.1rem',
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '0.75rem',
          }}
        >
          <h2 style={{ color: '#f1f5f9', fontSize: '1.05rem', margin: '0 0 0.6rem' }}>
            What you get
          </h2>
          <ul style={{ margin: 0, paddingLeft: '1.1rem', color: '#cbd5e1', fontSize: '0.88rem' }}>
            {BENEFITS.map((benefit) => (
              <li key={benefit} style={{ padding: '0.2rem 0' }}>
                {benefit}
              </li>
            ))}
          </ul>
        </section>
        <section
          aria-label="Responsibilities"
          style={{
            padding: '1.1rem',
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '0.75rem',
          }}
        >
          <h2 style={{ color: '#f1f5f9', fontSize: '1.05rem', margin: '0 0 0.6rem' }}>
            What we ask
          </h2>
          <ul style={{ margin: 0, paddingLeft: '1.1rem', color: '#cbd5e1', fontSize: '0.88rem' }}>
            {RESPONSIBILITIES.map((item) => (
              <li key={item} style={{ padding: '0.2rem 0' }}>
                {item}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section
        role="note"
        aria-label="Verification and security requirements"
        style={{
          marginBottom: '1.75rem',
          padding: '1rem 1.1rem',
          background: 'rgba(245,158,11,0.1)',
          border: '1px solid rgba(245,158,11,0.35)',
          borderRadius: '0.75rem',
        }}
      >
        <h2 style={{ color: '#fcd34d', fontSize: '1rem', margin: '0 0 0.5rem' }}>
          Before you can be approved
        </h2>
        <p style={{ color: '#fde68a', fontSize: '0.88rem', margin: 0 }}>
          You must upload a government-issued ID and at least one proof of profession, and you must
          enable <strong>two-factor authentication (MFA)</strong> before submitting. You can start
          drafting now and enable MFA later.{' '}
          <Link href="/settings/security" style={{ color: '#fef3c7', textDecoration: 'underline' }}>
            Manage account security
          </Link>
          .
        </p>
      </section>

      {startError && (
        <p role="alert" style={{ marginBottom: '1rem', color: '#fca5a5', fontSize: '0.9rem' }}>
          {startError}
        </p>
      )}

      {!application ? (
        <button
          type="button"
          onClick={handleStart}
          disabled={starting}
          style={{
            padding: '0.7rem 1.6rem',
            background: starting ? '#334155' : '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '0.5rem',
            fontWeight: 600,
            fontSize: '1rem',
            cursor: starting ? 'not-allowed' : 'pointer',
          }}
        >
          {starting ? 'Starting…' : 'Start your application'}
        </button>
      ) : (
        <Link
          href={
            isApplicationEditable(application.status)
              ? '/expert/profile'
              : '/expert/application-status'
          }
          style={{
            display: 'inline-block',
            padding: '0.7rem 1.6rem',
            background: '#2563eb',
            color: '#fff',
            borderRadius: '0.5rem',
            fontWeight: 600,
            fontSize: '1rem',
            textDecoration: 'none',
          }}
        >
          {isApplicationEditable(application.status)
            ? 'Continue your application'
            : 'View your application'}
        </Link>
      )}
    </div>
  );
}
