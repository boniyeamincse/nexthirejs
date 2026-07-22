'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-context';

/**
 * Management route group guard.
 *
 * Requires authentication. Route visibility is NOT authorization — every
 * management API call is independently authorized server-side and will return
 * 403 for users without the reviewer permission. This layout only handles the
 * auth/session boundary; per-page role gating is handled in each page so it can
 * render an accessible "permission denied" state instead of a blank redirect.
 */
export default function ManagementLayout({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'unknown' || status === 'loading') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-zinc-500">Loading…</p>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return <>{children}</>;
}
