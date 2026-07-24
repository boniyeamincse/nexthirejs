'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-context';
import {
  ApiClientError,
  listMyPendingCompanyInvitations,
  acceptCompanyInvitation,
  declineCompanyInvitation,
} from '@/lib/api-client';
import type { MyCompanyInvitationResult } from '@nexthire/types';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  RECRUITER: 'Recruiter',
  VIEWER: 'Viewer',
};

const cardStyle: React.CSSProperties = {
  padding: '1rem',
  background: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '0.75rem',
  marginBottom: '0.75rem',
};

export default function MyCompanyInvitationsPage() {
  const { getAccessToken, logout, status: authStatus } = useAuth();
  const router = useRouter();

  const [invitations, setInvitations] = useState<MyCompanyInvitationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setPageError(null);
    try {
      const rows = await listMyPendingCompanyInvitations(token);
      setInvitations(rows);
    } catch (err) {
      if (err instanceof ApiClientError && err.statusCode === 401) {
        await logout();
        return;
      }
      setPageError('Failed to load your invitations. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, logout]);

  useEffect(() => {
    if (authStatus === 'authenticated') {
      void load();
    } else if (authStatus === 'unauthenticated') {
      setLoading(false);
    }
  }, [authStatus, load]);

  async function handleAccept(invitationId: string) {
    const token = getAccessToken();
    if (!token) return;
    setBusyId(invitationId);
    try {
      await acceptCompanyInvitation(token, invitationId);
      router.push('/company/team');
    } catch {
      setPageError('Failed to accept invitation. Please try again.');
      setBusyId(null);
    }
  }

  async function handleDecline(invitationId: string) {
    const token = getAccessToken();
    if (!token) return;
    setBusyId(invitationId);
    try {
      await declineCompanyInvitation(token, invitationId);
      await load();
    } catch {
      setPageError('Failed to decline invitation. Please try again.');
    } finally {
      setBusyId(null);
    }
  }

  if (authStatus === 'unknown' || authStatus === 'loading' || loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <p style={{ color: '#94a3b8' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem',
        }}
      >
        <h1 style={{ margin: 0, color: '#f1f5f9', fontSize: '1.5rem', fontWeight: 700 }}>
          My Invitations
        </h1>
        <Link href="/company/team" style={{ color: '#93c5fd', fontSize: '0.85rem' }}>
          Company team →
        </Link>
      </div>

      {pageError && (
        <p role="alert" style={{ color: '#fca5a5', marginBottom: '1rem' }}>
          {pageError}
        </p>
      )}

      {invitations.length === 0 ? (
        <p style={{ color: '#64748b' }}>You have no pending company invitations.</p>
      ) : (
        invitations.map((inv) => (
          <div key={inv.id} style={cardStyle}>
            <div style={{ color: '#e2e8f0', fontWeight: 600, marginBottom: '0.25rem' }}>
              {inv.companyName}
            </div>
            <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
              Invited as {ROLE_LABELS[inv.role] ?? inv.role} · expires{' '}
              {new Date(inv.expiresAt).toLocaleDateString()}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => handleAccept(inv.id)}
                disabled={busyId === inv.id}
                style={{
                  padding: '0.4rem 0.9rem',
                  background: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '0.4rem',
                  fontSize: '0.83rem',
                  fontWeight: 600,
                  cursor: busyId === inv.id ? 'not-allowed' : 'pointer',
                }}
              >
                Accept
              </button>
              <button
                onClick={() => handleDecline(inv.id)}
                disabled={busyId === inv.id}
                style={{
                  padding: '0.4rem 0.9rem',
                  background: 'transparent',
                  color: '#94a3b8',
                  border: '1px solid #334155',
                  borderRadius: '0.4rem',
                  fontSize: '0.83rem',
                  cursor: busyId === inv.id ? 'not-allowed' : 'pointer',
                }}
              >
                Decline
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
