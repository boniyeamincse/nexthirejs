'use client';

import { useState, useCallback, type FormEvent, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { candidateLoginSchema } from '@nexthire/validation';
import { ApiClientError } from '@/lib/api-client';
import { useAuth } from '@/providers/auth-context';
import styles from '../auth.module.css';

interface FieldErrors {
  email?: string;
  password?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<ReactNode>(null);
  const [isPending, setIsPending] = useState(false);

  const validateField = useCallback(
    (field: string, value: string) => {
      const data = {
        email: field === 'email' ? value : email,
        password: field === 'password' ? value : password,
      };

      const result = candidateLoginSchema.safeParse(data);
      if (!result.success) {
        const err = result.error.flatten().fieldErrors;
        setFieldErrors((prev) => ({
          ...prev,
          [field]: err[field as keyof typeof err]?.[0],
        }));
      } else {
        setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [email, password],
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setServerError(null);

    const data = { email: email.trim(), password };
    const result = candidateLoginSchema.safeParse(data);

    if (!result.success) {
      const err = result.error.flatten().fieldErrors;
      setFieldErrors({
        email: err.email?.[0],
        password: err.password?.[0],
      });
      return;
    }

    setFieldErrors({});
    setIsPending(true);

    try {
      await login(data);
      router.push('/app');
    } catch (error) {
      if (error instanceof ApiClientError) {
        const msg = error.message;
        if (error.statusCode === 401) {
          setServerError('Invalid email or password. Please try again.');
        } else if (error.statusCode === 403 && msg === 'AUTH_EMAIL_NOT_VERIFIED') {
          setServerError(
            <>
              Please verify your email address before logging in.{' '}
              <Link
                href={`/verify-email/error?email=${encodeURIComponent(email)}`}
                className={styles.link}
              >
                Resend verification email
              </Link>
            </>,
          );
        } else if (error.statusCode === 403 && msg === 'AUTH_ACCOUNT_UNAVAILABLE') {
          setServerError('This account is not available. Please contact support.');
        } else if (error.statusCode === 429) {
          setServerError('Too many login attempts. Please wait a minute and try again.');
        } else {
          setServerError('Login service is currently unavailable. Please try again later.');
        }
      } else {
        setServerError('Unable to connect to the login service. Please try again later.');
      }
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.background}></div>
      <div className={styles.glassCard}>
        <div className={styles.header}>
          <h1 className={styles.title}>Welcome Back</h1>
          <p className={styles.subtitle}>
            Sign in to your NextHire account to continue your journey.
          </p>
        </div>

        {serverError && (
          <div className={styles.alertError} role="alert">
            {serverError}
          </div>
        )}

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
                onChange={(e) => {
                  setEmail(e.target.value);
                  validateField('email', e.target.value);
                }}
                aria-invalid={!!fieldErrors.email}
                className={`${styles.input} ${fieldErrors.email ? styles.inputError : ''}`}
                placeholder="you@example.com"
              />
            </div>
            {fieldErrors.email && (
              <p className={styles.errorMessage} role="alert">
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>

            <div className={styles.inputWrapper}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  validateField('password', e.target.value);
                }}
                aria-invalid={!!fieldErrors.password}
                className={`${styles.input} ${fieldErrors.password ? styles.inputError : ''}`}
                placeholder="Enter your password"
                style={{ paddingRight: '3rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={styles.passwordToggle}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {fieldErrors.password && (
              <p className={styles.errorMessage} role="alert">
                {fieldErrors.password}
              </p>
            )}
          </div>

          <button type="submit" disabled={isPending} className={styles.submitButton}>
            {isPending ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className={styles.footer}>
          Don't have an account?{' '}
          <Link href="/register" className={styles.link}>
            Create one
          </Link>
        </div>
      </div>
    </div>
  );
}
