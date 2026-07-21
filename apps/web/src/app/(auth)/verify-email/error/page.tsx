'use client';

import { useState, useCallback, type FormEvent } from 'react';
import Link from 'next/link';
import { resendVerificationEmail, ApiClientError } from '@/lib/api-client';

interface ResendState {
  submitted: boolean;
  message: string | null;
  error: string | null;
}

export default function VerifyEmailErrorPage() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<ResendState>({
    submitted: false,
    message: null,
    error: null,
  });
  const [isPending, setIsPending] = useState(false);

  const handleResend = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setState({ submitted: false, message: null, error: null });
      setIsPending(true);

      try {
        const result = await resendVerificationEmail(email.trim());
        setState({ submitted: true, message: result.message, error: null });
      } catch (error) {
        if (error instanceof ApiClientError) {
          if (error.statusCode === 404) {
            setState({
              submitted: true,
              message: null,
              error: 'No account found with this email address.',
            });
          } else if (error.statusCode === 409) {
            setState({
              submitted: true,
              message: null,
              error: 'This email is already verified. You can sign in.',
            });
          } else if (error.statusCode === 429) {
            setState({
              submitted: true,
              message: null,
              error: 'Too many requests. Please wait a minute and try again.',
            });
          } else {
            setState({
              submitted: true,
              message: null,
              error: 'Failed to resend verification email. Please try again later.',
            });
          }
        } else {
          setState({
            submitted: true,
            message: null,
            error: 'Unable to connect. Please try again later.',
          });
        }
      } finally {
        setIsPending(false);
      }
    },
    [email],
  );

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:py-24">
      <div className="text-center">
        <div
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100"
          aria-hidden="true"
        >
          <svg
            className="h-8 w-8 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Verification failed</h1>

        <p className="mt-4 text-base text-zinc-600">
          The verification link is invalid or has expired. Enter your email below to receive a new
          one.
        </p>

        {state.message && (
          <div
            role="alert"
            className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800"
          >
            {state.message}
          </div>
        )}

        {state.error && (
          <div
            role="alert"
            className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            {state.error}
          </div>
        )}

        {!state.message && (
          <form onSubmit={handleResend} className="mt-8 space-y-4">
            <div>
              <label htmlFor="resend-email" className="block text-sm font-medium text-zinc-700">
                Email address
              </label>
              <input
                id="resend-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="you@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? 'Sending...' : 'Resend verification email'}
            </button>
          </form>
        )}

        <p className="mt-8 text-sm text-zinc-500">
          <Link
            href="/"
            className="font-medium text-blue-600 underline underline-offset-2 hover:text-blue-800 focus:outline-2 focus:outline-offset-2 focus:outline-blue-600 rounded"
          >
            Return to home
          </Link>
        </p>
      </div>
    </div>
  );
}
