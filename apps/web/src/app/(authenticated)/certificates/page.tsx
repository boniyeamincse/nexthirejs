'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-context';
import { getMyCertificates, ApiClientError } from '@/lib/api-client';
import type { AssessmentCertificateListItem } from '@nexthire/types';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function statusStyles(status: string) {
  switch (status) {
    case 'READY':
      return { bg: 'rgba(34,197,94,0.1)', color: '#22c55e' };
    case 'PENDING':
    case 'GENERATING':
      return { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' };
    case 'FAILED':
      return { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' };
    case 'EXPIRED':
      return { bg: 'rgba(100,116,139,0.1)', color: '#94a3b8' };
    case 'REVOKED':
      return { bg: 'rgba(239,68,68,0.15)', color: '#fca5a5' };
    default:
      return { bg: 'rgba(100,116,139,0.1)', color: '#94a3b8' };
  }
}

function SkeletonRow() {
  return (
    <div
      style={{
        display: 'flex',
        gap: '1rem',
        padding: '1rem',
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '0.75rem',
        marginBottom: '0.75rem',
      }}
    >
      <div style={{ flex: 2 }}>
        <div style={{ height: '1rem', background: '#334155', borderRadius: '0.25rem', width: '60%', marginBottom: '0.5rem' }} />
        <div style={{ height: '0.75rem', background: '#334155', borderRadius: '0.25rem', width: '40%' }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ height: '1rem', background: '#334155', borderRadius: '0.25rem', width: '40%', marginBottom: '0.5rem' }} />
        <div style={{ height: '0.75rem', background: '#334155', borderRadius: '0.25rem', width: '60%' }} />
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        <div style={{ height: '1.5rem', background: '#334155', borderRadius: '9999px', width: '5rem' }} />
      </div>
    </div>
  );
}

export default function CertificatesPage() {
  const { getAccessToken, logout, status: authStatus } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [certificates, setCertificates] = useState<AssessmentCertificateListItem[]>([]);

  const fetchCertificates = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      await logout();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await getMyCertificates(token);
      setCertificates(result.items);
    } catch (err) {
      if (err instanceof ApiClientError && err.statusCode === 401) {
        await logout();
        return;
      }
      setError('Failed to load certificates. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, logout]);

  useEffect(() => {
    if (authStatus === 'authenticated') {
      void fetchCertificates();
    } else if (authStatus === 'unauthenticated') {
      setLoading(false);
    }
  }, [authStatus, fetchCertificates]);

  if (authStatus === 'unknown' || authStatus === 'loading') {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (authStatus === 'unauthenticated') {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <p className="text-gray-400">Please log in to view certificates.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-1" style={{ color: '#f1f5f9' }}>My Certificates</h1>
        <p className="text-sm mb-6" style={{ color: '#64748b' }}>Loading your certificates...</p>
        <div className="animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <p className="text-red-400 mb-4" role="alert">{error}</p>
        <button
          onClick={fetchCertificates}
          className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
          style={{ color: 'white', border: 'none', cursor: 'pointer' }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-1" style={{ color: '#f1f5f9' }}>My Certificates</h1>
      <p className="text-sm mb-6" style={{ color: '#64748b' }}>
        View and download your assessment certificates.
      </p>

      {certificates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-lg mb-2" style={{ color: '#94a3b8' }}>No certificates yet</p>
          <p className="text-sm" style={{ color: '#64748b' }}>
            Complete an assessment with a passing score to earn a certificate.
          </p>
        </div>
      )}

      {certificates.length > 0 && (
        <div className="space-y-3">
          {certificates.map((cert) => {
            const ss = statusStyles(cert.status);
            return (
              <Link
                key={cert.id}
                href={`/certificates/${cert.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem 1.25rem',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '0.75rem',
                  textDecoration: 'none',
                  transition: 'border-color 0.15s',
                }}
                onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#475569'; }}
                onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#334155'; }}
              >
                <div style={{ flex: 2, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 600, color: '#f1f5f9', fontSize: '0.95rem' }}>
                    {cert.assessmentTitle}
                  </p>
                  <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                    {cert.certificateNumber}
                  </p>
                </div>

                <div style={{ flex: 1, textAlign: 'center' }}>
                  <p style={{ margin: 0, fontWeight: 700, color: '#e4e4e7', fontSize: '1rem' }}>
                    {cert.scorePercentage.toFixed(1)}%
                  </p>
                  <p style={{ margin: '0.1rem 0 0', fontSize: '0.7rem', color: '#64748b' }}>
                    Score
                  </p>
                </div>

                <div style={{ flex: 1, textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                    {formatDate(cert.issuedAt)}
                  </p>
                  <p style={{ margin: '0.1rem 0 0', fontSize: '0.7rem', color: '#64748b' }}>
                    {cert.expiresAt ? `Expires ${formatDate(cert.expiresAt)}` : 'No expiry'}
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: ss.bg,
                      color: ss.color,
                    }}
                  >
                    {cert.status}
                  </span>
                  {cert.downloadAvailable && (
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.7rem', color: '#22c55e' }}>
                      Download available
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
