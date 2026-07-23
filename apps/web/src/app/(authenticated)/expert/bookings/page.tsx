'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/providers/auth-context';
import {
  ApiClientError,
  listReceivedExpertBookings,
  updateReceivedExpertBooking,
} from '@/lib/api-client';
import type { ExpertBookingResult, ExpertBookingStatus } from '@nexthire/types';
import { EXPERT_BOOKING_STATUSES } from '@nexthire/constants';

const STATUS_TABS = ['All', ...EXPERT_BOOKING_STATUSES] as const;

const STATUS_BADGE: Record<ExpertBookingStatus, { bg: string; text: string; label: string }> = {
  HELD: { bg: 'rgba(245,158,11,0.15)', text: '#fcd34d', label: 'Held' },
  CONFIRMED: { bg: 'rgba(34,197,94,0.15)', text: '#86efac', label: 'Confirmed' },
  CANCELLED: { bg: 'rgba(148,163,184,0.15)', text: '#94a3b8', label: 'Cancelled' },
  EXPIRED: { bg: 'rgba(239,68,68,0.15)', text: '#fca5a5', label: 'Expired' },
  COMPLETED: { bg: 'rgba(99,102,241,0.15)', text: '#a5b4fc', label: 'Completed' },
};

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
      <h1 style={{ color: '#f1f5f9', fontSize: '1.6rem', fontWeight: 700, margin: '0 0 0.35rem' }}>
        Bookings
      </h1>
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
          const canComplete =
            booking.status === 'CONFIRMED' && new Date(booking.slotEndUtc).getTime() <= Date.now();
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
