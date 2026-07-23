'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-context';
import { listMyCvs, deleteCv, setDefaultCv, duplicateCv, ApiClientError } from '@/lib/api-client';
import type { CvResult } from '@/lib/api-client';

const pageStyle: React.CSSProperties = {
  maxWidth: '56rem',
  margin: '0 auto',
  padding: '2rem 1.5rem',
};

const headerRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1.5rem',
  flexWrap: 'wrap',
  gap: '1rem',
};

const primaryButtonStyle: React.CSSProperties = {
  padding: '0.6rem 1.2rem',
  background: 'rgba(99, 102, 241, 0.85)',
  color: '#fff',
  border: 'none',
  borderRadius: '0.5rem',
  fontWeight: 600,
  cursor: 'pointer',
  fontSize: '0.9rem',
  textDecoration: 'none',
  display: 'inline-block',
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: '0.45rem 0.9rem',
  background: 'rgba(255,255,255,0.06)',
  color: '#e2e8f0',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: '0.5rem',
  fontWeight: 500,
  cursor: 'pointer',
  fontSize: '0.82rem',
};

const dangerButtonStyle: React.CSSProperties = {
  ...secondaryButtonStyle,
  color: '#f87171',
  border: '1px solid rgba(248, 113, 113, 0.35)',
};

const cardStyle: React.CSSProperties = {
  padding: '1.1rem 1.25rem',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '0.75rem',
  marginBottom: '0.9rem',
};

export default function CvDashboardPage() {
  const { getAccessToken, logout, status: authStatus } = useAuth();
  const router = useRouter();

  const [cvs, setCvs] = useState<CvResult[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }
    setPageError(null);
    try {
      const data = await listMyCvs(token);
      setCvs(data);
    } catch (err) {
      if (err instanceof ApiClientError && err.statusCode === 401) {
        await logout();
        router.push('/login');
        return;
      }
      setPageError('Your CVs are temporarily unavailable. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, logout, router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSetDefault(cvId: string) {
    const token = getAccessToken();
    if (!token) return;
    setActionError(null);
    setBusyId(cvId);
    try {
      await setDefaultCv(token, cvId);
      await load();
    } catch {
      setActionError('Unable to set this CV as default. Please try again.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleDuplicate(cvId: string, title: string) {
    const token = getAccessToken();
    if (!token) return;
    setActionError(null);
    setBusyId(cvId);
    try {
      await duplicateCv(token, cvId, `${title} - Copy`);
      await load();
    } catch {
      setActionError('Unable to duplicate this CV. Please try again.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(cvId: string) {
    const token = getAccessToken();
    if (!token) return;
    setActionError(null);
    setBusyId(cvId);
    try {
      await deleteCv(token, cvId);
      await load();
    } catch (err) {
      if (err instanceof ApiClientError && err.statusCode === 400) {
        setActionError('Cannot delete your default CV. Set another CV as default first.');
      } else {
        setActionError('Unable to delete this CV. Please try again.');
      }
    } finally {
      setBusyId(null);
    }
  }

  if (authStatus === 'unknown' || authStatus === 'loading' || loading) {
    return (
      <div style={pageStyle} aria-busy="true" aria-live="polite">
        <p style={{ color: '#94a3b8' }}>Loading your CVs…</p>
      </div>
    );
  }

  if (authStatus === 'unauthenticated') {
    return (
      <div style={pageStyle}>
        <p style={{ color: '#94a3b8' }}>Session expired. Please log in again.</p>
      </div>
    );
  }

  if (pageError) {
    return (
      <div style={pageStyle}>
        <div role="alert" style={{ color: '#fca5a5', marginBottom: '1rem' }}>
          {pageError}
        </div>
        <button type="button" style={secondaryButtonStyle} onClick={() => void load()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={headerRowStyle}>
        <div>
          <h1 style={{ color: '#e2e8f0', fontSize: '1.5rem', fontWeight: 700 }}>My CVs</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Build tailored CVs from your profile and export them as PDF.
          </p>
        </div>
        <Link href="/cv/new" style={primaryButtonStyle}>
          + New CV
        </Link>
      </div>

      {actionError && (
        <div
          role="alert"
          style={{
            color: '#fca5a5',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '0.5rem',
            padding: '0.65rem 0.85rem',
            marginBottom: '1rem',
            fontSize: '0.88rem',
          }}
        >
          {actionError}
        </div>
      )}

      {cvs && cvs.length === 0 && (
        <div
          style={{
            ...cardStyle,
            textAlign: 'center',
            padding: '2.5rem 1rem',
          }}
        >
          <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>
            You haven&apos;t created a CV yet.
          </p>
          <Link href="/cv/new" style={primaryButtonStyle}>
            Create your first CV
          </Link>
        </div>
      )}

      {cvs?.map((cv) => (
        <div key={cv.id} style={cardStyle}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Link
                  href={`/cv/${cv.id}`}
                  style={{
                    color: '#e2e8f0',
                    fontSize: '1.05rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  {cv.title}
                </Link>
                {cv.isDefault && (
                  <span
                    style={{
                      padding: '0.15rem 0.5rem',
                      borderRadius: '0.3rem',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      background: 'rgba(99, 102, 241, 0.2)',
                      color: '#a5b4fc',
                    }}
                  >
                    Default
                  </span>
                )}
              </div>
              <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.3rem' }}>
                {cv.template.replace('_', ' ')} · {cv.visibility} · {cv.completionScore}% complete
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <Link href={`/cv/${cv.id}`} style={secondaryButtonStyle}>
                Edit
              </Link>
              {!cv.isDefault && (
                <button
                  type="button"
                  style={secondaryButtonStyle}
                  disabled={busyId === cv.id}
                  onClick={() => void handleSetDefault(cv.id)}
                >
                  Set default
                </button>
              )}
              <button
                type="button"
                style={secondaryButtonStyle}
                disabled={busyId === cv.id}
                onClick={() => void handleDuplicate(cv.id, cv.title)}
              >
                Duplicate
              </button>
              {!cv.isDefault && (
                <button
                  type="button"
                  style={dangerButtonStyle}
                  disabled={busyId === cv.id}
                  onClick={() => void handleDelete(cv.id)}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
