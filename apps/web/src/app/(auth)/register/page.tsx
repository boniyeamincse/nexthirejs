'use client';

import { useState, useCallback, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { candidateRegistrationSchema } from '@nexthire/validation';
import { registerCandidate, ApiClientError } from '@/lib/api-client';
import styles from '../auth.module.css';

interface FieldErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  acceptTerms?: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const validateField = useCallback(
    (field: string, value: string | boolean) => {
      const data = {
        email: field === 'email' ? (value as string) : email,
        password: field === 'password' ? (value as string) : password,
        confirmPassword: field === 'confirmPassword' ? (value as string) : confirmPassword,
        acceptTerms: field === 'acceptTerms' ? (value as boolean) : acceptTerms,
      };

      const result = candidateRegistrationSchema.safeParse(data);
      if (!result.success) {
        const err = result.error.flatten().fieldErrors;
        const fieldMap: Record<string, string[]> = {
          email: err.email ?? [],
          password: err.password ?? [],
          confirmPassword: err.confirmPassword ?? [],
          acceptTerms: err.acceptTerms ?? [],
        };
        setFieldErrors((prev) => ({
          ...prev,
          [field]: fieldMap[field]?.[0],
        }));
      } else {
        setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [email, password, confirmPassword, acceptTerms],
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setServerError(null);

    const data = {
      email: email.trim().toLowerCase(),
      password,
      confirmPassword,
      acceptTerms: acceptTerms as true,
    };

    const result = candidateRegistrationSchema.safeParse(data);
    if (!result.success) {
      const err = result.error.flatten().fieldErrors;
      setFieldErrors({
        email: err.email?.[0],
        password: err.password?.[0],
        confirmPassword: err.confirmPassword?.[0],
        acceptTerms: err.acceptTerms?.[0],
      });
      return;
    }

    setFieldErrors({});
    setIsPending(true);

    try {
      await registerCandidate(data);
      router.push('/register/success');
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.statusCode === 409) {
          setServerError(
            'An account with this email address already exists. Please use a different email or sign in.',
          );
        } else if (error.statusCode === 429) {
          setServerError('Too many registration attempts. Please wait a minute and try again.');
        } else if (error.statusCode === 400) {
          setServerError('Invalid input. Please check your information and try again.');
        } else {
          setServerError('Registration service is currently unavailable. Please try again later.');
        }
      } else {
        setServerError('Unable to connect to the registration service. Please try again later.');
      }
    } finally {
      setIsPending(false);
    }
  }

  const hasErrors = Object.values(fieldErrors).some(Boolean);

  return (
    <div className={styles.container}>
      <div className={styles.background}></div>
      <div className={styles.glassCard}>
        <div className={styles.header}>
          <h1 className={styles.title}>Create Account</h1>
          <p className={styles.subtitle}>Start your career journey with NextHire.</p>
        </div>

        {serverError && (
          <div className={styles.alertError} role="alert">
            {serverError}
          </div>
        )}

        {hasErrors && !serverError && (
          <div className={styles.alertError} role="alert">
            Please correct the errors below before submitting.
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
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  validateField('password', e.target.value);
                }}
                aria-invalid={!!fieldErrors.password}
                className={`${styles.input} ${fieldErrors.password ? styles.inputError : ''}`}
                placeholder="Min. 10 characters"
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

          <div className={styles.inputGroup}>
            <label htmlFor="confirmPassword" className={styles.label}>
              Confirm password
            </label>
            <div className={styles.inputWrapper}>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  validateField('confirmPassword', e.target.value);
                }}
                aria-invalid={!!fieldErrors.confirmPassword}
                className={`${styles.input} ${fieldErrors.confirmPassword ? styles.inputError : ''}`}
                placeholder="Re-enter your password"
                style={{ paddingRight: '3rem' }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className={styles.passwordToggle}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <p className={styles.errorMessage} role="alert">
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>

          <div className={styles.checkboxGroup}>
            <input
              id="acceptTerms"
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => {
                setAcceptTerms(e.target.checked);
                validateField('acceptTerms', e.target.checked);
              }}
              aria-invalid={!!fieldErrors.acceptTerms}
              className={styles.checkbox}
            />
            <label htmlFor="acceptTerms" className={styles.checkboxLabel}>
              I accept the <span className={styles.link}>Terms and Conditions</span>
            </label>
          </div>
          {fieldErrors.acceptTerms && (
            <p className={styles.errorMessage} role="alert">
              {fieldErrors.acceptTerms}
            </p>
          )}

          <button type="submit" disabled={isPending} className={styles.submitButton}>
            {isPending ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div className={styles.footer}>
          Already have an account?{' '}
          <Link href="/login" className={styles.link}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
