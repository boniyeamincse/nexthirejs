'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-context';
import { ApiClientError, getMyExpertServices, lifecycleExpertService } from '@/lib/api-client';
import type { ExpertServiceResult, ExpertServiceStatus } from '@nexthire/types';
import { EXPERT_SERVICE_TYPES, EXPERT_SERVICE_STATUSES } from '@nexthire/constants';

const STATUS_TABS = ['All', ...EXPERT_SERVICE_STATUSES] as const;

const STATUS_BADGE: Record<ExpertServiceStatus, { bg: string; text: string }> = {
  DRAFT: { bg: 'rgba(100,116,139,0.15)', text: '#94a3b8' },
  ACTIVE: { bg: 'rgba(34,197,94,0.15)', text: '#86efac' },
  INACTIVE: { bg: 'rgba(245,158,11,0.15)', text: '#fcd34d' },
  ARCHIVED: { bg: 'rgba(239,68,68,0.15)', text: '#fca5a5' },
};

const SERVICE_TYPE_LABELS: Record<string, string> = {
  MOCK_INTERVIEW: 'Mock Interview',
  CV_REVIEW: 'CV Review',
  CAREER_COACHING: 'Career Coaching',
  TECHNICAL_INTERVIEW_PREPARATION: 'Technical Interview Prep',
  BEHAVIORAL_INTERVIEW_PREPARATION: 'Behavioral Interview Prep',
  PORTFOLIO_REVIEW: 'Portfolio Review',
};

export default function ServicesPage() {
  const { getAccessToken, logout, status: authStatus } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [services, setServices] = useState<ExpertServiceResult[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setPageError(null);
    try {
      const data = await getMyExpertServices(token);
      setServices(data);
    } catch (err) {
      if (err instanceof ApiClientError && err.statusCode === 401) {
        await logout();
        return;
      }
      setPageError('Failed to load services. Please try again.');
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

  async function handleLifecycle(serviceId: string, action: string) {
    const token = getAccessToken();
    if (!token) return;
    setActionLoading(serviceId);
    setActionError(null);
    try {
      await lifecycleExpertService(token, serviceId, action);
      await load();
    } catch (err) {
      if (err instanceof ApiClientError && err.statusCode === 401) {
        await logout();
        return;
      }
      setActionError(err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setActionLoading(null);
    }
  }

  const filtered =
    statusFilter === 'All' ? services : services.filter((s) => s.status === statusFilter);

  if (authStatus === 'unknown' || authStatus === 'loading' || loading) {
    return <p style={{ color: '#94a3b8' }}>Loading...</p>;
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.35rem',
        }}
      >
        <h1 style={{ color: '#f1f5f9', fontSize: '1.6rem', fontWeight: 700, margin: 0 }}>
          Services
        </h1>
        <Link
          href="/expert/services/new"
          style={{
            padding: '0.55rem 1.1rem',
            background: '#2563eb',
            color: '#fff',
            borderRadius: '0.5rem',
            fontWeight: 600,
            fontSize: '0.9rem',
            textDecoration: 'none',
          }}
        >
          Create Service
        </Link>
      </div>
      <p style={{ color: '#94a3b8', margin: '0 0 1.25rem' }}>Manage your expert services.</p>

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
          <button
            onClick={() => void load()}
            style={{
              marginLeft: '0.5rem',
              background: 'none',
              border: 'none',
              color: '#fca5a5',
              textDecoration: 'underline',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
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

      {/* Status filter tabs */}
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
            {tab === 'All' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>No services found.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {filtered.map((service) => {
          const badge = STATUS_BADGE[service.status];
          return (
            <div
              key={service.id}
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
                  alignItems: 'flex-start',
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
                      flexWrap: 'wrap',
                      marginBottom: '0.3rem',
                    }}
                  >
                    <span style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '0.95rem' }}>
                      {service.title}
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
                      {service.status === 'DRAFT'
                        ? 'Draft'
                        : service.status === 'ACTIVE'
                          ? 'Active'
                          : service.status === 'INACTIVE'
                            ? 'Inactive'
                            : 'Archived'}
                    </span>
                    <span
                      style={{
                        padding: '0.15rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        background: 'rgba(99,102,241,0.15)',
                        color: '#a5b4fc',
                        fontWeight: 500,
                      }}
                    >
                      {SERVICE_TYPE_LABELS[service.type] || service.type}
                    </span>
                  </div>
                  <p
                    style={{
                      color: '#94a3b8',
                      fontSize: '0.85rem',
                      margin: '0.2rem 0 0',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {service.shortDescription}
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      gap: '1rem',
                      marginTop: '0.4rem',
                      color: '#64748b',
                      fontSize: '0.83rem',
                    }}
                  >
                    <span>{service.durationMinutes} min</span>
                    <span>
                      {service.price.amount} {service.price.currency}
                    </span>
                  </div>
                </div>
              </div>

              <div
                style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}
              >
                {(service.status === 'DRAFT' || service.status === 'INACTIVE') && (
                  <Link
                    href={`/expert/services/${service.id}/edit`}
                    style={{
                      padding: '0.35rem 0.8rem',
                      background: 'rgba(99,102,241,0.15)',
                      color: '#a5b4fc',
                      border: '1px solid rgba(99,102,241,0.3)',
                      borderRadius: '0.375rem',
                      fontSize: '0.83rem',
                      fontWeight: 500,
                      textDecoration: 'none',
                    }}
                  >
                    Edit
                  </Link>
                )}
                {service.status === 'DRAFT' && (
                  <button
                    onClick={() => handleLifecycle(service.id, 'activate')}
                    disabled={actionLoading === service.id}
                    style={{
                      padding: '0.35rem 0.8rem',
                      background: 'rgba(34,197,94,0.15)',
                      color: '#86efac',
                      border: '1px solid rgba(34,197,94,0.3)',
                      borderRadius: '0.375rem',
                      fontSize: '0.83rem',
                      fontWeight: 500,
                      cursor: actionLoading === service.id ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {actionLoading === service.id ? '...' : 'Activate'}
                  </button>
                )}
                {service.status === 'DRAFT' && (
                  <button
                    onClick={() => handleLifecycle(service.id, 'archive')}
                    disabled={actionLoading === service.id}
                    style={{
                      padding: '0.35rem 0.8rem',
                      background: 'rgba(239,68,68,0.15)',
                      color: '#fca5a5',
                      border: '1px solid rgba(239,68,68,0.3)',
                      borderRadius: '0.375rem',
                      fontSize: '0.83rem',
                      fontWeight: 500,
                      cursor: actionLoading === service.id ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {actionLoading === service.id ? '...' : 'Archive'}
                  </button>
                )}
                {service.status === 'ACTIVE' && (
                  <button
                    onClick={() => handleLifecycle(service.id, 'deactivate')}
                    disabled={actionLoading === service.id}
                    style={{
                      padding: '0.35rem 0.8rem',
                      background: 'rgba(245,158,11,0.15)',
                      color: '#fcd34d',
                      border: '1px solid rgba(245,158,11,0.3)',
                      borderRadius: '0.375rem',
                      fontSize: '0.83rem',
                      fontWeight: 500,
                      cursor: actionLoading === service.id ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {actionLoading === service.id ? '...' : 'Deactivate'}
                  </button>
                )}
                {service.status === 'INACTIVE' && (
                  <button
                    onClick={() => handleLifecycle(service.id, 'activate')}
                    disabled={actionLoading === service.id}
                    style={{
                      padding: '0.35rem 0.8rem',
                      background: 'rgba(34,197,94,0.15)',
                      color: '#86efac',
                      border: '1px solid rgba(34,197,94,0.3)',
                      borderRadius: '0.375rem',
                      fontSize: '0.83rem',
                      fontWeight: 500,
                      cursor: actionLoading === service.id ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {actionLoading === service.id ? '...' : 'Activate'}
                  </button>
                )}
                {service.status === 'INACTIVE' && (
                  <button
                    onClick={() => handleLifecycle(service.id, 'archive')}
                    disabled={actionLoading === service.id}
                    style={{
                      padding: '0.35rem 0.8rem',
                      background: 'rgba(239,68,68,0.15)',
                      color: '#fca5a5',
                      border: '1px solid rgba(239,68,68,0.3)',
                      borderRadius: '0.375rem',
                      fontSize: '0.83rem',
                      fontWeight: 500,
                      cursor: actionLoading === service.id ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {actionLoading === service.id ? '...' : 'Archive'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
