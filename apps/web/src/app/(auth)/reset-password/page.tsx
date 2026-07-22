'use client';

import { useState, type FormEvent, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { resetPassword, ApiClientError } from '@/lib/api-client';
import styles from '../auth.module.css';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!token) {
    return (
      <div className={styles.form} style={{ textAlign: 'center' }}>
        <div className={styles.alertError}>
          Invalid or missing reset token. Please request a new password reset link.
        </div>
        <Link
          href="/forgot-password"
          className={styles.submitButton}
          style={{
            display: 'inline-block',
            width: '100%',
            textDecoration: 'none',
            boxSizing: 'border-box',
          }}
        >
          Request New Link
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!password || !confirmPassword || !token) return;

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setError(null);
    setIsPending(true);

    try {
      await resetPassword({ token, password, confirmPassword });
      setIsSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsPending(false);
    }
  }

  if (isSuccess) {
    return (
      <div className={styles.form} style={{ textAlign: 'center' }}>
        <div
          style={{
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            color: '#86efac',
            padding: '1.5rem',
            borderRadius: '0.75rem',
            marginBottom: '1rem',
          }}
        >
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Password Reset Successful
          </h3>
          <p style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>
            Your password has been successfully reset. You will be redirected to the login page
            shortly.
          </p>
        </div>
        <Link
          href="/login"
          className={styles.submitButton}
          style={{
            display: 'inline-block',
            width: '100%',
            textDecoration: 'none',
            boxSizing: 'border-box',
          }}
        >
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className={styles.form}>
      {error && <div className={styles.alertError}>{error}</div>}

      <div className={styles.inputGroup}>
        <label htmlFor="password" className={styles.label}>
          New Password
        </label>
        <div className={styles.inputWrapper}>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
          />
        </div>
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="confirmPassword" className={styles.label}>
          Confirm New Password
        </label>
        <div className={styles.inputWrapper}>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={styles.input}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending || !password || !confirmPassword}
        className={styles.submitButton}
      >
        {isPending ? 'Resetting...' : 'Reset Password'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className={styles.container}>
      <div className={styles.background}></div>
      <div className={styles.glassCard}>
        <div className={styles.header}>
          <h1 className={styles.title}>Create New Password</h1>
          <p className={styles.subtitle}>Please enter your new password below.</p>
        </div>

        <Suspense
          fallback={<div style={{ textAlign: 'center', color: '#94a3b8' }}>Loading...</div>}
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
