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

interface MfaChallengeState {
  challengeToken: string;
  expiresAt: string;
  allowedMethods: ('TOTP' | 'RECOVERY_CODE')[];
}

export default function LoginPage() {
  const router = useRouter();
  const { login, completeMfaChallenge } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<ReactNode>(null);
  const [isPending, setIsPending] = useState(false);
  const [mfaChallenge, setMfaChallenge] = useState<MfaChallengeState | null>(null);
  const [mfaMethod, setMfaMethod] = useState<'TOTP' | 'RECOVERY_CODE'>('TOTP');
  const [mfaCode, setMfaCode] = useState('');
  const [trustDevice, setTrustDevice] = useState(false);
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [mfaPending, setMfaPending] = useState(false);

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
      const outcome = await login(data);
      if (outcome.mfaRequired) {
        setMfaChallenge({
          challengeToken: outcome.challengeToken,
          expiresAt: outcome.expiresAt,
          allowedMethods: outcome.allowedMethods,
        });
        setMfaMethod('TOTP');
        setMfaCode('');
        setMfaError(null);
        return;
      }
      router.push('/dashboard');
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

  async function handleMfaSubmit(e: FormEvent) {
    e.preventDefault();
    if (!mfaChallenge) {
      return;
    }
    setMfaError(null);

    const trimmed = mfaCode.trim();
    if (mfaMethod === 'TOTP' && !/^[0-9]{6}$/.test(trimmed)) {
      setMfaError('Enter the 6-digit code from your authenticator app.');
      return;
    }
    if (mfaMethod === 'RECOVERY_CODE' && trimmed.replace(/[\s-]/g, '').length !== 12) {
      setMfaError('Recovery codes are 12 letters and numbers.');
      return;
    }

    setMfaPending(true);
    try {
      await completeMfaChallenge({
        challengeToken: mfaChallenge.challengeToken,
        method: mfaMethod,
        code: trimmed,
        trustDevice: trustDevice || undefined,
      });
      router.push('/dashboard');
    } catch (error) {
      if (error instanceof ApiClientError) {
        const msg = error.message;
        if (msg === 'MFA_CHALLENGE_EXPIRED') {
          setServerError('This verification session has expired. Please sign in again.');
          setMfaChallenge(null);
        } else if (msg === 'MFA_CHALLENGE_ATTEMPTS_EXCEEDED') {
          setServerError('Too many incorrect codes. Please sign in again.');
          setMfaChallenge(null);
        } else if (msg === 'MFA_CHALLENGE_CONSUMED' || msg === 'MFA_CHALLENGE_INVALID') {
          setServerError('This verification session is no longer valid. Please sign in again.');
          setMfaChallenge(null);
        } else if (error.statusCode === 429) {
          setMfaError('Too many attempts. Please wait a minute and try again.');
        } else {
          setMfaError(
            mfaMethod === 'TOTP'
              ? 'That code is incorrect. Please try again.'
              : 'That recovery code is incorrect or already used.',
          );
        }
      } else {
        setMfaError('Unable to verify the code right now. Please try again.');
      }
    } finally {
      setMfaPending(false);
    }
  }

  if (mfaChallenge) {
    return (
      <div className={styles.container}>
        <div className={styles.background}></div>
        <div className={styles.glassCard}>
          <div className={styles.header}>
            <h1 className={styles.title}>Two-Factor Verification</h1>
            <p className={styles.subtitle}>
              {mfaMethod === 'TOTP'
                ? 'Enter the 6-digit code from your authenticator app.'
                : 'Enter one of your saved recovery codes.'}
            </p>
          </div>

          {mfaError && (
            <div className={styles.alertError} role="alert">
              {mfaError}
            </div>
          )}

          <form onSubmit={handleMfaSubmit} noValidate className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="mfa-code" className={styles.label}>
                {mfaMethod === 'TOTP' ? 'Authentication code' : 'Recovery code'}
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="mfa-code"
                  type="text"
                  inputMode={mfaMethod === 'TOTP' ? 'numeric' : 'text'}
                  autoComplete="one-time-code"
                  autoFocus
                  required
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  className={styles.input}
                  placeholder={mfaMethod === 'TOTP' ? '123456' : 'ABCD-1234-EFGH'}
                  aria-describedby="mfa-code-hint"
                />
              </div>
              <p id="mfa-code-hint" className={styles.subtitle}>
                {mfaMethod === 'TOTP'
                  ? 'The code refreshes every 30 seconds.'
                  : 'Each recovery code can be used only once.'}
              </p>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>
                <input
                  type="checkbox"
                  checked={trustDevice}
                  onChange={(e) => setTrustDevice(e.target.checked)}
                />{' '}
                Trust this device for 30 days
              </label>
            </div>

            <button type="submit" disabled={mfaPending} className={styles.submitButton}>
              {mfaPending ? 'Verifying...' : 'Verify and sign in'}
            </button>
          </form>

          <div className={styles.footer}>
            {mfaChallenge.allowedMethods.includes('RECOVERY_CODE') && (
              <button
                type="button"
                className={styles.link}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => {
                  setMfaMethod((prev) => (prev === 'TOTP' ? 'RECOVERY_CODE' : 'TOTP'));
                  setMfaCode('');
                  setMfaError(null);
                }}
              >
                {mfaMethod === 'TOTP' ? 'Use a recovery code instead' : 'Use authenticator code'}
              </button>
            )}{' '}
            <button
              type="button"
              className={styles.link}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={() => {
                setMfaChallenge(null);
                setMfaCode('');
                setMfaError(null);
                setPassword('');
              }}
            >
              Back to sign in
            </button>
          </div>
        </div>
      </div>
    );
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
          Don&apos;t have an account?{' '}
          <Link href="/register" className={styles.link}>
            Create one
          </Link>
        </div>
      </div>
    </div>
  );
}
