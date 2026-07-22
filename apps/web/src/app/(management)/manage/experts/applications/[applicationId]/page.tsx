'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/providers/auth-context';
import {
  ApiClientError,
  getExpertApplicationForReview,
  startExpertApplicationReview,
  approveExpertApplication,
  rejectExpertApplication,
  requestExpertApplicationChanges,
  type ExpertApplicationReviewDetail,
} from '@/lib/api-client';
import type { ReviewExpertApplicationInput } from '@nexthire/types';
import { StatusBadge } from '@/features/experts/components/StatusBadge';
import { DecisionDialog, type DecisionKind } from '@/features/experts/components/DecisionDialog';
import { DocumentAccessButton } from '@/features/experts/components/DocumentAccessButton';
import {
  DOCUMENT_TYPE_PRESENTATION,
  PROFESSIONAL_PROOF_TYPES,
  formatBytes,
  formatDateTime,
  canReviewExpertApplications,
} from '@/features/experts/lib/expert-presentation';

function ProfileRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '1rem',
        padding: '0.5rem 0',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <dt style={{ color: '#94a3b8', fontSize: '0.85rem', flex: '0 0 40%' }}>{label}</dt>
      <dd style={{ color: '#e4e4e7', fontSize: '0.85rem', margin: 0 }}>{value || '—'}</dd>
    </div>
  );
}

export default function ExpertApplicationReviewPage() {
  const params = useParams<{ applicationId: string }>();
  const applicationId = params.applicationId;
  const { getAccessToken, logout, status: authStatus, user } = useAuth();

  const [detail, setDetail] = useState<ExpertApplicationReviewDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [dialogKind, setDialogKind] = useState<DecisionKind | null>(null);
  const [decisionSubmitting, setDecisionSubmitting] = useState(false);
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const token = getAccessToken();

  const load = useCallback(async () => {
    const accessToken = getAccessToken();
    if (!accessToken || !applicationId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getExpertApplicationForReview(accessToken, applicationId);
      setDetail(data);
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.statusCode === 401) {
          await logout();
          return;
        }
        if (err.statusCode === 403) {
          setPermissionDenied(true);
          return;
        }
        if (err.statusCode === 404) {
          setNotFound(true);
          return;
        }
      }
      setError('We could not load this application. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [applicationId, getAccessToken, logout]);

  useEffect(() => {
    if (authStatus === 'authenticated') {
      void load();
    } else if (authStatus === 'unauthenticated') {
      setLoading(false);
    }
  }, [authStatus, load]);

  const handleStartReview = async () => {
    const accessToken = getAccessToken();
    if (!accessToken) return;
    setActionMessage(null);
    try {
      const updated = await startExpertApplicationReview(accessToken, applicationId);
      setDetail(updated);
      setActionMessage('Review started.');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Could not start review.');
    }
  };

  const handleDecision = async (input: ReviewExpertApplicationInput) => {
    const accessToken = getAccessToken();
    if (!accessToken || !dialogKind) return;
    setDecisionSubmitting(true);
    setDecisionError(null);
    try {
      let updated: ExpertApplicationReviewDetail;
      if (dialogKind === 'approve') {
        updated = await approveExpertApplication(accessToken, applicationId, input);
        setActionMessage('Application approved. The Expert role has been granted.');
      } else if (dialogKind === 'reject') {
        updated = await rejectExpertApplication(accessToken, applicationId, input);
        setActionMessage('Application rejected.');
      } else {
        updated = await requestExpertApplicationChanges(accessToken, applicationId, input);
        setActionMessage('Changes requested. The applicant has been notified.');
      }
      setDetail(updated);
      setDialogKind(null);
    } catch (err) {
      setDecisionError(
        err instanceof ApiClientError ? err.message : 'The decision could not be recorded.',
      );
    } finally {
      setDecisionSubmitting(false);
    }
  };

  if (authStatus === 'unknown' || authStatus === 'loading' || loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p style={{ color: '#94a3b8' }}>Loading application…</p>
      </div>
    );
  }

  if (permissionDenied || (user && !canReviewExpertApplications(user.roleCodes) && !detail)) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p role="alert" style={{ color: '#fca5a5' }}>
          You do not have permission to review this application.
        </p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p style={{ color: '#94a3b8' }}>This application could not be found.</p>
        <Link
          href="/manage/experts/applications"
          style={{ color: '#93c5fd', textDecoration: 'underline' }}
        >
          Back to queue
        </Link>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        {error && (
          <p role="alert" style={{ color: '#fca5a5' }}>
            {error}{' '}
            <button
              onClick={() => void load()}
              style={{
                textDecoration: 'underline',
                background: 'none',
                border: 'none',
                color: '#fca5a5',
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          </p>
        )}
      </div>
    );
  }

  const { profile, documents, readiness } = detail;
  const activeDocs = documents.filter((d) => !d.removedAt);
  const hasGovId = activeDocs.some((d) => d.type === 'GOVERNMENT_ID');
  const hasProof = activeDocs.some((d) => PROFESSIONAL_PROOF_TYPES.includes(d.type));

  const canStartReview = detail.status === 'SUBMITTED';
  const canDecide = detail.status === 'UNDER_REVIEW';

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Link
        href="/manage/experts/applications"
        style={{ color: '#93c5fd', textDecoration: 'underline', fontSize: '0.85rem' }}
      >
        ← Back to queue
      </Link>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          margin: '0.75rem 0 1rem',
          flexWrap: 'wrap',
        }}
      >
        <h1 style={{ color: '#f1f5f9', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
          {profile.professionalTitle}
        </h1>
        <StatusBadge status={detail.status} />
        <span style={{ color: '#64748b', fontSize: '0.83rem' }}>
          Submission #{detail.submissionVersion}
        </span>
      </div>

      {actionMessage && (
        <p role="status" style={{ margin: '0.5rem 0 1rem', color: '#86efac', fontSize: '0.9rem' }}>
          ✓ {actionMessage}
        </p>
      )}
      {error && (
        <p role="alert" style={{ margin: '0.5rem 0 1rem', color: '#fca5a5', fontSize: '0.9rem' }}>
          {error}
        </p>
      )}

      {/* Profile */}
      <section
        aria-label="Applicant profile"
        style={{
          padding: '1.25rem',
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '0.75rem',
          marginBottom: '1.5rem',
        }}
      >
        <h2 style={{ color: '#f1f5f9', fontSize: '1.1rem', margin: '0 0 0.75rem' }}>
          Professional profile
        </h2>
        <dl style={{ margin: 0 }}>
          <ProfileRow label="Applicant" value={detail.applicant?.displayName} />
          <ProfileRow label="Years of experience" value={`${profile.yearsOfExperience} years`} />
          <ProfileRow label="Current company" value={profile.currentCompany} />
          <ProfileRow label="Current position" value={profile.currentPosition} />
          <ProfileRow label="Highest education" value={profile.highestEducation} />
          <ProfileRow label="Country" value={profile.countryId} />
          <ProfileRow label="City" value={profile.city} />
          <ProfileRow label="Interview languages" value={profile.interviewLanguages?.join(', ')} />
          <ProfileRow
            label="LinkedIn"
            value={
              profile.linkedinUrl ? (
                <a
                  href={profile.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#93c5fd' }}
                >
                  {profile.linkedinUrl}
                </a>
              ) : null
            }
          />
          <ProfileRow
            label="Portfolio"
            value={
              profile.portfolioUrl ? (
                <a
                  href={profile.portfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#93c5fd' }}
                >
                  {profile.portfolioUrl}
                </a>
              ) : null
            }
          />
          <ProfileRow
            label="Website"
            value={
              profile.personalWebsiteUrl ? (
                <a
                  href={profile.personalWebsiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#93c5fd' }}
                >
                  {profile.personalWebsiteUrl}
                </a>
              ) : null
            }
          />
        </dl>
        <div style={{ marginTop: '1rem' }}>
          <h3 style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 0.35rem' }}>Summary</h3>
          <p style={{ color: '#cbd5e1', fontSize: '0.9rem', margin: 0, whiteSpace: 'pre-wrap' }}>
            {profile.professionalSummary}
          </p>
        </div>
      </section>

      {/* Documents */}
      <section
        aria-label="Verification documents"
        style={{
          padding: '1.25rem',
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '0.75rem',
          marginBottom: '1.5rem',
        }}
      >
        <h2 style={{ color: '#f1f5f9', fontSize: '1.1rem', margin: '0 0 0.5rem' }}>
          Verification documents
        </h2>

        <ul style={{ listStyle: 'none', margin: '0 0 1rem', padding: 0 }}>
          <li
            style={{
              color: hasGovId ? '#86efac' : '#fca5a5',
              fontSize: '0.85rem',
              padding: '0.2rem 0',
            }}
          >
            <span aria-hidden="true">{hasGovId ? '✓' : '✕'}</span> Government ID{' '}
            {hasGovId ? 'provided' : 'missing'}
          </li>
          <li
            style={{
              color: hasProof ? '#86efac' : '#fca5a5',
              fontSize: '0.85rem',
              padding: '0.2rem 0',
            }}
          >
            <span aria-hidden="true">{hasProof ? '✓' : '✕'}</span> Proof of profession{' '}
            {hasProof ? 'provided' : 'missing'}
          </li>
        </ul>

        {activeDocs.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No documents uploaded.</p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {activeDocs.map((doc) => (
              <li
                key={doc.id}
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  padding: '0.75rem 0',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, color: '#f1f5f9', fontWeight: 600, fontSize: '0.88rem' }}>
                    {DOCUMENT_TYPE_PRESENTATION[doc.type].label}
                  </p>
                  <p
                    style={{
                      margin: '0.15rem 0 0',
                      color: '#94a3b8',
                      fontSize: '0.8rem',
                      wordBreak: 'break-all',
                    }}
                  >
                    {doc.originalFileName} · {formatBytes(doc.sizeBytes)} ·{' '}
                    {formatDateTime(doc.uploadedAt)}
                  </p>
                </div>
                {token && (
                  <DocumentAccessButton
                    accessToken={token}
                    applicationId={applicationId}
                    documentId={doc.id}
                    label={DOCUMENT_TYPE_PRESENTATION[doc.type].label}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
        <p style={{ marginTop: '0.75rem', color: '#64748b', fontSize: '0.78rem' }}>
          Document links are temporary and expire within minutes. They are never stored.
        </p>
      </section>

      {/* Readiness / MFA */}
      {readiness && (
        <section
          aria-label="Readiness"
          style={{
            padding: '1rem 1.25rem',
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '0.75rem',
            marginBottom: '1.5rem',
          }}
        >
          <h2 style={{ color: '#f1f5f9', fontSize: '1rem', margin: '0 0 0.5rem' }}>
            Applicant readiness
          </h2>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, fontSize: '0.85rem' }}>
            <li
              style={{
                color: readiness.summary.profileComplete ? '#86efac' : '#fca5a5',
                padding: '0.15rem 0',
              }}
            >
              <span aria-hidden="true">{readiness.summary.profileComplete ? '✓' : '✕'}</span>{' '}
              Profile complete
            </li>
            <li
              style={{
                color: readiness.summary.requiredDocumentsPresent ? '#86efac' : '#fca5a5',
                padding: '0.15rem 0',
              }}
            >
              <span aria-hidden="true">
                {readiness.summary.requiredDocumentsPresent ? '✓' : '✕'}
              </span>{' '}
              Required documents present
            </li>
            <li
              style={{
                color: readiness.summary.mfaEnabled ? '#86efac' : '#fca5a5',
                padding: '0.15rem 0',
              }}
            >
              <span aria-hidden="true">{readiness.summary.mfaEnabled ? '✓' : '✕'}</span> MFA enabled
            </li>
          </ul>
        </section>
      )}

      {/* Applicant response (from changes requested) */}
      {detail.applicantResponse && (
        <section
          aria-label="Applicant response"
          style={{
            padding: '1rem 1.25rem',
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '0.75rem',
            marginBottom: '1.5rem',
          }}
        >
          <h2 style={{ color: '#f1f5f9', fontSize: '1rem', margin: '0 0 0.5rem' }}>
            Applicant response
          </h2>
          <p style={{ color: '#cbd5e1', fontSize: '0.88rem', margin: 0, whiteSpace: 'pre-wrap' }}>
            {detail.applicantResponse}
          </p>
        </section>
      )}

      {/* Decision actions */}
      <section
        aria-label="Review actions"
        style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}
      >
        {canStartReview && (
          <button
            type="button"
            onClick={handleStartReview}
            style={{
              padding: '0.6rem 1.3rem',
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Start review
          </button>
        )}
        {canDecide && (
          <>
            <button
              type="button"
              onClick={() => {
                setDecisionError(null);
                setDialogKind('approve');
              }}
              style={{
                padding: '0.6rem 1.3rem',
                background: '#15803d',
                color: '#fff',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Approve
            </button>
            <button
              type="button"
              onClick={() => {
                setDecisionError(null);
                setDialogKind('request-changes');
              }}
              style={{
                padding: '0.6rem 1.3rem',
                background: '#b45309',
                color: '#fff',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Request changes
            </button>
            <button
              type="button"
              onClick={() => {
                setDecisionError(null);
                setDialogKind('reject');
              }}
              style={{
                padding: '0.6rem 1.3rem',
                background: '#b91c1c',
                color: '#fff',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reject
            </button>
          </>
        )}
        {!canStartReview && !canDecide && (
          <p style={{ color: '#94a3b8', fontSize: '0.88rem' }}>
            No review actions are available for an application in this state.
          </p>
        )}
      </section>

      {dialogKind && (
        <DecisionDialog
          kind={dialogKind}
          onConfirm={handleDecision}
          onClose={() => setDialogKind(null)}
          submitting={decisionSubmitting}
          error={decisionError}
        />
      )}
    </div>
  );
}
