'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/providers/auth-context';
import { ApiClientError, listMyReceivedExpertReviews } from '@/lib/api-client';
import type { ExpertReviewResult, ExpertRatingAggregate } from '@nexthire/types';

export default function ExpertReviewsPage() {
  const { getAccessToken, logout, status: authStatus } = useAuth();

  const [reviews, setReviews] = useState<ExpertReviewResult[]>([]);
  const [aggregate, setAggregate] = useState<ExpertRatingAggregate>({ average: null, count: 0 });
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setPageError(null);
    try {
      const data = await listMyReceivedExpertReviews(token);
      setReviews(data.data);
      setAggregate(data.aggregate);
    } catch (err) {
      if (err instanceof ApiClientError && err.statusCode === 401) {
        await logout();
        return;
      }
      setPageError('Failed to load your reviews. Please try again.');
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

  return (
    <div>
      <h1 style={{ color: '#f1f5f9', fontSize: '1.6rem', fontWeight: 700, margin: '0 0 0.35rem' }}>
        Reviews
      </h1>
      <p style={{ color: '#94a3b8', margin: '0 0 1rem' }}>
        {aggregate.average !== null
          ? `${'★'.repeat(Math.round(aggregate.average))}${'☆'.repeat(5 - Math.round(aggregate.average))} ${aggregate.average.toFixed(1)} average from ${aggregate.count} review${aggregate.count === 1 ? '' : 's'}`
          : 'No reviews yet.'}
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

      {reviews.length === 0 && !pageError && (
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>No reviews found.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {reviews.map((review) => (
          <div
            key={review.id}
            style={{
              padding: '0.9rem 1rem',
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '0.6rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#fcd34d', fontSize: '0.95rem' }}>
                {'★'.repeat(review.rating)}
                {'☆'.repeat(5 - review.rating)}
              </span>
              {review.isHidden && (
                <span
                  style={{
                    padding: '0.15rem 0.5rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    background: 'rgba(148,163,184,0.15)',
                    color: '#94a3b8',
                  }}
                >
                  Hidden
                </span>
              )}
            </div>
            {review.candidateDisplayName && (
              <p style={{ margin: '0.3rem 0 0', color: '#94a3b8', fontSize: '0.82rem' }}>
                from {review.candidateDisplayName}
              </p>
            )}
            {review.comment && (
              <p style={{ margin: '0.4rem 0 0', color: '#cbd5e1', fontSize: '0.85rem' }}>
                {review.comment}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
