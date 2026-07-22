'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-context';
import {
  listMyDataExports,
  requestMyDataExport,
  getMyDataExportDownload,
  deactivateMyAccount,
  ApiClientError,
} from '@/lib/api-client';
import type { DataExportStatusResult } from '@/lib/api-client';
import styles from '../../(auth)/auth.module.css';

type ExportStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED' | 'EXPIRED';

const STATUS_LABELS: Record<ExportStatus, string> = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  READY: 'Ready',
  FAILED: 'Failed',
  EXPIRED: 'Expired',
};

const STATUS_COLORS: Record<ExportStatus, { bg: string; text: string }> = {
  PENDING: { bg: 'rgba(234, 179, 8, 0.15)', text: '#eab308' },
  PROCESSING: { bg: 'rgba(99, 102, 241, 0.15)', text: '#818cf8' },
  READY: { bg: 'rgba(34, 197, 94, 0.15)', text: '#22c55e' },
  FAILED: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444' },
  EXPIRED: { bg: 'rgba(100, 116, 139, 0.15)', text: '#64748b' },
};

export default function AccountSettingsPage() {
  const { getAccessToken, logout, status: authStatus } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const [exports, setExports] = useState<DataExportStatusResult[]>([]);
  const [requesting, setRequesting] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);

  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const [deactivationPassword, setDeactivationPassword] = useState('');
  const [deactivationConfirmation, setDeactivationConfirmation] = useState('');
  const [deactivationError, setDeactivationError] = useState<string | null>(null);
  const [deactivating, setDeactivating] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const hasActiveExport = exports.some((e) => e.status === 'PENDING' || e.status === 'PROCESSING');

  const fetchExports = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    try {
      const data = await listMyDataExports(token);
      setExports(data);
    } catch (err) {
      if (err instanceof ApiClientError && err.statusCode === 401) {
        await logout();
        router.push('/login');
        return;
      }
      setPageError('Failed to load data exports. Please try again later.');
    }
  }, [getAccessToken, logout, router]);

  useEffect(() => {
    if (authStatus === 'authenticated') {
      setLoading(false);
      void fetchExports();
    } else if (authStatus === 'unauthenticated') {
      setLoading(false);
    }
  }, [authStatus, fetchExports]);

  async function handleRequestExport() {
    setRequestError(null);
    setRequestSuccess(null);
    const token = getAccessToken();
    if (!token) {
      await logout();
      router.push('/login');
      return;
    }
    setRequesting(true);
    try {
      await requestMyDataExport(token);
      setRequestSuccess('Data export requested. Your export will be ready shortly.');
      void fetchExports();
    } catch (err) {
      if (err instanceof ApiClientError && err.statusCode === 401) {
        await logout();
        router.push('/login');
        return;
      }
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      if (
        message.includes('429') ||
        message.includes('rate limit') ||
        message.includes('too many requests')
      ) {
        setRequestError('You have reached the rate limit. Please wait before requesting again.');
      } else if (
        message.includes('409') ||
        message.includes('already') ||
        message.includes('Conflict')
      ) {
        setRequestError('An export is already in progress.');
      } else {
        setRequestError(message);
      }
    } finally {
      setRequesting(false);
    }
  }

  async function handleDownload(exportId: string) {
    setDownloadError(null);
    setDownloadingId(exportId);
    const token = getAccessToken();
    if (!token) {
      await logout();
      router.push('/login');
      return;
    }
    try {
      const result = await getMyDataExportDownload(token, exportId);
      window.open(result.downloadUrl, '_blank');
    } catch (err) {
      if (err instanceof ApiClientError && err.statusCode === 401) {
        await logout();
        router.push('/login');
        return;
      }
      setDownloadError(err instanceof Error ? err.message : 'Failed to download export.');
    } finally {
      setDownloadingId(null);
    }
  }

  function handleDeactivationSubmit(e: React.FormEvent) {
    e.preventDefault();
    setDeactivationError(null);

    if (deactivationConfirmation !== 'DEACTIVATE') {
      setDeactivationError('Please type DEACTIVATE to confirm.');
      return;
    }

    if (!deactivationPassword) {
      setDeactivationError('Please enter your current password.');
      return;
    }

    setShowConfirmModal(true);
  }

  async function confirmDeactivation() {
    setShowConfirmModal(false);
    setDeactivationError(null);
    const token = getAccessToken();
    if (!token) {
      await logout();
      router.push('/login');
      return;
    }
    setDeactivating(true);
    try {
      await deactivateMyAccount(token, {
        currentPassword: deactivationPassword,
        confirmation: deactivationConfirmation,
      });
      await logout();
      router.push('/login?deactivated=true');
    } catch (err) {
      if (err instanceof ApiClientError && err.statusCode === 401) {
        await logout();
        router.push('/login');
        return;
      }
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      if (
        message.includes('429') ||
        message.includes('rate limit') ||
        message.includes('too many requests')
      ) {
        setDeactivationError('Too many attempts. Please wait a moment before trying again.');
      } else if (
        message.includes('password') ||
        message.includes('Current password is incorrect') ||
        message.includes('wrong password')
      ) {
        setDeactivationError('Current password is incorrect.');
      } else {
        setDeactivationError(message);
      }
    } finally {
      setDeactivating(false);
    }
  }

  if (authStatus === 'unknown' || (authStatus === 'loading' && loading)) {
    return (
      <div className={styles.container}>
        <div className={styles.background}></div>
        <div className={styles.glassCard} style={{ textAlign: 'center', padding: '4rem' }}>
          <p className={styles.subtitle}>Loading...</p>
        </div>
      </div>
    );
  }

  if (authStatus === 'unauthenticated') {
    return (
      <div className={styles.container}>
        <div className={styles.background}></div>
        <div className={styles.glassCard} style={{ textAlign: 'center', padding: '4rem' }}>
          <p className={styles.subtitle}>Session expired. Please log in again.</p>
          <button
            onClick={() => router.push('/login')}
            className={styles.submitButton}
            style={{ marginTop: '1rem' }}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={styles.container}
      style={{ minHeight: 'calc(100vh - 72px)', padding: '2rem 1rem' }}
    >
      <div className={styles.background}></div>
      <div className={styles.glassCard} style={{ maxWidth: '700px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 className={styles.title} style={{ fontSize: '1.75rem', margin: 0 }}>
            Account Settings
          </h1>
          <p className={styles.subtitle} style={{ marginTop: '0.5rem' }}>
            Manage your data export requests and account lifecycle.
          </p>
        </div>

        {pageError && (
          <div
            role="alert"
            style={{
              padding: '0.75rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem',
              fontSize: '0.85rem',
              color: '#ef4444',
            }}
          >
            {pageError}
            <button
              onClick={fetchExports}
              style={{
                marginLeft: '0.5rem',
                background: 'none',
                border: 'none',
                color: '#ef4444',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontSize: '0.85rem',
              }}
            >
              Retry
            </button>
          </div>
        )}

        <section style={{ marginBottom: '2.5rem' }}>
          <h2
            className={styles.subtitle}
            style={{
              fontSize: '1.1rem',
              fontWeight: 600,
              color: '#e2e8f0',
              marginBottom: '0.75rem',
            }}
          >
            Data Export
          </h2>
          <p
            style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: 1.5 }}
          >
            Download a copy of your profile data, including your personal information, work
            experience, education, skills, and other sections you have added. Exports are available
            for a limited time after they are generated.
          </p>

          {requestError && (
            <div role="alert" className={styles.alertError} style={{ marginBottom: '1rem' }}>
              {requestError}
            </div>
          )}

          {requestSuccess && (
            <div
              role="alert"
              style={{
                padding: '0.75rem',
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '0.5rem',
                marginBottom: '1rem',
                fontSize: '0.85rem',
                color: '#22c55e',
              }}
            >
              {requestSuccess}
            </div>
          )}

          {downloadError && (
            <div role="alert" className={styles.alertError} style={{ marginBottom: '1rem' }}>
              {downloadError}
            </div>
          )}

          <button
            onClick={handleRequestExport}
            disabled={requesting || hasActiveExport}
            aria-disabled={requesting || hasActiveExport}
            className={styles.submitButton}
            style={{ marginTop: 0 }}
          >
            {requesting
              ? 'Requesting...'
              : hasActiveExport
                ? 'Export in Progress'
                : 'Request Export'}
          </button>

          {exports.length > 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              <h3
                style={{
                  color: '#e2e8f0',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  marginBottom: '0.75rem',
                }}
              >
                Recent Exports
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {exports.map((exp) => {
                  const status = exp.status as ExportStatus;
                  const colors = STATUS_COLORS[status] || STATUS_COLORS.FAILED;
                  return (
                    <div
                      key={exp.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '0.5rem',
                        fontSize: '0.85rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span
                          style={{
                            padding: '0.2rem 0.6rem',
                            borderRadius: '0.375rem',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            background: colors.bg,
                            color: colors.text,
                          }}
                        >
                          {STATUS_LABELS[status] || exp.status}
                        </span>
                        <span style={{ color: '#94a3b8' }}>
                          {new Date(exp.requestedAt).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        {status === 'READY' && (
                          <button
                            onClick={() => handleDownload(exp.id)}
                            disabled={downloadingId === exp.id}
                            aria-disabled={downloadingId === exp.id}
                            style={{
                              background: 'rgba(99, 102, 241, 0.15)',
                              color: '#818cf8',
                              border: '1px solid rgba(99, 102, 241, 0.3)',
                              borderRadius: '0.375rem',
                              padding: '0.35rem 0.75rem',
                              fontSize: '0.8rem',
                              cursor: downloadingId === exp.id ? 'not-allowed' : 'pointer',
                            }}
                          >
                            {downloadingId === exp.id ? 'Downloading...' : 'Download'}
                          </button>
                        )}
                        {status === 'PENDING' && (
                          <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                            Processing...
                          </span>
                        )}
                        {status === 'PROCESSING' && (
                          <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                            Processing...
                          </span>
                        )}
                        {status === 'FAILED' && (
                          <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>Failed</span>
                        )}
                        {status === 'EXPIRED' && (
                          <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Expired</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        <section
          role="alert"
          style={{
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            background: 'rgba(239, 68, 68, 0.05)',
          }}
        >
          <h2
            style={{
              fontSize: '1.1rem',
              fontWeight: 600,
              color: '#ef4444',
              marginBottom: '0.75rem',
              marginTop: 0,
            }}
          >
            Danger Zone: Deactivate Account
          </h2>
          <p
            style={{ color: '#fca5a5', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: 1.5 }}
          >
            Once you deactivate your account, you will not be able to log in. Your profile will be
            hidden from recruiters, but your data will be retained in case you choose to reactivate
            later.
          </p>

          {deactivationError && (
            <div role="alert" className={styles.alertError} style={{ marginBottom: '1rem' }}>
              {deactivationError}
            </div>
          )}

          <form onSubmit={handleDeactivationSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="deactivationPassword" className={styles.label}>
                Current Password
              </label>
              <input
                id="deactivationPassword"
                type="password"
                value={deactivationPassword}
                onChange={(e) => {
                  setDeactivationPassword(e.target.value);
                  setDeactivationError(null);
                }}
                className={styles.input}
                autoComplete="current-password"
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="deactivationConfirmation" className={styles.label}>
                Type <strong>DEACTIVATE</strong> to confirm
              </label>
              <input
                id="deactivationConfirmation"
                type="text"
                value={deactivationConfirmation}
                onChange={(e) => {
                  setDeactivationConfirmation(e.target.value);
                  setDeactivationError(null);
                }}
                className={styles.input}
                autoComplete="off"
              />
            </div>

            <button
              type="submit"
              disabled={deactivating}
              aria-disabled={deactivating}
              style={{
                marginTop: '0.5rem',
                background: 'rgba(239, 68, 68, 0.85)',
                color: 'white',
                border: 'none',
                padding: '0.875rem',
                borderRadius: '0.75rem',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: deactivating ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                opacity: deactivating ? 0.7 : 1,
              }}
            >
              {deactivating ? 'Deactivating...' : 'Deactivate Account'}
            </button>
          </form>
        </section>
      </div>

      {showConfirmModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setShowConfirmModal(false)}
        >
          <div
            role="alertdialog"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-desc"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'rgba(30, 41, 59, 1)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '1rem',
              padding: '2rem',
              maxWidth: '440px',
              width: '90%',
            }}
          >
            <h3
              id="confirm-title"
              style={{ color: '#ef4444', fontSize: '1.15rem', margin: '0 0 0.75rem' }}
            >
              Confirm Deactivation
            </h3>
            <p
              id="confirm-desc"
              style={{
                color: '#94a3b8',
                fontSize: '0.9rem',
                lineHeight: 1.5,
                margin: '0 0 1.5rem',
              }}
            >
              Are you sure you want to deactivate your account? You will be signed out immediately
              and will not be able to log in again.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowConfirmModal(false)}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  color: '#e2e8f0',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '0.5rem',
                  padding: '0.6rem 1.25rem',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeactivation}
                disabled={deactivating}
                style={{
                  background: 'rgba(239, 68, 68, 0.85)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.6rem 1.25rem',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: deactivating ? 'not-allowed' : 'pointer',
                  opacity: deactivating ? 0.7 : 1,
                }}
              >
                {deactivating ? 'Deactivating...' : 'Yes, Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
