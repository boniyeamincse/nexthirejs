'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/providers/auth-context';
import {
  ApiClientError,
  getCompanyApplicationForReview,
  startCompanyApplicationReview,
  approveCompanyApplication,
  rejectCompanyApplication,
  requestCompanyApplicationChanges,
} from '@/lib/api-client';
import type { CompanyApplicationReviewDetail } from '@nexthire/types';
import { COMPANY_REJECTION_REASONS } from '@nexthire/constants';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under review',
  CHANGES_REQUESTED: 'Changes requested',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
};

const cardStyle: React.CSSProperties = {
  padding: '1.1rem',
  background: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '0.75rem',
  marginBottom: '1.25rem',
};

type DecisionKind = 'approve' | 'reject' | 'request-changes';

export default function CompanyApplicationReviewDetailPage() {
  const params = useParams<{ applicationId: string }>();
  const { getAccessToken, logout, status: authStatus } = useAuth();

  const [detail, setDetail] = useState<CompanyApplicationReviewDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [openDecision, setOpenDecision] = useState<DecisionKind | null>(null);
  const [reasonCode, setReasonCode] = useState<string>(COMPANY_REJECTION_REASONS[0]);
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setPageError(null);
    try {
      const result = await getCompanyApplicationForReview(token, params.applicationId);
      setDetail(result);
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
      }
      setPageError('Failed to load application. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, logout, params.applicationId]);

  useEffect(() => {
    if (authStatus === 'authenticated') {
      void load();
    } else if (authStatus === 'unauthenticated') {
      setLoading(false);
    }
  }, [authStatus, load]);

  async function handleStartReview() {
    const token = getAccessToken();
    if (!token) return;
    setBusy(true);
    setActionError(null);
    try {
      const result = await startCompanyApplicationReview(token, params.applicationId);
      setDetail(result);
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : 'Failed to start review.');
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirmDecision() {
    const token = getAccessToken();
    if (!token || !openDecision) return;
    setBusy(true);
    setActionError(null);
    try {
      let result: CompanyApplicationReviewDetail;
      if (openDecision === 'approve') {
        result = await approveCompanyApplication(token, params.applicationId, {
          reviewerNote: note.trim() || undefined,
        });
      } else if (openDecision === 'reject') {
        result = await rejectCompanyApplication(token, params.applicationId, {
          reasonCode,
          reviewerNote: note.trim(),
        });
      } else {
        result = await requestCompanyApplicationChanges(token, params.applicationId, {
          reviewerNote: note.trim(),
        });
      }
      setDetail(result);
      setOpenDecision(null);
      setNote('');
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : 'Failed to record decision.');
    } finally {
      setBusy(false);
    }
  }

  if (authStatus === 'unknown' || authStatus === 'loading' || loading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <p style={{ color: '#94a3b8' }}>Loading...</p>
      </div>
    );
  }

  if (permissionDenied) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <p role="alert" style={{ color: '#fca5a5' }}>
          You do not have permission to review company applications.
        </p>
      </div>
    );
  }

  if (pageError || !detail) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <p role="alert" style={{ color: '#fca5a5' }}>
          {pageError ?? 'Application not found.'}
        </p>
      </div>
    );
  }

  const canStartReview = detail.status === 'SUBMITTED';
  const canDecide = detail.status === 'SUBMITTED' || detail.status === 'UNDER_REVIEW';

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Link href="/manage/companies/applications" style={{ color: '#93c5fd', fontSize: '0.85rem' }}>
        ← Back to queue
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0.75rem 0 1.25rem' }}>
        <h1 style={{ margin: 0, color: '#f1f5f9', fontSize: '1.5rem', fontWeight: 700 }}>
          {detail.company.name}
        </h1>
        <span style={{ color: '#93c5fd', fontSize: '0.85rem' }}>
          {STATUS_LABELS[detail.status] ?? detail.status}
        </span>
      </div>

      {actionError && (
        <p role="alert" style={{ color: '#fca5a5', marginBottom: '1rem' }}>
          {actionError}
        </p>
      )}

      <div style={cardStyle}>
        <h2 style={{ margin: '0 0 0.6rem', color: '#f1f5f9', fontSize: '1.05rem' }}>Company</h2>
        <p style={{ margin: '0.2rem 0', color: '#cbd5e1', fontSize: '0.88rem' }}>
          Legal name: {detail.company.legalName ?? '—'}
        </p>
        <p style={{ margin: '0.2rem 0', color: '#cbd5e1', fontSize: '0.88rem' }}>
          Website: {detail.company.website ?? '—'}
        </p>
        <p style={{ margin: '0.2rem 0', color: '#cbd5e1', fontSize: '0.88rem' }}>
          Industry: {detail.company.industry ?? '—'} · Size: {detail.company.companySize ?? '—'}
        </p>
        <p style={{ margin: '0.2rem 0', color: '#cbd5e1', fontSize: '0.88rem' }}>
          HQ: {detail.company.headquartersCity ?? '—'}
        </p>
        <p style={{ margin: '0.5rem 0 0', color: '#94a3b8', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
          {detail.company.description}
        </p>
      </div>

      <div style={cardStyle}>
        <h2 style={{ margin: '0 0 0.6rem', color: '#f1f5f9', fontSize: '1.05rem' }}>
          Verification documents
        </h2>
        {detail.documents.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No documents uploaded.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {detail.documents.map((doc) => (
              <div
                key={doc.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0.7rem',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '0.4rem',
                  fontSize: '0.85rem',
                }}
              >
                <span style={{ color: '#e2e8f0' }}>
                  {doc.type} — {doc.originalFileName}
                </span>
                {doc.signedUrl && (
                  <a
                    href={doc.signedUrl.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#93c5fd' }}
                  >
                    View
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {detail.applicantResponse && (
        <div style={cardStyle}>
          <h2 style={{ margin: '0 0 0.6rem', color: '#f1f5f9', fontSize: '1.05rem' }}>
            Applicant response
          </h2>
          <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
            {detail.applicantResponse}
          </p>
        </div>
      )}

      {(canStartReview || canDecide) && (
        <div style={cardStyle}>
          <h2 style={{ margin: '0 0 0.75rem', color: '#f1f5f9', fontSize: '1.05rem' }}>Actions</h2>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            {canStartReview && (
              <button
                onClick={handleStartReview}
                disabled={busy}
                style={{
                  padding: '0.4rem 0.9rem',
                  background: '#334155',
                  color: '#e2e8f0',
                  border: 'none',
                  borderRadius: '0.4rem',
                  fontSize: '0.83rem',
                  cursor: busy ? 'not-allowed' : 'pointer',
                }}
              >
                Start review
              </button>
            )}
            {canDecide && (
              <>
                <button
                  onClick={() => setOpenDecision('approve')}
                  style={{
                    padding: '0.4rem 0.9rem',
                    background: 'rgba(34,197,94,0.15)',
                    color: '#86efac',
                    border: '1px solid rgba(34,197,94,0.3)',
                    borderRadius: '0.4rem',
                    fontSize: '0.83rem',
                    cursor: 'pointer',
                  }}
                >
                  Approve
                </button>
                <button
                  onClick={() => setOpenDecision('reject')}
                  style={{
                    padding: '0.4rem 0.9rem',
                    background: 'rgba(239,68,68,0.15)',
                    color: '#fca5a5',
                    border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: '0.4rem',
                    fontSize: '0.83rem',
                    cursor: 'pointer',
                  }}
                >
                  Reject
                </button>
                <button
                  onClick={() => setOpenDecision('request-changes')}
                  style={{
                    padding: '0.4rem 0.9rem',
                    background: 'rgba(245,158,11,0.15)',
                    color: '#fcd34d',
                    border: '1px solid rgba(245,158,11,0.3)',
                    borderRadius: '0.4rem',
                    fontSize: '0.83rem',
                    cursor: 'pointer',
                  }}
                >
                  Request changes
                </button>
              </>
            )}
          </div>

          {openDecision && (
            <div style={{ padding: '0.85rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '0.5rem' }}>
              {openDecision === 'reject' && (
                <>
                  <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                    Reason
                  </label>
                  <select
                    value={reasonCode}
                    onChange={(e) => setReasonCode(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.4rem 0.6rem',
                      background: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '0.4rem',
                      color: '#e2e8f0',
                      marginBottom: '0.6rem',
                    }}
                  >
                    {COMPANY_REJECTION_REASONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </>
              )}
              <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                Reviewer note{openDecision === 'approve' ? ' (optional)' : ''}
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.4rem 0.6rem',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '0.4rem',
                  color: '#e2e8f0',
                  resize: 'vertical',
                  marginBottom: '0.6rem',
                }}
              />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={handleConfirmDecision}
                  disabled={busy}
                  style={{
                    padding: '0.4rem 0.9rem',
                    background: '#2563eb',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '0.4rem',
                    fontSize: '0.83rem',
                    fontWeight: 600,
                    cursor: busy ? 'not-allowed' : 'pointer',
                  }}
                >
                  {busy ? '...' : 'Confirm'}
                </button>
                <button
                  onClick={() => {
                    setOpenDecision(null);
                    setNote('');
                  }}
                  disabled={busy}
                  style={{
                    padding: '0.4rem 0.9rem',
                    background: 'transparent',
                    color: '#94a3b8',
                    border: '1px solid #334155',
                    borderRadius: '0.4rem',
                    fontSize: '0.83rem',
                    cursor: busy ? 'not-allowed' : 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
