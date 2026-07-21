'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-context';
import { listSessions, revokeSession, logoutAllSessions } from '@/lib/api-client';
import type { UserSessionSummary } from '@/lib/api-client';
import { ApiClientError } from '@/lib/api-client';

export default function SessionsPage() {
  const { getAccessToken, logout, status } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<UserSessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ReactNode>(null);
  const [revokeTarget, setRevokeTarget] = useState<UserSessionSummary | null>(null);
  const [showLogoutAllConfirm, setShowLogoutAllConfirm] = useState(false);
  const [revokePending, setRevokePending] = useState(false);
  const [logoutAllPending, setLogoutAllPending] = useState(false);

  const fetchSessions = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const data = await listSessions(token);
      setSessions(data.sessions);
    } catch (err) {
      if (err instanceof ApiClientError && err.statusCode === 401) {
        await logout();
        router.push('/login');
        return;
      }
      setError('Failed to load sessions. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, logout, router]);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (mounted && status === 'authenticated') {
        await fetchSessions();
      }
    };
    void init();
    return () => { mounted = false; };
  }, [status, fetchSessions]);

  async function handleRevoke() {
    if (!revokeTarget) return;
    const token = getAccessToken();
    if (!token) return;

    setRevokePending(true);
    try {
      await revokeSession(token, revokeTarget.id);
      setRevokeTarget(null);

      if (revokeTarget.isCurrent) {
        await logout();
        router.push('/login');
        return;
      }

      await fetchSessions();
    } catch (err) {
      if (err instanceof ApiClientError && err.statusCode === 401) {
        await logout();
        router.push('/login');
        return;
      }
      setError('Failed to revoke session. Please try again.');
    } finally {
      setRevokePending(false);
    }
  }

  async function handleLogoutAll() {
    const token = getAccessToken();
    if (!token) return;

    setLogoutAllPending(true);
    try {
      await logoutAllSessions(token);
    } catch {
      // Best-effort; clear local state regardless
    } finally {
      await logout();
      router.push('/login');
    }
  }

  if (status === 'unknown' || status === 'loading') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24">
        <p className="text-center text-zinc-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold tracking-tight text-zinc-900">
        Security Settings
      </h1>
      <p className="mb-8 text-sm text-zinc-500">
        Manage your active sessions. Revoke any session you do not recognise.
      </p>

      {error && (
        <div role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
          <button
            onClick={fetchSessions}
            className="ml-2 font-medium underline underline-offset-2 hover:text-red-600"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-center text-zinc-400 py-8">Loading sessions...</p>
      ) : sessions.length === 0 ? (
        <p className="text-center text-zinc-400 py-8">No active sessions found.</p>
      ) : (
        <ul className="space-y-4" role="list">
          {sessions.map((session) => (
            <li
              key={session.id}
              className={`rounded-lg border p-4 ${session.isCurrent ? 'border-blue-200 bg-blue-50' : 'border-zinc-200 bg-white'}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-zinc-900">
                      {session.device.browser || 'Unknown browser'}
                    </span>
                    {session.isCurrent && (
                      <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                        Current
                      </span>
                    )}
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${
                      session.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-600'
                    }`}>
                      {session.status}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-zinc-500">
                    {session.device.operatingSystem && <span>{session.device.operatingSystem} &middot; </span>}
                    {session.device.deviceType && <span>{session.device.deviceType} &middot; </span>}
                    {session.ipAddressMasked && <span>{session.ipAddressMasked} &middot; </span>}
                    <span>Signed in {new Date(session.createdAt).toLocaleDateString()}</span>
                    {session.lastUsedAt && (
                      <span> &middot; Last active {new Date(session.lastUsedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setRevokeTarget(session)}
                  className="shrink-0 rounded-md bg-white px-3 py-1.5 text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  aria-label={`Revoke ${session.device.browser || 'Unknown'} session`}
                >
                  Revoke
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-10 border-t border-zinc-200 pt-6">
        <h2 className="text-lg font-semibold text-zinc-900">Log out from all devices</h2>
        <p className="mt-1 text-sm text-zinc-500">
          This will revoke every active session, including this one.
        </p>
        <button
          onClick={() => setShowLogoutAllConfirm(true)}
          disabled={logoutAllPending}
          className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {logoutAllPending ? 'Signing out...' : 'Log out from all devices'}
        </button>
      </div>

      {revokeTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="revoke-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setRevokeTarget(null)}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-lg bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="revoke-title" className="text-lg font-semibold text-zinc-900">
              {revokeTarget.isCurrent
                ? 'Revoke this session?'
                : 'Revoke this session?'}
            </h2>
            <p className="mt-2 text-sm text-zinc-600">
              {revokeTarget.isCurrent
                ? 'You will be signed out immediately.'
                : 'That device will need to sign in again.'}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setRevokeTarget(null)}
                disabled={revokePending}
                className="rounded-md bg-white px-4 py-2 text-sm font-medium text-zinc-700 border border-zinc-300 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                onClick={handleRevoke}
                disabled={revokePending}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {revokePending ? 'Revoking...' : 'Revoke'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showLogoutAllConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-all-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowLogoutAllConfirm(false)}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-lg bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="logout-all-title" className="text-lg font-semibold text-zinc-900">
              Log out from all devices?
            </h2>
            <p className="mt-2 text-sm text-zinc-600">
              Every active NextHire session, including this one, will be revoked.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutAllConfirm(false)}
                disabled={logoutAllPending}
                className="rounded-md bg-white px-4 py-2 text-sm font-medium text-zinc-700 border border-zinc-300 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                onClick={handleLogoutAll}
                disabled={logoutAllPending}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {logoutAllPending ? 'Signing out...' : 'Log out all'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
