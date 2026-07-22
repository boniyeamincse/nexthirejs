'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-context';
import { getAssessmentDetail, ApiClientError } from '@/lib/api-client';
import type { AssessmentCatalogDetail } from '@nexthire/types';

export default function AssessmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { getAccessToken, logout, status: authStatus } = useAuth();
  const assessmentId = typeof params.assessmentId === 'string' ? params.assessmentId : '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assessment, setAssessment] = useState<AssessmentCatalogDetail | null>(null);

  const fetchDetail = useCallback(async () => {
    const token = getAccessToken();
    if (!token || !assessmentId) {
      await logout();
      router.push('/login');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await getAssessmentDetail(token, assessmentId);
      setAssessment(result);
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.statusCode === 401) {
          await logout();
          router.push('/login');
          return;
        }
        if (err.statusCode === 404) {
          setError('Assessment not found.');
          return;
        }
        setError(err.message);
      } else {
        setError('Failed to load assessment. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, logout, router, assessmentId]);

  useEffect(() => {
    if (authStatus === 'authenticated') {
      void fetchDetail();
    } else if (authStatus === 'unauthenticated') {
      setLoading(false);
    }
  }, [authStatus, fetchDetail]);

  if (authStatus === 'unknown' || authStatus === 'loading') {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '2rem', color: '#94a3b8' }} role="status">
        Loading...
      </div>
    );
  }

  if (authStatus === 'unauthenticated') {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '2rem', color: '#94a3b8' }}>
        Please log in to view assessment details.
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '2rem', color: '#94a3b8' }} role="status">
        Loading assessment...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '2rem' }}>
        <div
          role="alert"
          style={{
            background: error === 'Assessment not found.' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${error === 'Assessment not found.' ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color: error === 'Assessment not found.' ? '#fbbf24' : '#fca5a5',
            padding: '1rem',
            borderRadius: '0.5rem',
          }}
        >
          <p>{error}</p>
          {error !== 'Assessment not found.' && (
            <button
              onClick={fetchDetail}
              style={{
                marginTop: '0.5rem',
                padding: '0.375rem 0.75rem',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          )}
          <div style={{ marginTop: '1rem' }}>
            <Link
              href="/assessments"
              style={{ color: '#60a5fa', textDecoration: 'underline' }}
            >
              Back to catalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '2rem' }}>
        <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24', padding: '1rem', borderRadius: '0.5rem' }}>
          <p>Assessment not found.</p>
          <div style={{ marginTop: '1rem' }}>
            <Link href="/assessments" style={{ color: '#60a5fa', textDecoration: 'underline' }}>Back to catalog</Link>
          </div>
        </div>
      </div>
    );
  }

  const isAvailable = assessment.availability === 'AVAILABLE';

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '2rem' }}>
      <Link
        href="/assessments"
        style={{ color: '#60a5fa', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-block', marginBottom: '1.5rem' }}
      >
        &larr; Back to catalog
      </Link>

      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '0.75rem', padding: '2rem' }}>
        <div style={{ marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>
            {assessment.category.name}
          </span>
        </div>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.75rem', color: '#f1f5f9' }}>
          {assessment.title}
        </h1>

        <p style={{ color: '#94a3b8', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          {assessment.shortDescription}
        </p>

        {assessment.description && (
          <p style={{ color: '#cbd5e1', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            {assessment.description}
          </p>
        )}

        {assessment.instructions && (
          <div style={{ background: '#0f172a', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f1f5f9', marginBottom: '0.5rem' }}>Instructions</h2>
            <p style={{ color: '#94a3b8', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{assessment.instructions}</p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          <DetailBadge label="Type" value={assessment.type.replace(/_/g, ' ')} />
          <DetailBadge label="Difficulty" value={assessment.difficulty.charAt(0) + assessment.difficulty.slice(1).toLowerCase()} />
          <DetailBadge label="Duration" value={`${assessment.estimatedDurationMinutes} minutes`} />
          <DetailBadge label="Questions" value={String(assessment.questionCount)} />
          <DetailBadge
            label="Availability"
            value={assessment.availability === 'AVAILABLE' ? 'Available Now' : assessment.availability === 'COMING_SOON' ? 'Coming Soon' : 'Unavailable'}
            color={isAvailable ? '#22c55e' : assessment.availability === 'COMING_SOON' ? '#f59e0b' : '#64748b'}
          />
        </div>

        <div
          style={{
            padding: '1rem',
            background: '#0f172a',
            borderRadius: '0.5rem',
            textAlign: 'center',
          }}
        >
          {isAvailable ? (
            <p style={{ color: '#94a3b8', margin: 0 }}>
              Assessment attempts will be enabled in a later step.
            </p>
          ) : (
            <p style={{ color: '#f59e0b', margin: 0 }}>
              {assessment.availability === 'COMING_SOON'
                ? 'This assessment is coming soon. Check back later.'
                : 'This assessment is not currently available.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailBadge({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', marginBottom: '0.25rem' }}>
        {label}
      </div>
      <div style={{ fontSize: '0.9rem', color: color ?? '#cbd5e1', fontWeight: 500 }}>
        {value}
      </div>
    </div>
  );
}
