'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-context';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/expert/dashboard' },
  { label: 'Expertise', href: '/expert/expertise' },
  { label: 'Services', href: '/expert/services' },
  { label: 'Availability', href: '/expert/availability' },
  { label: 'Bookings', href: '/expert/bookings' },
  { label: 'Reviews', href: '/expert/reviews' },
  { label: 'Wallet', href: '/expert/wallet' },
] as const;

const PAGE_TITLES: Record<string, string> = {
  '/expert/dashboard': 'Dashboard',
  '/expert/expertise': 'Expertise',
  '/expert/services': 'Services',
  '/expert/services/new': 'New Service',
  '/expert/availability': 'Availability',
  '/expert/bookings': 'Bookings',
  '/expert/reviews': 'Reviews',
  '/expert/wallet': 'Wallet',
};

/**
 * Pages an applicant must reach before they hold the 'expert' role (granted
 * only on approval): profile/verification/application-status render their
 * own ExpertNav stepper and gate themselves via useExpertApplicant. Only the
 * post-approval workspace (expertise/services/availability) requires 'expert'.
 */
const APPLICANT_PATH_PREFIXES = [
  '/expert/profile',
  '/expert/verification',
  '/expert/application-status',
];

export default function ExpertLayout({ children }: { children: React.ReactNode }) {
  const { getAccessToken, logout, user, status: authStatus } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isApplicantPath = APPLICANT_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (
      authStatus === 'authenticated' &&
      user &&
      !isApplicantPath &&
      !user.roleCodes.includes('expert')
    ) {
      router.push('/');
    }
  }, [authStatus, user, router, isApplicantPath]);

  if (authStatus === 'unknown' || authStatus === 'loading') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  if (authStatus === 'unauthenticated') return null;
  if (!user || (!isApplicantPath && !user.roleCodes.includes('expert'))) return null;

  const currentTitle =
    Object.entries(PAGE_TITLES).find(([path]) => pathname.startsWith(path))?.[1] ?? 'Expert';

  if (isApplicantPath) {
    return <div className="max-w-5xl mx-auto p-6">{children}</div>;
  }

  return (
    <div className="flex min-h-[calc(100vh-72px)]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 transform border-r border-zinc-800 bg-zinc-900 pt-20
          transition-transform duration-200 ease-in-out lg:static lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <nav className="space-y-1 px-4">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                style={{
                  display: 'block',
                  padding: '0.6rem 0.9rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  textDecoration: 'none',
                  background: isActive ? 'rgba(37,99,235,0.15)' : 'transparent',
                  color: isActive ? '#93c5fd' : '#cbd5e1',
                  border: `1px solid ${isActive ? 'rgba(37,99,235,0.35)' : 'transparent'}`,
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1">
        {/* Mobile header */}
        <div className="flex items-center gap-3 border-b border-zinc-800 px-6 py-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle navigation"
            style={{
              background: 'none',
              border: 'none',
              color: '#e2e8f0',
              fontSize: '1.25rem',
              cursor: 'pointer',
              padding: '0.25rem',
            }}
          >
            ☰
          </button>
          <h1 style={{ color: '#f1f5f9', fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>
            {currentTitle}
          </h1>
        </div>

        <div className="max-w-5xl mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}
