'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/providers/auth-context';
import {
  ApiClientError,
  getPublicExpertProfile,
  getPublicExpertServiceSlots,
  getPublicExpertReviews,
  createMyExpertBooking,
  confirmMyExpertBooking,
  cancelMyExpertBooking,
} from '@/lib/api-client';
import type {
  PublicExpertProfileDetail,
  ExpertAvailabilitySlot,
  ExpertBookingResult,
  ExpertReviewResult,
} from '@nexthire/types';

const LEVEL_LABELS: Record<string, string> = {
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
  EXPERT: 'Expert',
};

const PREVIEW_RANGE_DAYS = 13;

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIso(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', gap: '1rem', padding: '0.4rem 0', fontSize: '0.9rem' }}>
      <span style={{ color: '#64748b', flex: '0 0 140px' }}>{label}</span>
      <span style={{ color: '#e2e8f0' }}>{value}</span>
    </div>
  );
}

interface BookingPanelProps {
  slug: string;
  serviceId: string;
  isCandidate: boolean;
  getAccessToken: () => string | null;
}

function BookingPanel({ slug, serviceId, isCandidate, getAccessToken }: BookingPanelProps) {
  const [loading, setLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [slots, setSlots] = useState<ExpertAvailabilitySlot[] | null>(null);
  const [hold, setHold] = useState<ExpertBookingResult | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setSlotsError(null);
    getPublicExpertServiceSlots(slug, serviceId, {
      from: todayIsoDate(),
      to: addDaysIso(todayIsoDate(), PREVIEW_RANGE_DAYS),
    })
      .then((result) => {
        if (!cancelled) setSlots(result.slots);
      })
      .catch(() => {
        if (!cancelled) setSlotsError('Could not load available times. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, serviceId]);

  async function handlePick(slot: ExpertAvailabilitySlot) {
    const token = getAccessToken();
    if (!token) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const booking = await createMyExpertBooking(token, {
        expertServiceId: serviceId,
        slotStartUtc: slot.startUtc,
      });
      setHold(booking);
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : 'Failed to reserve this slot.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleConfirm() {
    const token = getAccessToken();
    if (!token || !hold) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const confirmed = await confirmMyExpertBooking(token, hold.id);
      setHold(confirmed);
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : 'Failed to confirm booking.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReleaseHold() {
    const token = getAccessToken();
    if (!token || !hold) return;
    setActionLoading(true);
    try {
      await cancelMyExpertBooking(token, hold.id);
    } catch {
      // best-effort — the hold will auto-expire regardless
    } finally {
      setHold(null);
      setActionLoading(false);
    }
  }

  if (!isCandidate) {
    return (
      <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
        <Link href="/login" style={{ color: '#93c5fd', textDecoration: 'underline' }}>
          Log in
        </Link>{' '}
        as a candidate to book this service.
      </p>
    );
  }

  if (hold) {
    const isConfirmed = hold.status === 'CONFIRMED';
    return (
      <div
        style={{
          padding: '0.85rem',
          background: 'rgba(37,99,235,0.08)',
          border: '1px solid rgba(37,99,235,0.3)',
          borderRadius: '0.5rem',
        }}
      >
        {isConfirmed ? (
          <p style={{ margin: 0, color: '#86efac', fontSize: '0.85rem' }}>
            Booking confirmed for {new Date(hold.slotStartUtc).toLocaleString()}.{' '}
            <Link href="/bookings" style={{ color: '#93c5fd', textDecoration: 'underline' }}>
              View my bookings
            </Link>
          </p>
        ) : (
          <>
            <p style={{ margin: '0 0 0.5rem', color: '#e2e8f0', fontSize: '0.85rem' }}>
              Slot held for {new Date(hold.slotStartUtc).toLocaleString()}. Confirm before{' '}
              {hold.holdExpiresAt
                ? new Date(hold.holdExpiresAt).toLocaleTimeString()
                : 'it expires'}
              .
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={handleConfirm}
                disabled={actionLoading}
                style={{
                  padding: '0.4rem 0.9rem',
                  background: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '0.4rem',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {actionLoading ? '...' : 'Confirm booking'}
              </button>
              <button
                onClick={handleReleaseHold}
                disabled={actionLoading}
                style={{
                  padding: '0.4rem 0.9rem',
                  background: 'transparent',
                  color: '#94a3b8',
                  border: '1px solid #334155',
                  borderRadius: '0.4rem',
                  fontSize: '0.82rem',
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                }}
              >
                Release
              </button>
            </div>
          </>
        )}
        {actionError && (
          <p role="alert" style={{ color: '#fca5a5', fontSize: '0.8rem', margin: '0.5rem 0 0' }}>
            {actionError}
          </p>
        )}
      </div>
    );
  }

  if (loading) {
    return <p style={{ color: '#64748b', fontSize: '0.83rem' }}>Loading available times...</p>;
  }

  if (slotsError) {
    return (
      <p role="alert" style={{ color: '#fca5a5', fontSize: '0.83rem' }}>
        {slotsError}
      </p>
    );
  }

  if (!slots || slots.length === 0) {
    return (
      <p style={{ color: '#64748b', fontSize: '0.83rem' }}>
        No bookable times in the next {PREVIEW_RANGE_DAYS + 1} days.
      </p>
    );
  }

  const byDate = slots.reduce<Record<string, ExpertAvailabilitySlot[]>>((acc, slot) => {
    (acc[slot.localDate] ??= []).push(slot);
    return acc;
  }, {});

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      {actionError && (
        <p role="alert" style={{ color: '#fca5a5', fontSize: '0.8rem', margin: 0 }}>
          {actionError}
        </p>
      )}
      {Object.entries(byDate).map(([date, daySlots]) => (
        <div key={date}>
          <p
            style={{ color: '#e2e8f0', fontSize: '0.82rem', fontWeight: 600, margin: '0 0 0.3rem' }}
          >
            {date}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {daySlots.map((slot) => (
              <button
                key={slot.startUtc}
                onClick={() => handlePick(slot)}
                disabled={actionLoading}
                style={{
                  padding: '0.3rem 0.65rem',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '0.4rem',
                  color: '#cbd5e1',
                  fontSize: '0.8rem',
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {slot.startLocalTime}–{slot.endLocalTime}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PublicReviewsSection({ slug }: { slug: string }) {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<ExpertReviewResult[]>([]);

  useEffect(() => {
    let cancelled = false;
    getPublicExpertReviews(slug)
      .then((result) => {
        if (!cancelled) setReviews(result.data);
      })
      .catch(() => {
        // best-effort — the aggregate rating already renders above this section
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading || reviews.length === 0) return null;

  return (
    <section
      style={{
        padding: '1.25rem',
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '0.75rem',
        marginTop: '1.5rem',
      }}
    >
      <h2 style={{ color: '#f1f5f9', fontSize: '1.05rem', margin: '0 0 0.75rem' }}>Reviews</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {reviews.map((review) => (
          <div
            key={review.id}
            style={{
              padding: '0.75rem 0.9rem',
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '0.5rem',
            }}
          >
            <span style={{ color: '#fcd34d', fontSize: '0.9rem' }}>
              {'★'.repeat(review.rating)}
              {'☆'.repeat(5 - review.rating)}
            </span>
            {review.comment && (
              <p style={{ margin: '0.3rem 0 0', color: '#cbd5e1', fontSize: '0.85rem' }}>
                {review.comment}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function PublicExpertProfilePage() {
  const params = useParams<{ slug: string }>();
  const { user, getAccessToken } = useAuth();
  const [detail, setDetail] = useState<PublicExpertProfileDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingServiceId, setBookingServiceId] = useState<string | null>(null);

  const isCandidate = Boolean(user?.roleCodes.includes('candidate'));

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setNotFound(false);
    getPublicExpertProfile(params.slug)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiClientError && err.statusCode === 404) {
          setNotFound(true);
        } else {
          setError('We could not load this profile. Please try again.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [params.slug]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <p style={{ color: '#94a3b8' }}>Loading profile...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <p style={{ color: '#94a3b8' }}>This expert profile could not be found.</p>
        <Link href="/find-expert" style={{ color: '#93c5fd', textDecoration: 'underline' }}>
          Back to Find Expert
        </Link>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <p role="alert" style={{ color: '#fca5a5' }}>
          {error ?? 'Something went wrong.'}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Link
        href="/find-expert"
        style={{ color: '#93c5fd', textDecoration: 'underline', fontSize: '0.85rem' }}
      >
        ← Back to Find Expert
      </Link>

      <h1
        style={{
          color: '#f1f5f9',
          fontSize: '1.8rem',
          fontWeight: 700,
          margin: '0.75rem 0 0.25rem',
        }}
      >
        {detail.professionalTitle}
      </h1>
      <p style={{ color: '#94a3b8', margin: '0 0 0.4rem' }}>
        {[detail.currentPosition, detail.currentCompany].filter(Boolean).join(' at ')}
      </p>
      <p style={{ color: '#fcd34d', fontSize: '0.9rem', margin: '0 0 1.5rem' }}>
        {detail.rating.average !== null
          ? `${'★'.repeat(Math.round(detail.rating.average))}${'☆'.repeat(5 - Math.round(detail.rating.average))} ${detail.rating.average.toFixed(1)} (${detail.rating.count} review${detail.rating.count === 1 ? '' : 's'})`
          : 'No reviews yet'}
      </p>

      <section
        style={{
          padding: '1.25rem',
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '0.75rem',
          marginBottom: '1.5rem',
        }}
      >
        <h2 style={{ color: '#f1f5f9', fontSize: '1.05rem', margin: '0 0 0.75rem' }}>About</h2>
        <p style={{ color: '#cbd5e1', fontSize: '0.9rem', whiteSpace: 'pre-wrap', margin: 0 }}>
          {detail.professionalSummary}
        </p>
        <div style={{ marginTop: '1rem' }}>
          <Row label="Experience" value={`${detail.yearsOfExperience} years`} />
          <Row label="Education" value={detail.highestEducation} />
          <Row label="Location" value={detail.city ?? undefined} />
          <Row
            label="Languages"
            value={
              detail.interviewLanguages.length ? detail.interviewLanguages.join(', ') : undefined
            }
          />
          <Row
            label="Links"
            value={
              (detail.linkedinUrl || detail.portfolioUrl || detail.personalWebsiteUrl) && (
                <>
                  {detail.linkedinUrl && (
                    <a
                      href={detail.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#93c5fd', marginRight: '0.75rem' }}
                    >
                      LinkedIn
                    </a>
                  )}
                  {detail.portfolioUrl && (
                    <a
                      href={detail.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#93c5fd', marginRight: '0.75rem' }}
                    >
                      Portfolio
                    </a>
                  )}
                  {detail.personalWebsiteUrl && (
                    <a
                      href={detail.personalWebsiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#93c5fd' }}
                    >
                      Website
                    </a>
                  )}
                </>
              )
            }
          />
        </div>
      </section>

      {detail.expertise.length > 0 && (
        <section
          style={{
            padding: '1.25rem',
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '0.75rem',
            marginBottom: '1.5rem',
          }}
        >
          <h2 style={{ color: '#f1f5f9', fontSize: '1.05rem', margin: '0 0 0.75rem' }}>
            Expertise
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {detail.expertise.map((e) => (
              <span
                key={e.areaSlug}
                style={{
                  padding: '0.3rem 0.8rem',
                  background: e.isPrimary ? 'rgba(99,102,241,0.15)' : '#0f172a',
                  border: `1px solid ${e.isPrimary ? 'rgba(99,102,241,0.4)' : '#334155'}`,
                  borderRadius: '9999px',
                  color: '#cbd5e1',
                  fontSize: '0.82rem',
                }}
              >
                {e.areaName} · {LEVEL_LABELS[e.level] ?? e.level}
              </span>
            ))}
          </div>
        </section>
      )}

      {detail.services.length > 0 && (
        <section
          style={{
            padding: '1.25rem',
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '0.75rem',
          }}
        >
          <h2 style={{ color: '#f1f5f9', fontSize: '1.05rem', margin: '0 0 0.75rem' }}>Services</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {detail.services.map((service) => (
              <div
                key={service.id}
                style={{
                  padding: '0.9rem',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '0.6rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <p
                      style={{ margin: 0, color: '#f1f5f9', fontWeight: 600, fontSize: '0.92rem' }}
                    >
                      {service.title}
                    </p>
                    <p style={{ margin: '0.2rem 0 0', color: '#94a3b8', fontSize: '0.82rem' }}>
                      {service.shortDescription}
                    </p>
                    <p style={{ margin: '0.2rem 0 0', color: '#64748b', fontSize: '0.78rem' }}>
                      {service.durationMinutes} min
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ color: '#f1f5f9', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {service.price.currency} {service.price.amount}
                    </div>
                    <button
                      onClick={() =>
                        setBookingServiceId(bookingServiceId === service.id ? null : service.id)
                      }
                      style={{
                        padding: '0.4rem 0.9rem',
                        background: bookingServiceId === service.id ? '#334155' : '#2563eb',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '0.4rem',
                        fontWeight: 600,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {bookingServiceId === service.id ? 'Close' : 'Book'}
                    </button>
                  </div>
                </div>
                {bookingServiceId === service.id && (
                  <div
                    style={{
                      marginTop: '0.85rem',
                      paddingTop: '0.85rem',
                      borderTop: '1px solid #334155',
                    }}
                  >
                    <BookingPanel
                      slug={params.slug}
                      serviceId={service.id}
                      isCandidate={isCandidate}
                      getAccessToken={getAccessToken}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <PublicReviewsSection slug={params.slug} />
    </div>
  );
}
