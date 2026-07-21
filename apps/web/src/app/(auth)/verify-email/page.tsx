'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { verifyEmail, ApiClientError } from '@/lib/api-client';

export default function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { token } = use(searchParams);
  const router = useRouter();
  const [status, setStatus] = useState<'verifying' | 'redirecting' | 'error'>('verifying');

  useEffect(() => {
    if (!token || typeof token !== 'string') {
      router.replace('/verify-email/error');
      return;
    }

    let cancelled = false;

    async function doVerify() {
      try {
        await verifyEmail(token as string);
        if (!cancelled) {
          setStatus('redirecting');
          router.replace('/verify-email/success');
        }
      } catch (error) {
        if (!cancelled) {
          setStatus('error');
          if (error instanceof ApiClientError && error.statusCode === 409) {
            router.replace('/verify-email/success');
          } else {
            router.replace('/verify-email/error');
          }
        }
      }
    }

    doVerify();

    return () => {
      cancelled = true;
    };
  }, [token, router]);

  if (status === 'redirecting') {
    return null;
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:py-24">
      <div className="text-center">
        <div
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100"
          aria-hidden="true"
        >
          <svg className="h-8 w-8 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Verifying your email</h1>

        <p className="mt-4 text-base text-zinc-600">
          {status === 'verifying'
            ? 'Please wait while we verify your email address...'
            : 'Redirecting...'}
        </p>
      </div>
    </div>
  );
}
