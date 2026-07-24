'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-context';
import { ApiClientError, getMyExpertDashboard } from '@/lib/api-client';
import type { ExpertDashboardResult } from '@nexthire/types';

const cardStyle: React.CSSProperties = {
  padding: '1rem 1.1rem',
  background: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '0.75rem',
};

const statTileStyle: React.CSSProperties = {
  ...cardStyle,
  flex: '1 1 10rem',
};

export default function ExpertDashboardPage() {
  const { getAccessToken, logout, status: authStatus } = useAuth();

  const [dashboard, setDashboard] = useState<ExpertDashboardResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setPageError(null);
    try {
      const data = await getMyExpertDashboard(token);
      setDashboard(data);
    } catch (err) {
      if (err instanceof ApiClientError && err.statusCode === 401) {
        await logout();
        return;
      }
      setPageError('Failed to load your dashboard. Please try again.');
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

  if (authStatus === 'unknown' || authStatus === 'loading' || loading) {
    return <p style={{ color: '#94a3b8' }}>Loading...</p>;
  }

  if (pageError || !dashboard) {
    return (
      <div>
        <p role="alert" style={{ color: '#fca5a5' }}>
          {pageError ?? 'Something went wrong.'}
        </p>
        <button
          onClick={() => void load()}
          style={{
            background: 'none',
            border: 'none',
            color: '#93c5fd',
            textDecoration: 'underline',
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  const { stats, upcomingBookings, wallet, recentReviews, hasAvailabilityConfigured } = dashboard;

  return (
    <div>
      <h1 style={{ color: '#f1f5f9', fontSize: '1.6rem', fontWeight: 700, margin: '0 0 0.35rem' }}>
        Dashboard
      </h1>
      <p style={{ color: '#94a3b8', margin: '0 0 1.25rem' }}>Your expert activity at a glance.</p>

      {!hasAvailabilityConfigured && (
        <div
          style={{ ...cardStyle, marginBottom: '1.25rem', color: '#fcd34d', fontSize: '0.88rem' }}
        >
          You haven&apos;t set up your availability yet.{' '}
          <Link
            href="/expert/availability"
            style={{ color: '#93c5fd', textDecoration: 'underline' }}
          >
            Set up availability
          </Link>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <div style={statTileStyle}>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.78rem' }}>Upcoming sessions</p>
          <p
            style={{ margin: '0.2rem 0 0', color: '#f1f5f9', fontSize: '1.4rem', fontWeight: 700 }}
          >
            {stats.upcomingBookingsCount}
          </p>
        </div>
        <div style={statTileStyle}>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.78rem' }}>Completed sessions</p>
          <p
            style={{ margin: '0.2rem 0 0', color: '#f1f5f9', fontSize: '1.4rem', fontWeight: 700 }}
          >
            {stats.completedSessionsCount}
          </p>
        </div>
        <div style={statTileStyle}>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.78rem' }}>Active services</p>
          <p
            style={{ margin: '0.2rem 0 0', color: '#f1f5f9', fontSize: '1.4rem', fontWeight: 700 }}
          >
            {stats.activeServicesCount}
          </p>
        </div>
        <div style={statTileStyle}>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.78rem' }}>Rating</p>
          <p
            style={{ margin: '0.2rem 0 0', color: '#f1f5f9', fontSize: '1.4rem', fontWeight: 700 }}
          >
            {stats.rating.average !== null ? `★ ${stats.rating.average.toFixed(1)}` : '—'}
          </p>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.75rem' }}>
            {stats.rating.count} review{stats.rating.count === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{ ...cardStyle, flex: '2 1 20rem' }}>
          <div
            style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}
          >
            <h2 style={{ margin: 0, color: '#f1f5f9', fontSize: '1.05rem' }}>Upcoming sessions</h2>
            <Link href="/expert/bookings" style={{ color: '#93c5fd', fontSize: '0.82rem' }}>
              View all →
            </Link>
          </div>
          {upcomingBookings.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No upcoming sessions.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {upcomingBookings.map((booking) => (
                <div
                  key={booking.id}
                  style={{
                    padding: '0.5rem 0.75rem',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '0.4rem',
                    fontSize: '0.85rem',
                  }}
                >
                  <span style={{ color: '#e2e8f0' }}>{booking.serviceTitle}</span>
                  <span style={{ color: '#64748b' }}>
                    {' '}
                    with {booking.candidateDisplayName} ·{' '}
                    {new Date(booking.slotStartUtc).toLocaleString()} · {booking.durationMinutes}{' '}
                    min
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: '1 1 16rem' }}
        >
          <div style={cardStyle}>
            <div
              style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}
            >
              <h2 style={{ margin: 0, color: '#f1f5f9', fontSize: '1.05rem' }}>Wallet</h2>
              <Link href="/expert/wallet" style={{ color: '#93c5fd', fontSize: '0.82rem' }}>
                View →
              </Link>
            </div>
            {wallet ? (
              <p style={{ margin: 0, color: '#f1f5f9', fontSize: '1.2rem', fontWeight: 700 }}>
                {wallet.currency} {wallet.balance}
              </p>
            ) : (
              <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No wallet set up yet.</p>
            )}
          </div>

          <div style={cardStyle}>
            <div
              style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}
            >
              <h2 style={{ margin: 0, color: '#f1f5f9', fontSize: '1.05rem' }}>Recent reviews</h2>
              <Link href="/expert/reviews" style={{ color: '#93c5fd', fontSize: '0.82rem' }}>
                View all →
              </Link>
            </div>
            {recentReviews.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No reviews yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {recentReviews.map((review) => (
                  <p key={review.id} style={{ margin: 0, color: '#fcd34d', fontSize: '0.85rem' }}>
                    {'★'.repeat(review.rating)}
                    {'☆'.repeat(5 - review.rating)}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
