'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-context';
import {
  getMyCertificate,
  getMyCertificateDownload,
  retryMyCertificate,
  ApiClientError,
} from '@/lib/api-client';
import type { AssessmentCertificateDetail } from '@nexthire/types';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function statusBadgeStyle(status: string) {
  switch (status) {
    case 'READY':
      return { bg: 'rgba(34,197,94,0.15)', color: '#22c55e', label: 'Ready' };
    case 'PENDING':
      return { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', label: 'Pending' };
    case 'GENERATING':
      return { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', label: 'Generating...' };
    case 'FAILED':
      return { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', label: 'Failed' };
    case 'EXPIRED':
      return { bg: 'rgba(100,116,139,0.15)', color: '#94a3b8', label: 'Expired' };
    case 'REVOKED':
      return { bg: 'rgba(239,68,68,0.15)', color: '#fca5a5', label: 'Revoked' };
    default:
      return { bg: 'rgba(100,116,139,0.15)', color: '#94a3b8', label: status };
  }
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{label}</span>
      <span style={{ color: '#e4e4e7', fontSize: '0.85rem', fontWeight: 500 }}>{value}</span>
    </div>
  );
}

export default function CertificateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const certificateId = typeof params.certificateId === 'string' ? params.certificateId : '';
  const { getAccessToken, logout, status: authStatus } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cert, setCert] = useState<AssessmentCertificateDetail | null>(null);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [retryLoading, setRetryLoading] = useState(false);

  const fetchDetail = useCallback(async () => {
    const token = getAccessToken();
    if (!token || !certificateId) {
      await logout();
      router.push('/login');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await getMyCertificate(token, certificateId);
      setCert(result);
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.statusCode === 401) {
          await logout();
          router.push('/login');
          return;
        }
        if (err.statusCode === 404) {
          setError('Certificate not found.');
          return;
        }
        setError(err.message);
      } else {
        setError('Failed to load certificate. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, logout, router, certificateId]);

  const handleDownload = async () => {
    const token = getAccessToken();
    if (!token || !cert) return;
    setDownloadLoading(true);
    try {
      const result = await getMyCertificateDownload(token, certificateId);
      window.open(result.downloadUrl, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      setError(err.message || 'Failed to download certificate.');
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleRetry = async () => {
    const token = getAccessToken();
    if (!token) return;
    setRetryLoading(true);
    try {
      await retryMyCertificate(token, certificateId);
      void fetchDetail();
    } catch (err: any) {
      setError(err.message || 'Failed to retry certificate generation.');
    } finally {
      setRetryLoading(false);
    }
  };

  useEffect(() => {
    if (authStatus === 'authenticated') {
      void fetchDetail();
    } else if (authStatus === 'unauthenticated') {
      setLoading(false);
    }
  }, [authStatus, fetchDetail]);

  if (authStatus === 'unknown' || authStatus === 'loading') {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (authStatus === 'unauthenticated') {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <p className="text-gray-400">Please log in to view certificate details.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-1/2" />
          <div className="h-4 bg-gray-700 rounded w-1/3" />
          <div className="h-64 bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  if (error && error === 'Certificate not found.') {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <p className="text-yellow-400 text-lg mb-2">Certificate Not Found</p>
        <p className="text-gray-400 mb-4">This certificate could not be found.</p>
        <Link href="/certificates" className="text-blue-400 hover:underline">
          Back to Certificates
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <p className="text-red-400 mb-4" role="alert">{error}</p>
        <button
          onClick={fetchDetail}
          className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
          style={{ color: 'white', border: 'none', cursor: 'pointer' }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!cert) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <p className="text-yellow-400 text-lg mb-2">Certificate Not Found</p>
        <Link href="/certificates" className="text-blue-400 hover:underline">
          Back to Certificates
        </Link>
      </div>
    );
  }

  const badge = statusBadgeStyle(cert.status);
  const isExpiredOrRevoked = cert.status === 'EXPIRED' || cert.status === 'REVOKED';

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Link
        href="/certificates"
        className="text-blue-400 hover:underline text-sm mb-4 inline-block"
        style={{ textDecoration: 'none' }}
      >
        &larr; Back to Certificates
      </Link>

      <div
        style={{
          background: '#1e293b',
          border: isExpiredOrRevoked ? '1px solid rgba(239,68,68,0.3)' : '1px solid #334155',
          borderRadius: '0.75rem',
          padding: '2rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#f1f5f9', margin: 0 }}>
              {cert.assessmentTitle}
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              {cert.holderName}
            </p>
          </div>
          <span
            style={{
              display: 'inline-block',
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              fontWeight: 600,
              background: badge.bg,
              color: badge.color,
            }}
          >
            {badge.label}
          </span>
        </div>

        <div>
          <DetailRow label="Certificate Number" value={cert.certificateNumber} />
          <DetailRow label="Assessment" value={cert.assessmentTitle} />
          <DetailRow label="Score" value={`${cert.scorePercentage.toFixed(1)}%`} />
          <DetailRow label="Status" value={badge.label} />
          <DetailRow label="Issued" value={formatDate(cert.issuedAt)} />
          <DetailRow label="Expires" value={formatDate(cert.expiresAt)} />
          <DetailRow label="Generated" value={formatDate(cert.generatedAt)} />
          {cert.failedAt && (
            <DetailRow label="Failed At" value={formatDate(cert.failedAt)} />
          )}
          {cert.failureCategory && (
            <DetailRow label="Failure Reason" value={cert.failureCategory} />
          )}
          {cert.verificationCodeHint && (
            <DetailRow label="Verification Code" value={cert.verificationCodeHint} />
          )}
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          {cert.status === 'READY' && cert.downloadAvailable && (
            <button
              onClick={handleDownload}
              disabled={downloadLoading}
              style={{
                padding: '0.75rem 2rem',
                background: '#22c55e',
                color: '#0f172a',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              {downloadLoading ? 'Preparing download...' : 'Download Certificate'}
            </button>
          )}

          {cert.status === 'FAILED' && (
            <button
              onClick={handleRetry}
              disabled={retryLoading}
              style={{
                padding: '0.75rem 2rem',
                background: '#f59e0b',
                color: '#0f172a',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              {retryLoading ? 'Retrying...' : 'Retry Generation'}
            </button>
          )}
        </div>

        {isExpiredOrRevoked && (
          <p
            style={{
              marginTop: '1rem',
              textAlign: 'center',
              fontSize: '0.8rem',
              color: cert.status === 'EXPIRED' ? '#94a3b8' : '#fca5a5',
            }}
          >
            {cert.status === 'EXPIRED'
              ? 'This certificate has expired and is no longer valid.'
              : 'This certificate has been revoked.'}
          </p>
        )}
      </div>
    </div>
  );
}
