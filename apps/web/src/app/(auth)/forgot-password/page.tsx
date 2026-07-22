'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import styles from '../auth.module.css';
import { requestPasswordReset } from '@/lib/api-client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setIsPending(true);

    try {
      await requestPasswordReset({ email });
      setIsSuccess(true);
    } catch (error) {
      // Even on error (e.g. rate limit), we might want to just show success for security,
      // but if the API fails entirely (500), we should probably let them know.
      // For now, always show success to prevent email enumeration.
      setIsSuccess(true);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.background}></div>
      <div style={{ maxWidth: '400px', margin: '4rem auto', padding: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#f1f5f9' }}>Forgot Password</h1>
        <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>
      
        {isSuccess ? (
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
                Check your email
              </h3>
              <p style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>
                If an account exists for <strong>{email}</strong>, we have sent a password reset
                link.
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
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="email" className={styles.label}>
                Email address
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.input}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending || !email.trim()}
              className={styles.submitButton}
            >
              {isPending ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        {!isSuccess && (
          <div className={styles.footer}>
            Remember your password?{' '}
            <Link href="/login" className={styles.link}>
              Log in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
