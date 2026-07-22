'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { verifyCertificate } from '@/lib/api-client';
import type { AssessmentCertificateVerificationResult } from '@nexthire/types';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function VerifyCertificatePage() {
  const params = useParams<{ verificationCode: string }>();
  const [result, setResult] = useState<AssessmentCertificateVerificationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadVerification() {
      setLoading(true);
      setError(null);

      try {
        const data = await verifyCertificate(undefined, params.verificationCode);
        if (cancelled) return;
        setResult(data);
      } catch (err: unknown) {
        if (cancelled) return;
        if (err instanceof Error) {
          if (err.message.includes('429') || err.message.includes('Rate Limit')) {
            setError('Too many requests. Please wait a moment and try again.');
          } else {
            setError(err.message);
          }
        } else {
          setError('Failed to verify certificate. Please try again.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadVerification();

    return () => {
      cancelled = true;
    };
  }, [params.verificationCode]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f0f1a',
          color: '#94a3b8',
        }}
      >
        <p>Verifying certificate...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f0f1a',
          color: '#94a3b8',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <div
          style={{
            maxWidth: '480px',
            width: '100%',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '0.75rem',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <h1 style={{ color: '#fca5a5', fontSize: '1.25rem', margin: '0 0 0.5rem' }}>Verification Failed</h1>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f0f1a',
          color: '#94a3b8',
        }}
      >
        <p>No verification data available.</p>
      </div>
    );
  }

  const isSuccess = result.valid && result.status === 'VALID';
  const isExpired = result.status === 'EXPIRED';
  const isRevoked = result.status === 'REVOKED';
  const isNotFound = result.status === 'NOT_FOUND';

  let statusIcon: string;
  let statusTitle: string;
  let statusColor: string;
  let statusBg: string;

  if (isNotFound) {
    statusIcon = '?';
    statusTitle = 'Certificate Not Found';
    statusColor = '#94a3b8';
    statusBg = 'rgba(100,116,139,0.1)';
  } else if (isSuccess) {
    statusIcon = '\u2713';
    statusTitle = 'Valid Certificate';
    statusColor = '#22c55e';
    statusBg = 'rgba(34,197,94,0.1)';
  } else if (isExpired) {
    statusIcon = '!';
    statusTitle = 'Certificate Expired';
    statusColor = '#f59e0b';
    statusBg = 'rgba(245,158,11,0.1)';
  } else if (isRevoked) {
    statusIcon = '\u2717';
    statusTitle = 'Certificate Revoked';
    statusColor = '#ef4444';
    statusBg = 'rgba(239,68,68,0.1)';
  } else {
    statusIcon = '?';
    statusTitle = 'Invalid Certificate';
    statusColor = '#ef4444';
    statusBg = 'rgba(239,68,68,0.1)';
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0f0f1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
      }}
    >
      <div
        style={{
          maxWidth: '480px',
          width: '100%',
          background: 'rgba(255,255,255,0.03)',
          border: `1px solid ${isSuccess ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: '0.75rem',
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '4rem',
            height: '4rem',
            borderRadius: '50%',
            background: statusBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            fontSize: '2rem',
            color: statusColor,
            fontWeight: 700,
          }}
          aria-hidden="true"
        >
          {statusIcon}
        </div>

        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: statusColor, margin: '0 0 0.5rem' }}>
          {statusTitle}
        </h1>

        {!isNotFound && result.certificateNumber && (
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Certificate: {result.certificateNumber}
          </p>
        )}

        {isSuccess && (
          <div
            style={{
              textAlign: 'left',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '0.5rem',
              padding: '1rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Holder Name</span>
              <span style={{ color: '#e4e4e7', fontSize: '0.85rem', fontWeight: 500 }}>{result.holderName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Assessment</span>
              <span style={{ color: '#e4e4e7', fontSize: '0.85rem', fontWeight: 500 }}>{result.assessmentTitle}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Score</span>
              <span style={{ color: '#e4e4e7', fontSize: '0.85rem', fontWeight: 500 }}>{result.scorePercentage != null ? `${result.scorePercentage.toFixed(1)}%` : '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Issued</span>
              <span style={{ color: '#e4e4e7', fontSize: '0.85rem', fontWeight: 500 }}>{formatDate(result.issuedAt)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Expires</span>
              <span style={{ color: '#e4e4e7', fontSize: '0.85rem', fontWeight: 500 }}>{formatDate(result.expiresAt)}</span>
            </div>
          </div>
        )}

        {isExpired && result.holderName && (
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '1rem' }}>
            This certificate was issued to {result.holderName} but has expired.
          </p>
        )}

        {isRevoked && result.holderName && (
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '1rem' }}>
            This certificate was issued to {result.holderName} but has been revoked.
          </p>
        )}

        {isNotFound && (
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '1rem' }}>
            No certificate matches this verification code. Please check the code and try again.
          </p>
        )}
      </div>
    </div>
  );
}
