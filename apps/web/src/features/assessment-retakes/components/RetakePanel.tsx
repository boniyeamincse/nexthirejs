'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-context';
import { getAssessmentRetakeEligibility, ApiClientError } from '@/lib/api-client';
import type { AssessmentRetakeEligibility } from '@nexthire/types';

interface RetakePanelProps {
  assessmentIdOrSlug: string;
}

function formatCooldown(cooldownEndsAt: string): string {
  const remaining = new Date(cooldownEndsAt).getTime() - Date.now();
  if (remaining <= 0) return 'ending soon';
  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function RetakePanel({ assessmentIdOrSlug }: RetakePanelProps) {
  const router = useRouter();
  const { getAccessToken, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eligibility, setEligibility] = useState<AssessmentRetakeEligibility | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchEligibility = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      await logout();
      router.push('/login');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await getAssessmentRetakeEligibility(token, assessmentIdOrSlug);
      setEligibility(result);
    } catch (err) {
      if (err instanceof ApiClientError && err.statusCode === 401) {
        await logout();
        router.push('/login');
        return;
      }
      setError('Failed to check retake eligibility. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, logout, router, assessmentIdOrSlug]);

  useEffect(() => {
    void fetchEligibility();
  }, [fetchEligibility]);

  const handleAction = async () => {
    setActionLoading(true);
    try {
      router.push(`/assessments/${assessmentIdOrSlug}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          padding: '1.25rem',
          background: '#0f172a',
          borderRadius: '0.5rem',
          textAlign: 'center',
        }}
        role="status"
      >
        <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>
          Checking retake eligibility...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: '1rem',
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '0.5rem',
          color: '#fca5a5',
          fontSize: '0.85rem',
          textAlign: 'center',
        }}
        role="alert"
      >
        <p style={{ margin: '0 0 0.5rem' }}>{error}</p>
        <button
          onClick={fetchEligibility}
          style={{
            padding: '0.375rem 0.75rem',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            fontSize: '0.8rem',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!eligibility) return null;

  const { reason, attemptsUsed, maximumAttempts, cooldownEndsAt } = eligibility;

  switch (reason) {
    case 'FIRST_ATTEMPT_AVAILABLE':
      return (
        <div style={{ padding: '1rem', background: '#0f172a', borderRadius: '0.5rem', textAlign: 'center' }}>
          <button
            onClick={handleAction}
            disabled={actionLoading}
            style={{
              padding: '0.75rem 2rem',
              background: '#22c55e',
              color: '#0f172a',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            {actionLoading ? 'Starting...' : 'Start assessment'}
          </button>
        </div>
      );

    case 'RETAKE_AVAILABLE':
      return (
        <div style={{ padding: '1rem', background: '#0f172a', borderRadius: '0.5rem', textAlign: 'center' }}>
          <p style={{ color: '#94a3b8', margin: '0 0 0.75rem', fontSize: '0.85rem' }}>
            Attempts used: {attemptsUsed}{maximumAttempts ? ` / ${maximumAttempts}` : ''}
          </p>
          <button
            onClick={handleAction}
            disabled={actionLoading}
            style={{
              padding: '0.75rem 2rem',
              background: '#f59e0b',
              color: '#0f172a',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            {actionLoading ? 'Starting...' : 'Retake assessment'}
          </button>
        </div>
      );

    case 'ACTIVE_ATTEMPT_EXISTS':
      return (
        <div style={{ padding: '1rem', background: '#0f172a', borderRadius: '0.5rem', textAlign: 'center' }}>
          <Link
            href={`/assessments/${assessmentIdOrSlug}`}
            style={{
              display: 'inline-block',
              padding: '0.75rem 2rem',
              background: '#f59e0b',
              color: '#0f172a',
              borderRadius: '0.5rem',
              fontWeight: 600,
              fontSize: '1rem',
              textDecoration: 'none',
            }}
          >
            Resume attempt
          </Link>
        </div>
      );

    case 'RETAKE_DISABLED':
      return (
        <div
          style={{
            padding: '1rem',
            background: 'rgba(245,158,11,0.1)',
            border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: '0.5rem',
            color: '#fbbf24',
            fontSize: '0.85rem',
            textAlign: 'center',
          }}
        >
          Retakes are not enabled for this assessment.
        </div>
      );

    case 'ATTEMPT_LIMIT_REACHED':
      return (
        <div
          style={{
            padding: '1rem',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '0.5rem',
            color: '#fca5a5',
            fontSize: '0.85rem',
            textAlign: 'center',
          }}
        >
          You have used all {attemptsUsed}{maximumAttempts ? ` / ${maximumAttempts}` : ''} attempts for this assessment.
        </div>
      );

    case 'COOLDOWN_ACTIVE':
      return (
        <div
          style={{
            padding: '1rem',
            background: 'rgba(245,158,11,0.1)',
            border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: '0.5rem',
            color: '#fbbf24',
            fontSize: '0.85rem',
            textAlign: 'center',
          }}
        >
          Cooldown active. You can retake in{' '}
          {cooldownEndsAt ? formatCooldown(cooldownEndsAt) : 'some time'}.
        </div>
      );

    default:
      return (
        <div
          style={{
            padding: '1rem',
            background: 'rgba(100,116,139,0.1)',
            border: '1px solid rgba(100,116,139,0.3)',
            borderRadius: '0.5rem',
            color: '#94a3b8',
            fontSize: '0.85rem',
            textAlign: 'center',
          }}
        >
          This assessment is not available.
        </div>
      );
  }
}
