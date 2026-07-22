'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-context';
import { getMyAccountSecuritySummary, changePassword, ApiClientError } from '@/lib/api-client';
import type { CandidateAccountSecuritySummary } from '@/lib/api-client';
import styles from '@/app/(auth)/auth.module.css';

export default function AccountSecurityPage() {
  const { getAccessToken, logout, status: authStatus } = useAuth();
  const router = useRouter();

  const [summary, setSummary] = useState<CandidateAccountSecuritySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [revokedCount, setRevokedCount] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchSummary = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setTimeout(() => setLoading(false), 0);
      return;
    }

    setTimeout(() => setLoading(true), 0);
    setPageError(null);

    try {
      const data = await getMyAccountSecuritySummary(token);
      setSummary(data);
    } catch (err) {
      if (err instanceof ApiClientError && err.statusCode === 401) {
        await logout();
        router.push('/login');
        return;
      }
      setPageError(
        'Account security information is temporarily unavailable. Please try again later.',
      );
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, logout, router]);

  useEffect(() => {
    void fetchSummary();
  }, [fetchSummary]);

  function validateForm(): boolean {
    const errors: Record<string, string> = {};

    if (!currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    if (!newPassword) {
      errors.newPassword = 'New password is required';
    } else if (newPassword.length < 10) {
      errors.newPassword = 'Password must be at least 10 characters';
    } else if (!/[A-Z]/.test(newPassword)) {
      errors.newPassword = 'Password must contain at least one uppercase letter';
    } else if (!/[a-z]/.test(newPassword)) {
      errors.newPassword = 'Password must contain at least one lowercase letter';
    } else if (!/[0-9]/.test(newPassword)) {
      errors.newPassword = 'Password must contain at least one number';
    } else if (!/[^a-zA-Z0-9]/.test(newPassword)) {
      errors.newPassword = 'Password must contain at least one special character';
    }

    if (!confirmNewPassword) {
      errors.confirmNewPassword = 'Please confirm your new password';
    } else if (newPassword && confirmNewPassword !== newPassword) {
      errors.confirmNewPassword = 'New password and confirmation do not match';
    }

    if (currentPassword && newPassword && currentPassword === newPassword) {
      errors.newPassword = 'New password must be different from your current password';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setRevokedCount(null);

    if (!validateForm()) return;

    const token = getAccessToken();
    if (!token) {
      await logout();
      router.push('/login');
      return;
    }

    setSaving(true);

    try {
      const result = await changePassword(token, {
        currentPassword,
        newPassword,
        confirmNewPassword,
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setFormSuccess('Password changed successfully');
      setRevokedCount(result.revokedOtherSessionCount);
      setFieldErrors({});

      void fetchSummary();
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
        setFormError('Too many attempts. Please wait a moment before trying again.');
      } else if (
        message.includes('current password') ||
        message.includes('Current password is incorrect') ||
        message.includes('wrong password')
      ) {
        setFormError('Current password is incorrect.');
      } else if (
        message.includes('reused') ||
        message.includes('previously used') ||
        message.includes('already been used')
      ) {
        setFormError('This password has been used before. Please choose a different one.');
      } else {
        setFormError(message);
      }
    } finally {
      setSaving(false);
    }
  }

  if (authStatus === 'loading' || loading) {
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
            Account Security
          </h1>
          <p className={styles.subtitle} style={{ marginTop: '0.5rem' }}>
            Manage your password and review your account security status.
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
              onClick={fetchSummary}
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

        {summary && (
          <>
            <section style={{ marginBottom: '2rem' }}>
              <h2
                className={styles.subtitle}
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  color: '#e2e8f0',
                  marginBottom: '1rem',
                }}
              >
                Account Overview
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '0.5rem',
                  }}
                >
                  <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Email</span>
                  <span style={{ color: '#e2e8f0', fontSize: '0.9rem' }}>{summary.email}</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '0.5rem',
                  }}
                >
                  <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Account Status</span>
                  <span
                    style={{
                      padding: '0.2rem 0.6rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      background: 'rgba(34, 197, 94, 0.15)',
                      color: '#22c55e',
                    }}
                  >
                    {summary.accountStatus}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '0.5rem',
                  }}
                >
                  <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Email Verified</span>
                  <span
                    style={{
                      padding: '0.2rem 0.6rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      background: summary.emailVerified
                        ? 'rgba(34, 197, 94, 0.15)'
                        : 'rgba(239, 68, 68, 0.15)',
                      color: summary.emailVerified ? '#22c55e' : '#ef4444',
                    }}
                  >
                    {summary.emailVerified ? 'Verified' : 'Not Verified'}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '0.5rem',
                  }}
                >
                  <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Active Sessions</span>
                  <Link
                    href={summary.securityLinks.sessions}
                    style={{ color: '#818cf8', fontSize: '0.9rem', textDecoration: 'none' }}
                  >
                    {summary.activeSessionCount}{' '}
                    {summary.activeSessionCount === 1 ? 'session' : 'sessions'}
                  </Link>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '0.5rem',
                  }}
                >
                  <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                    Current Session Started
                  </span>
                  <span style={{ color: '#e2e8f0', fontSize: '0.9rem' }}>
                    {new Date(summary.currentSessionCreatedAt).toLocaleString()}
                  </span>
                </div>
                {summary.currentSessionLastUsedAt && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem',
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: '0.5rem',
                    }}
                  >
                    <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                      Current Session Last Used
                    </span>
                    <span style={{ color: '#e2e8f0', fontSize: '0.9rem' }}>
                      {new Date(summary.currentSessionLastUsedAt).toLocaleString()}
                    </span>
                  </div>
                )}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '0.5rem',
                  }}
                >
                  <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                    Password Last Changed
                  </span>
                  <span style={{ color: '#e2e8f0', fontSize: '0.9rem' }}>
                    {summary.passwordLastChangedAt
                      ? new Date(summary.passwordLastChangedAt).toLocaleDateString()
                      : 'Not available'}
                  </span>
                </div>
              </div>
            </section>

            <section
              style={{
                marginBottom: '2rem',
                padding: '1rem',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '0.5rem',
              }}
            >
              <h2
                className={styles.subtitle}
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  color: '#e2e8f0',
                  marginBottom: '0.75rem',
                }}
              >
                Quick Links
              </h2>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <Link
                  href={summary.securityLinks.sessions}
                  style={{
                    color: '#818cf8',
                    fontSize: '0.9rem',
                    textDecoration: 'none',
                    padding: '0.5rem 1rem',
                    background: 'rgba(99, 102, 241, 0.1)',
                    borderRadius: '0.5rem',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                  }}
                >
                  Manage Sessions
                </Link>
                <Link
                  href={summary.securityLinks.privacy}
                  style={{
                    color: '#818cf8',
                    fontSize: '0.9rem',
                    textDecoration: 'none',
                    padding: '0.5rem 1rem',
                    background: 'rgba(99, 102, 241, 0.1)',
                    borderRadius: '0.5rem',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                  }}
                >
                  Privacy Settings
                </Link>
              </div>
            </section>

            <section>
              <h2
                className={styles.subtitle}
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  color: '#e2e8f0',
                  marginBottom: '1rem',
                }}
              >
                Change Password
              </h2>

              {formError && (
                <div role="alert" className={styles.alertError} style={{ marginBottom: '1rem' }}>
                  {formError}
                </div>
              )}

              {formSuccess && (
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
                  {formSuccess}
                  {revokedCount !== null && revokedCount > 0 && (
                    <span>
                      {' '}
                      &mdash; {revokedCount} other{' '}
                      {revokedCount === 1 ? 'session was' : 'sessions were'} signed out.
                    </span>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.inputGroup}>
                  <label htmlFor="currentPassword" className={styles.label}>
                    Current Password
                  </label>
                  <div className={styles.inputWrapper}>
                    <input
                      id="currentPassword"
                      type={showCurrent ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => {
                        setCurrentPassword(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, currentPassword: '' }));
                      }}
                      className={`${styles.input} ${fieldErrors.currentPassword ? styles.inputError : ''}`}
                      aria-invalid={!!fieldErrors.currentPassword}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className={styles.passwordToggle}
                      onClick={() => setShowCurrent((v) => !v)}
                      aria-label={showCurrent ? 'Hide current password' : 'Show current password'}
                    >
                      {showCurrent ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {fieldErrors.currentPassword && (
                    <p className={styles.errorMessage} role="alert">
                      {fieldErrors.currentPassword}
                    </p>
                  )}
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="newPassword" className={styles.label}>
                    New Password
                  </label>
                  <div className={styles.inputWrapper}>
                    <input
                      id="newPassword"
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, newPassword: '' }));
                      }}
                      className={`${styles.input} ${fieldErrors.newPassword ? styles.inputError : ''}`}
                      aria-invalid={!!fieldErrors.newPassword}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className={styles.passwordToggle}
                      onClick={() => setShowNew((v) => !v)}
                      aria-label={showNew ? 'Hide new password' : 'Show new password'}
                    >
                      {showNew ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {fieldErrors.newPassword && (
                    <p className={styles.errorMessage} role="alert">
                      {fieldErrors.newPassword}
                    </p>
                  )}
                  <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                    Must be at least 10 characters with uppercase, lowercase, number, and special
                    character.
                  </p>
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="confirmNewPassword" className={styles.label}>
                    Confirm New Password
                  </label>
                  <div className={styles.inputWrapper}>
                    <input
                      id="confirmNewPassword"
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmNewPassword}
                      onChange={(e) => {
                        setConfirmNewPassword(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, confirmNewPassword: '' }));
                      }}
                      className={`${styles.input} ${fieldErrors.confirmNewPassword ? styles.inputError : ''}`}
                      aria-invalid={!!fieldErrors.confirmNewPassword}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className={styles.passwordToggle}
                      onClick={() => setShowConfirm((v) => !v)}
                      aria-label={showConfirm ? 'Hide confirmation' : 'Show confirmation'}
                    >
                      {showConfirm ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {fieldErrors.confirmNewPassword && (
                    <p className={styles.errorMessage} role="alert">
                      {fieldErrors.confirmNewPassword}
                    </p>
                  )}
                </div>

                <button type="submit" disabled={saving} className={styles.submitButton}>
                  {saving ? 'Saving...' : 'Change Password'}
                </button>
              </form>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
