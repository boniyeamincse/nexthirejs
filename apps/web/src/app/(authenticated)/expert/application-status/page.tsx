'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ApiClientError, withdrawMyExpertApplication } from '@/lib/api-client';
import { useExpertApplicant } from '@/features/experts/hooks/useExpertApplicant';
import { ApplicationTimeline } from '@/features/experts/components/ApplicationTimeline';
import { StatusBadge } from '@/features/experts/components/StatusBadge';
import { ExpertNav } from '@/features/experts/components/ExpertNav';
import {
  REJECTION_REASON_LABELS,
  isApplicationEditable,
} from '@/features/experts/lib/expert-presentation';

const WITHDRAWABLE = ['DRAFT', 'SUBMITTED', 'CHANGES_REQUESTED'];

export default function ExpertApplicationStatusPage() {
  const { authStatus, loading, error, application, readiness, refetch, getAccessToken } =
    useExpertApplicant();

  const [withdrawing, setWithdrawing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmingWithdraw, setConfirmingWithdraw] = useState(false);

  const handleWithdraw = async () => {
    const token = getAccessToken();
    if (!token) return;
    setWithdrawing(true);
    setActionError(null);
    try {
      await withdrawMyExpertApplication(token);
      setConfirmingWithdraw(false);
      await refetch();
    } catch (err) {
      setActionError(
        err instanceof ApiClientError ? err.message : 'We could not withdraw your application.',
      );
    } finally {
      setWithdrawing(false);
    }
  };

  if (authStatus === 'unknown' || authStatus === 'loading' || loading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <p style={{ color: '#94a3b8' }}>Loading application status…</p>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <h1 style={{ color: '#f1f5f9', fontSize: '1.6rem', fontWeight: 700 }}>
          Application status
        </h1>
        <p style={{ color: '#94a3b8', margin: '0.75rem 0 1.25rem' }}>
          You have not started an expert application yet.
        </p>
        <Link href="/become-an-expert" style={{ color: '#93c5fd', textDecoration: 'underline' }}>
          Become an expert
        </Link>
      </div>
    );
  }

  const editable = isApplicationEditable(application.status);
  const canWithdraw = WITHDRAWABLE.includes(application.status);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 style={{ color: '#f1f5f9', fontSize: '1.6rem', fontWeight: 700, margin: '0 0 0.35rem' }}>
        Application status
      </h1>
      <p style={{ color: '#94a3b8', margin: '0 0 1.25rem' }}>
        Track where your expert application is in the review process.
      </p>

      <ExpertNav active="status" />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          margin: '1.25rem 0',
          flexWrap: 'wrap',
        }}
      >
        <StatusBadge status={application.status} />
        <span style={{ color: '#64748b', fontSize: '0.83rem' }}>
          Submission #{application.submissionVersion}
        </span>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            margin: '1rem 0',
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

      <section
        style={{
          padding: '1.25rem',
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '0.75rem',
          marginBottom: '1.5rem',
        }}
      >
        <ApplicationTimeline application={application} />
      </section>

      {/* Reviewer feedback */}
      {application.status === 'CHANGES_REQUESTED' && application.reviewerNote && (
        <section
          aria-label="Requested changes"
          style={{
            padding: '1rem 1.1rem',
            background: 'rgba(245,158,11,0.1)',
            border: '1px solid rgba(245,158,11,0.35)',
            borderRadius: '0.75rem',
            marginBottom: '1.25rem',
          }}
        >
          <h2 style={{ color: '#fcd34d', fontSize: '1rem', margin: '0 0 0.5rem' }}>
            Reviewer requested changes
          </h2>
          <p style={{ color: '#fde68a', fontSize: '0.9rem', margin: 0, whiteSpace: 'pre-wrap' }}>
            {application.reviewerNote}
          </p>
        </section>
      )}

      {application.status === 'REJECTED' && (
        <section
          aria-label="Rejection details"
          style={{
            padding: '1rem 1.1rem',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.35)',
            borderRadius: '0.75rem',
            marginBottom: '1.25rem',
          }}
        >
          <h2 style={{ color: '#fca5a5', fontSize: '1rem', margin: '0 0 0.5rem' }}>
            Application rejected
          </h2>
          {application.decisionReasonCode && (
            <p style={{ color: '#fecaca', fontSize: '0.9rem', margin: '0 0 0.4rem' }}>
              Reason:{' '}
              {REJECTION_REASON_LABELS[application.decisionReasonCode] ??
                application.decisionReasonCode}
            </p>
          )}
          {application.reviewerNote && (
            <p style={{ color: '#fecaca', fontSize: '0.9rem', margin: 0, whiteSpace: 'pre-wrap' }}>
              {application.reviewerNote}
            </p>
          )}
        </section>
      )}

      {application.status === 'APPROVED' && (
        <section
          aria-label="Approval"
          style={{
            padding: '1rem 1.1rem',
            background: 'rgba(34,197,94,0.1)',
            border: '1px solid rgba(34,197,94,0.35)',
            borderRadius: '0.75rem',
            marginBottom: '1.25rem',
          }}
        >
          <h2 style={{ color: '#86efac', fontSize: '1rem', margin: '0 0 0.5rem' }}>
            You are now an Expert
          </h2>
          <p style={{ color: '#bbf7d0', fontSize: '0.9rem', margin: 0 }}>
            Your application was approved and the Expert role has been added to your account.
          </p>
        </section>
      )}

      {/* MFA state */}
      {readiness && (
        <p
          style={{
            color: readiness.summary.mfaEnabled ? '#86efac' : '#fcd34d',
            fontSize: '0.88rem',
            marginBottom: '1.25rem',
          }}
        >
          {readiness.summary.mfaEnabled ? '✓' : '!'} Two-factor authentication (MFA) is{' '}
          {readiness.summary.mfaEnabled ? 'enabled' : 'not enabled'}.
          {!readiness.summary.mfaEnabled && (
            <>
              {' '}
              <Link
                href="/settings/security"
                style={{ color: '#93c5fd', textDecoration: 'underline' }}
              >
                Enable MFA
              </Link>
            </>
          )}
        </p>
      )}

      {actionError && (
        <p role="alert" style={{ margin: '0.5rem 0', color: '#fca5a5', fontSize: '0.9rem' }}>
          {actionError}
        </p>
      )}

      {/* Next actions */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {editable && (
          <>
            <Link
              href="/expert/profile"
              style={{
                padding: '0.6rem 1.2rem',
                background: '#2563eb',
                color: '#fff',
                borderRadius: '0.5rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Edit profile
            </Link>
            <Link
              href="/expert/verification"
              style={{
                padding: '0.6rem 1.2rem',
                background: '#334155',
                color: '#e4e4e7',
                borderRadius: '0.5rem',
                fontWeight: 600,
                textDecoration: 'none',
                border: '1px solid #475569',
              }}
            >
              {application.status === 'CHANGES_REQUESTED'
                ? 'Update documents & resubmit'
                : 'Continue to verification'}
            </Link>
          </>
        )}

        {canWithdraw && !confirmingWithdraw && (
          <button
            type="button"
            onClick={() => setConfirmingWithdraw(true)}
            style={{
              padding: '0.6rem 1.2rem',
              background: 'transparent',
              color: '#fca5a5',
              borderRadius: '0.5rem',
              fontWeight: 600,
              border: '1px solid rgba(239,68,68,0.5)',
              cursor: 'pointer',
            }}
          >
            Withdraw application
          </button>
        )}
      </div>

      {confirmingWithdraw && (
        <div
          role="alertdialog"
          aria-label="Confirm withdrawal"
          style={{
            marginTop: '1rem',
            padding: '1rem',
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '0.75rem',
          }}
        >
          <p style={{ color: '#e4e4e7', margin: '0 0 0.75rem' }}>
            Withdraw this application? Your profile and documents are kept, but you will need to
            resubmit to be reviewed.
          </p>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button
              type="button"
              onClick={handleWithdraw}
              disabled={withdrawing}
              style={{
                padding: '0.5rem 1.1rem',
                background: '#b91c1c',
                color: '#fff',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: 600,
                cursor: withdrawing ? 'wait' : 'pointer',
              }}
            >
              {withdrawing ? 'Withdrawing…' : 'Confirm withdrawal'}
            </button>
            <button
              type="button"
              onClick={() => setConfirmingWithdraw(false)}
              disabled={withdrawing}
              style={{
                padding: '0.5rem 1.1rem',
                background: 'transparent',
                color: '#e4e4e7',
                border: '1px solid #475569',
                borderRadius: '0.5rem',
                cursor: 'pointer',
              }}
            >
              Keep application
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
