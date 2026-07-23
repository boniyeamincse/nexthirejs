'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-context';
import {
  ApiClientError,
  listReceivedExpertBookings,
  updateReceivedExpertBooking,
  getExpertBookingEvaluation,
  getExpertBookingReview,
  createExpertBookingEvaluation,
} from '@/lib/api-client';
import type {
  ExpertBookingResult,
  ExpertBookingStatus,
  ExpertReviewResult,
  ExpertSessionEvaluationResult,
} from '@nexthire/types';
import { EXPERT_BOOKING_STATUSES } from '@nexthire/constants';

const STATUS_TABS = ['All', ...EXPERT_BOOKING_STATUSES] as const;

const STATUS_BADGE: Record<ExpertBookingStatus, { bg: string; text: string; label: string }> = {
  HELD: { bg: 'rgba(245,158,11,0.15)', text: '#fcd34d', label: 'Held' },
  CONFIRMED: { bg: 'rgba(34,197,94,0.15)', text: '#86efac', label: 'Confirmed' },
  CANCELLED: { bg: 'rgba(148,163,184,0.15)', text: '#94a3b8', label: 'Cancelled' },
  EXPIRED: { bg: 'rgba(239,68,68,0.15)', text: '#fca5a5', label: 'Expired' },
  COMPLETED: { bg: 'rgba(99,102,241,0.15)', text: '#a5b4fc', label: 'Completed' },
};

const SCORE_FIELDS = [
  ['communication', 'Communication'],
  ['technicalKnowledge', 'Technical knowledge'],
  ['confidence', 'Confidence'],
  ['problemSolving', 'Problem solving'],
] as const;

type ScoreField = (typeof SCORE_FIELDS)[number][0];

function ExpertFeedbackSection({
  booking,
  getAccessToken,
}: {
  booking: ExpertBookingResult;
  getAccessToken: () => string | null;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [review, setReview] = useState<ExpertReviewResult | null>(null);
  const [evaluation, setEvaluation] = useState<ExpertSessionEvaluationResult | null>(null);
  const [scores, setScores] = useState<Record<ScoreField, number>>({
    communication: 4,
    technicalKnowledge: 4,
    confidence: 4,
    problemSolving: 4,
  });
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');
  const [nextSteps, setNextSteps] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    if (loaded) {
      setOpen((o) => !o);
      return;
    }
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [e, r] = await Promise.all([
        getExpertBookingEvaluation(token, booking.id),
        getExpertBookingReview(token, booking.id),
      ]);
      setEvaluation(e);
      setReview(r);
      setLoaded(true);
      setOpen(true);
    } catch {
      setError('Failed to load feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    const token = getAccessToken();
    if (!token) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await createExpertBookingEvaluation(token, booking.id, {
        ...scores,
        strengths: strengths.trim() || undefined,
        improvements: improvements.trim() || undefined,
        nextSteps: nextSteps.trim() || undefined,
      });
      setEvaluation(created);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to submit evaluation.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #334155' }}>
      <button
        onClick={toggle}
        disabled={loading}
        style={{
          padding: '0.3rem 0.7rem',
          background: 'rgba(99,102,241,0.15)',
          color: '#a5b4fc',
          border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: '0.375rem',
          fontSize: '0.8rem',
          fontWeight: 500,
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Loading...' : open ? 'Hide feedback' : 'Feedback'}
      </button>

      {open && (
        <div
          style={{ marginTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}
        >
          <div
            style={{
              padding: '0.6rem 0.75rem',
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '0.5rem',
            }}
          >
            <p style={{ margin: 0, color: '#e2e8f0', fontSize: '0.83rem' }}>
              Candidate review:{' '}
              {review
                ? `${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}`
                : 'Not yet submitted'}
            </p>
            {review?.comment && (
              <p style={{ margin: '0.3rem 0 0', color: '#cbd5e1', fontSize: '0.82rem' }}>
                {review.comment}
              </p>
            )}
          </div>

          {evaluation ? (
            <div
              style={{
                padding: '0.6rem 0.75rem',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '0.5rem',
              }}
            >
              <p
                style={{
                  margin: '0 0 0.3rem',
                  color: '#e2e8f0',
                  fontSize: '0.83rem',
                  fontWeight: 600,
                }}
              >
                Your evaluation — overall {evaluation.overallScore}/5
              </p>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.8rem' }}>
                Communication {evaluation.communication}/5 · Technical{' '}
                {evaluation.technicalKnowledge}/5 · Confidence {evaluation.confidence}/5 · Problem
                solving {evaluation.problemSolving}/5
              </p>
            </div>
          ) : (
            <div
              style={{
                padding: '0.6rem 0.75rem',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '0.5rem',
              }}
            >
              <p
                style={{
                  margin: '0 0 0.5rem',
                  color: '#e2e8f0',
                  fontSize: '0.83rem',
                  fontWeight: 600,
                }}
              >
                Evaluate this session
              </p>
              {SCORE_FIELDS.map(([field, label]) => (
                <label
                  key={field}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    color: '#cbd5e1',
                    fontSize: '0.82rem',
                    marginBottom: '0.35rem',
                  }}
                >
                  {label}
                  <select
                    value={scores[field]}
                    onChange={(e) =>
                      setScores((prev) => ({ ...prev, [field]: Number(e.target.value) }))
                    }
                    style={{
                      padding: '0.2rem 0.4rem',
                      background: '#1e293b',
                      color: '#e2e8f0',
                      border: '1px solid #334155',
                      borderRadius: '0.35rem',
                    }}
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
              <textarea
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
                placeholder="Strengths"
                rows={2}
                style={{
                  width: '100%',
                  padding: '0.4rem 0.5rem',
                  background: '#1e293b',
                  color: '#e2e8f0',
                  border: '1px solid #334155',
                  borderRadius: '0.35rem',
                  fontSize: '0.82rem',
                  marginBottom: '0.4rem',
                  resize: 'vertical',
                }}
              />
              <textarea
                value={improvements}
                onChange={(e) => setImprovements(e.target.value)}
                placeholder="Areas to improve"
                rows={2}
                style={{
                  width: '100%',
                  padding: '0.4rem 0.5rem',
                  background: '#1e293b',
                  color: '#e2e8f0',
                  border: '1px solid #334155',
                  borderRadius: '0.35rem',
                  fontSize: '0.82rem',
                  marginBottom: '0.4rem',
                  resize: 'vertical',
                }}
              />
              <textarea
                value={nextSteps}
                onChange={(e) => setNextSteps(e.target.value)}
                placeholder="Next steps"
                rows={2}
                style={{
                  width: '100%',
                  padding: '0.4rem 0.5rem',
                  background: '#1e293b',
                  color: '#e2e8f0',
                  border: '1px solid #334155',
                  borderRadius: '0.35rem',
                  fontSize: '0.82rem',
                  marginBottom: '0.5rem',
                  resize: 'vertical',
                }}
              />
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  padding: '0.35rem 0.8rem',
                  background: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '0.4rem',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                }}
              >
                {submitting ? '...' : 'Submit evaluation'}
              </button>
            </div>
          )}

          {error && (
            <p role="alert" style={{ color: '#fca5a5', fontSize: '0.8rem', margin: 0 }}>
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function ExpertBookingsPage() {
  const { getAccessToken, logout, status: authStatus } = useAuth();

  const [bookings, setBookings] = useState<ExpertBookingResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [meetingUrlDraft, setMeetingUrlDraft] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setPageError(null);
    try {
      const data = await listReceivedExpertBookings(token);
      setBookings(data);
    } catch (err) {
      if (err instanceof ApiClientError && err.statusCode === 401) {
        await logout();
        return;
      }
      setPageError('Failed to load your bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, logout]);

  useEffect(() => {
    if (authStatus === 'authenticated') {
      void load();
    } else if (authStatus === 'unauthenticated') {
      setLoading(false);
    }
  }, [authStatus, load]);

  async function handleSaveMeetingUrl(id: string) {
    const token = getAccessToken();
    if (!token) return;
    const meetingUrl = meetingUrlDraft[id]?.trim();
    if (!meetingUrl) return;
    setActionId(id);
    setActionError(null);
    try {
      await updateReceivedExpertBooking(token, id, { meetingUrl });
      await load();
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : 'Failed to save meeting link.');
    } finally {
      setActionId(null);
    }
  }

  async function handleAction(id: string, action: 'complete' | 'cancel') {
    const token = getAccessToken();
    if (!token) return;
    setActionId(id);
    setActionError(null);
    try {
      await updateReceivedExpertBooking(token, id, { action });
      await load();
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : `Failed to ${action} booking.`);
    } finally {
      setActionId(null);
    }
  }

  const filtered =
    statusFilter === 'All' ? bookings : bookings.filter((b) => b.status === statusFilter);

  if (authStatus === 'unknown' || authStatus === 'loading' || loading) {
    return <p style={{ color: '#94a3b8' }}>Loading...</p>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h1
          style={{ color: '#f1f5f9', fontSize: '1.6rem', fontWeight: 700, margin: '0 0 0.35rem' }}
        >
          Bookings
        </h1>
        <Link href="/expert/reviews" style={{ color: '#93c5fd', fontSize: '0.85rem' }}>
          View my reviews →
        </Link>
      </div>
      <p style={{ color: '#94a3b8', margin: '0 0 1.25rem' }}>
        Sessions candidates have reserved with you.
      </p>

      {pageError && (
        <div
          role="alert"
          style={{
            padding: '0.75rem',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
            color: '#fca5a5',
          }}
        >
          {pageError}
        </div>
      )}

      {actionError && (
        <div
          role="alert"
          style={{
            padding: '0.75rem',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
            color: '#fca5a5',
          }}
        >
          {actionError}
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            style={{
              padding: '0.35rem 0.8rem',
              borderRadius: '9999px',
              fontSize: '0.83rem',
              fontWeight: 600,
              border: `1px solid ${statusFilter === tab ? '#2563eb' : '#334155'}`,
              background: statusFilter === tab ? '#2563eb' : '#1e293b',
              color: statusFilter === tab ? '#fff' : '#cbd5e1',
              cursor: 'pointer',
            }}
          >
            {tab === 'All' ? 'All' : STATUS_BADGE[tab].label}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>No bookings found.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {filtered.map((booking) => {
          const badge = STATUS_BADGE[booking.status];
          // Intentionally time-relative: gates Mark complete against the slot's end time.
          // eslint-disable-next-line react-hooks/purity
          const nowMs = Date.now();
          const canComplete =
            booking.status === 'CONFIRMED' && new Date(booking.slotEndUtc).getTime() <= nowMs;
          const canCancel = booking.status === 'HELD' || booking.status === 'CONFIRMED';
          const canEditMeetingUrl = booking.status === 'HELD' || booking.status === 'CONFIRMED';
          return (
            <div
              key={booking.id}
              style={{
                padding: '1rem 1.1rem',
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '0.75rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.3rem',
                    }}
                  >
                    <span style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '0.95rem' }}>
                      {booking.service.title}
                    </span>
                    <span
                      style={{
                        padding: '0.15rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: badge.bg,
                        color: badge.text,
                      }}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <p style={{ margin: '0.2rem 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
                    with {booking.counterparty.displayName}
                  </p>
                  <p style={{ margin: '0.2rem 0 0', color: '#64748b', fontSize: '0.83rem' }}>
                    {new Date(booking.slotStartUtc).toLocaleString()} ·{' '}
                    {booking.service.durationMinutes} min
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  {canComplete && (
                    <button
                      onClick={() => handleAction(booking.id, 'complete')}
                      disabled={actionId === booking.id}
                      style={{
                        padding: '0.35rem 0.8rem',
                        background: 'rgba(99,102,241,0.15)',
                        color: '#a5b4fc',
                        border: '1px solid rgba(99,102,241,0.3)',
                        borderRadius: '0.375rem',
                        fontSize: '0.83rem',
                        fontWeight: 500,
                        cursor: actionId === booking.id ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {actionId === booking.id ? '...' : 'Mark complete'}
                    </button>
                  )}
                  {canCancel && (
                    <button
                      onClick={() => handleAction(booking.id, 'cancel')}
                      disabled={actionId === booking.id}
                      style={{
                        padding: '0.35rem 0.8rem',
                        background: 'rgba(239,68,68,0.15)',
                        color: '#fca5a5',
                        border: '1px solid rgba(239,68,68,0.3)',
                        borderRadius: '0.375rem',
                        fontSize: '0.83rem',
                        fontWeight: 500,
                        cursor: actionId === booking.id ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {actionId === booking.id ? '...' : 'Cancel'}
                    </button>
                  )}
                </div>
              </div>

              {canEditMeetingUrl && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                  <input
                    type="text"
                    placeholder="Meeting link"
                    defaultValue={booking.meetingUrl ?? ''}
                    onChange={(e) =>
                      setMeetingUrlDraft((prev) => ({ ...prev, [booking.id]: e.target.value }))
                    }
                    style={{
                      flex: 1,
                      padding: '0.4rem 0.6rem',
                      background: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '0.4rem',
                      color: '#e2e8f0',
                      fontSize: '0.82rem',
                    }}
                  />
                  <button
                    onClick={() => handleSaveMeetingUrl(booking.id)}
                    disabled={actionId === booking.id}
                    style={{
                      padding: '0.4rem 0.8rem',
                      background: '#334155',
                      color: '#e2e8f0',
                      border: 'none',
                      borderRadius: '0.4rem',
                      fontSize: '0.82rem',
                      cursor: actionId === booking.id ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Save
                  </button>
                </div>
              )}
              {!canEditMeetingUrl && booking.meetingUrl && (
                <a
                  href={booking.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#93c5fd',
                    fontSize: '0.82rem',
                    marginTop: '0.5rem',
                    display: 'inline-block',
                  }}
                >
                  Meeting link
                </a>
              )}
              {booking.status === 'COMPLETED' && (
                <ExpertFeedbackSection booking={booking} getAccessToken={getAccessToken} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
