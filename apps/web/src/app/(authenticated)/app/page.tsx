'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-context';

export default function AppPage() {
  const { user, logout, status } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  if (status === 'unknown' || status === 'loading') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24">
        <p className="text-center text-zinc-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-24">
      <h1 className="mb-8 text-center text-3xl font-bold tracking-tight text-zinc-900">
        Dashboard
      </h1>

      {user && (
        <div className="mb-8 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-zinc-800">Signed in as</h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-zinc-500">Email</dt>
              <dd className="text-sm font-medium text-zinc-900">{user.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-zinc-500">Status</dt>
              <dd className="text-sm font-medium text-green-600">{user.status}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-zinc-500">Role</dt>
              <dd className="text-sm font-medium text-zinc-900">{user.roleCodes.join(', ')}</dd>
            </div>
          </dl>
        </div>
      )}

      <div className="text-center">
        <button
          onClick={handleLogout}
          className="rounded-md bg-red-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
