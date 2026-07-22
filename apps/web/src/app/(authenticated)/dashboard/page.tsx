'use client';
/* eslint-disable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-context';
import { getMyProfileCompletionDashboard, ApiClientError } from '@/lib/api-client';
import type { CandidateProfileCompletionDashboard } from '@/lib/api-client';
import Link from 'next/link';

export default function DashboardPage() {
  const { getAccessToken, logout, status: authStatus } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<CandidateProfileCompletionDashboard | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setPageError(null);

    try {
      const data = await getMyProfileCompletionDashboard(token);
      setDashboard(data);
    } catch (err) {
      if (err instanceof ApiClientError && err.statusCode === 401) {
        await logout();
        router.push('/login');
        return;
      }
      setPageError('Dashboard is temporarily unavailable. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, logout, router]);

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  const statusLabel = (s: string): string => {
    switch (s) {
      case 'NOT_STARTED':
        return 'Not started';
      case 'IN_PROGRESS':
        return 'In progress';
      case 'COMPLETED':
        return 'Completed';
      default:
        return s;
    }
  };

  const statusDesc = (s: string): string => {
    switch (s) {
      case 'NOT_STARTED':
        return 'This section has not been started yet.';
      case 'IN_PROGRESS':
        return 'This section is partially completed.';
      case 'COMPLETED':
        return 'This section is fully completed.';
      default:
        return '';
    }
  };

  if (authStatus === 'unknown' || authStatus === 'loading') {
    return (
      <div
        style={{
          display: 'flex',
          minHeight: 'calc(100vh - 72px)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        aria-live="polite"
        aria-busy="true"
      >
        <p style={{ color: '#71717a' }}>Loading...</p>
      </div>
    );
  }

  if (authStatus === 'unauthenticated') {
    return (
      <div
        style={{
          display: 'flex',
          minHeight: 'calc(100vh - 72px)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p style={{ color: '#71717a' }}>Session expired. Please log in again.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          minHeight: 'calc(100vh - 72px)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        aria-live="polite"
        aria-busy="true"
      >
        <p style={{ color: '#71717a' }}>Loading dashboard...</p>
      </div>
    );
  }

  if (pageError) {
    return (
      <div
        style={{
          display: 'flex',
          minHeight: 'calc(100vh - 72px)',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
        }}
        aria-live="polite"
      >
        <p style={{ color: '#ef4444' }}>{pageError}</p>
        <button
          onClick={() => void fetchDashboard()}
          style={{
            padding: '0.5rem 1.25rem',
            borderRadius: '0.5rem',
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.06)',
            color: '#e4e4e7',
            cursor: 'pointer',
            fontSize: '0.875rem',
          }}
        >
          Try again
        </button>
      </div>
    );
  }

  if (!dashboard) {
    return null;
  }

  const pct = dashboard.completion.percentage;
  const lastUpdated = dashboard.completion.updatedAt
    ? new Date(dashboard.completion.updatedAt).toLocaleString()
    : 'Unknown';

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 72px)',
        padding: '2rem 1rem',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(139,92,246,0.04) 0%, transparent 50%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '900px', margin: '0 auto' }}>
        <div
          style={{
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '1rem',
            padding: '2rem',
            marginBottom: '1.5rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '1.5rem',
            }}
          >
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: '#e4e4e7' }}>
                Profile Completion
              </h1>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                Version {dashboard.completion.version} &middot; Last updated {lastUpdated}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '2rem', fontWeight: 700, color: '#e4e4e7' }}>{pct}%</span>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                {dashboard.completion.earnedPoints} / {dashboard.completion.totalPoints} points
              </p>
            </div>
          </div>

          <div
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Profile completion: ${pct}%`}
            style={{
              width: '100%',
              height: '0.625rem',
              background: 'rgba(255,255,255,0.06)',
              borderRadius: '0.3125rem',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${pct}%`,
                height: '100%',
                background:
                  pct === 100
                    ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                    : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                borderRadius: '0.3125rem',
                transition: 'width 0.4s ease',
              }}
            />
          </div>

          {pct === 100 && (
            <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#22c55e' }}>
              Your profile is complete.
            </p>
          )}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '0.75rem',
            marginBottom: '1.5rem',
          }}
        >
          {[
            { label: 'Completed', value: dashboard.summary.completedSections, color: '#22c55e' },
            { label: 'In progress', value: dashboard.summary.inProgressSections, color: '#eab308' },
            { label: 'Not started', value: dashboard.summary.notStartedSections, color: '#64748b' },
            { label: 'Total', value: dashboard.summary.totalSections, color: '#e4e4e7' },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '0.75rem',
                padding: '1rem',
                textAlign: 'center',
              }}
            >
              <p style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: stat.color }}>
                {stat.value}
              </p>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 1rem', color: '#e4e4e7' }}>
          Sections
        </h2>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            marginBottom: '1.5rem',
          }}
        >
          {dashboard.sections.map((section) => (
            <div
              key={section.section}
              style={{
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '0.75rem',
                padding: '1.25rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '0.5rem',
                }}
              >
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, color: '#e4e4e7' }}>
                    {section.label}
                  </h3>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                    {statusLabel(section.status)} — {statusDesc(section.status)}
                  </p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#e4e4e7' }}>
                    {section.earnedPoints}/{section.possiblePoints}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '0.25rem' }}>
                    pts
                  </span>
                </div>
              </div>

              <div
                role="progressbar"
                aria-valuenow={section.percentage}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${section.label} progress: ${section.percentage}%`}
                style={{
                  width: '100%',
                  height: '0.375rem',
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: '0.1875rem',
                  overflow: 'hidden',
                  marginBottom: '0.75rem',
                }}
              >
                <div
                  style={{
                    width: `${section.percentage}%`,
                    height: '100%',
                    background:
                      section.status === 'COMPLETED'
                        ? '#22c55e'
                        : section.status === 'IN_PROGRESS'
                          ? '#eab308'
                          : '#64748b',
                    borderRadius: '0.1875rem',
                  }}
                />
              </div>

              {section.missingItems.length > 0 && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <p
                    style={{
                      margin: '0 0 0.25rem',
                      fontSize: '0.75rem',
                      color: '#a1a1aa',
                      fontWeight: 500,
                    }}
                  >
                    Missing items:
                  </p>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: '1.25rem',
                      fontSize: '0.8rem',
                      color: '#a1a1aa',
                    }}
                  >
                    {section.missingItems.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              <Link
                href={section.route}
                style={{
                  display: 'inline-block',
                  fontSize: '0.8rem',
                  color: '#818cf8',
                  textDecoration: 'none',
                  fontWeight: 500,
                }}
                aria-label={`Go to ${section.label}`}
              >
                {section.status === 'NOT_STARTED'
                  ? 'Start section'
                  : section.status === 'IN_PROGRESS'
                    ? 'Continue section'
                    : 'View section'}
              </Link>
            </div>
          ))}
        </div>

        {dashboard.nextActions.length > 0 && (
          <>
            <h2
              style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 1rem', color: '#e4e4e7' }}
            >
              Next Actions
            </h2>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                marginBottom: '1.5rem',
              }}
            >
              {dashboard.nextActions.map((action) => (
                <div
                  key={action.id}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '0.75rem',
                    padding: '1.25rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <h3
                      style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0, color: '#e4e4e7' }}
                    >
                      {action.title}
                    </h3>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                      {action.description}
                    </p>
                  </div>
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}
                  >
                    <span style={{ fontSize: '0.75rem', color: '#22c55e', fontWeight: 600 }}>
                      +{action.pointsAvailable} pts
                    </span>
                    <Link
                      href={action.route}
                      style={{
                        display: 'inline-block',
                        fontSize: '0.8rem',
                        color: '#818cf8',
                        textDecoration: 'none',
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                      }}
                      aria-label={`${action.title}: ${action.description}`}
                    >
                      Go to section
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div
          style={{
            marginTop: '2rem',
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
          }}
        >
          <Link
            href="/profile"
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '0.5rem',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.06)',
              color: '#e4e4e7',
              textDecoration: 'none',
              fontSize: '0.875rem',
            }}
          >
            View profile preview
          </Link>
          <Link
            href="/settings/privacy"
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '0.5rem',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.06)',
              color: '#e4e4e7',
              textDecoration: 'none',
              fontSize: '0.875rem',
            }}
          >
            Privacy settings
          </Link>
        </div>

        <p
          style={{
            marginTop: '1rem',
            textAlign: 'center',
            fontSize: '0.7rem',
            color: '#52525b',
          }}
        >
          Completion v{dashboard.completion.version}
        </p>
      </div>
    </div>
  );
}
