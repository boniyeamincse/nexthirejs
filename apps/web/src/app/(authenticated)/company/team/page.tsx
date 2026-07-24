'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-context';
import {
  ApiClientError,
  getMyCompanyTeamRole,
  listMyCompanyTeam,
  updateCompanyTeamMemberRole,
  removeCompanyTeamMember,
  listMyCompanyInvitations,
  createCompanyInvitation,
  revokeCompanyInvitation,
} from '@/lib/api-client';
import type {
  CompanyMemberRoleValue,
  CompanyMemberResult,
  CompanyInvitationResult,
  CompanyInvitableRoleValue,
} from '@nexthire/types';
import { COMPANY_INVITABLE_ROLES } from '@nexthire/constants';

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  RECRUITER: 'Recruiter',
  VIEWER: 'Viewer',
};

const cardStyle: React.CSSProperties = {
  padding: '1.1rem',
  background: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '0.75rem',
  marginBottom: '1.25rem',
};

const inputStyle: React.CSSProperties = {
  padding: '0.5rem 0.7rem',
  background: '#0f172a',
  border: '1px solid #334155',
  borderRadius: '0.4rem',
  color: '#e2e8f0',
  fontSize: '0.88rem',
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.6rem 0.7rem',
  background: '#0f172a',
  border: '1px solid #334155',
  borderRadius: '0.4rem',
  fontSize: '0.85rem',
};

export default function CompanyTeamPage() {
  const { getAccessToken, logout, status: authStatus } = useAuth();

  const [myRole, setMyRole] = useState<CompanyMemberRoleValue | null>(null);
  const [members, setMembers] = useState<CompanyMemberResult[]>([]);
  const [invitations, setInvitations] = useState<CompanyInvitationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [notAMember, setNotAMember] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<CompanyInvitableRoleValue>('RECRUITER');
  const [inviting, setInviting] = useState(false);

  const isManager = myRole === 'OWNER' || myRole === 'ADMIN';

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setPageError(null);
    setNotAMember(false);
    try {
      const role = await getMyCompanyTeamRole(token);
      setMyRole(role.role);
      if (!role.role) {
        setNotAMember(true);
        return;
      }
      const roster = await listMyCompanyTeam(token);
      setMembers(roster);
      if (role.role === 'OWNER' || role.role === 'ADMIN') {
        const invites = await listMyCompanyInvitations(token);
        setInvitations(invites);
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.statusCode === 401) {
          await logout();
          return;
        }
        if (err.statusCode === 403) {
          setNotAMember(true);
          return;
        }
      }
      setPageError('Failed to load your company team. Please try again.');
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

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) return;
    setInviting(true);
    setActionError(null);
    try {
      await createCompanyInvitation(token, { email: inviteEmail.trim(), role: inviteRole });
      setInviteEmail('');
      await load();
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : 'Failed to send invitation.');
    } finally {
      setInviting(false);
    }
  }

  async function handleRevoke(invitationId: string) {
    const token = getAccessToken();
    if (!token) return;
    setActionError(null);
    try {
      await revokeCompanyInvitation(token, invitationId);
      await load();
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : 'Failed to revoke invitation.');
    }
  }

  async function handleRoleChange(memberId: string, role: CompanyInvitableRoleValue) {
    const token = getAccessToken();
    if (!token) return;
    setActionError(null);
    try {
      await updateCompanyTeamMemberRole(token, memberId, role);
      await load();
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : 'Failed to update role.');
    }
  }

  async function handleRemove(memberId: string) {
    const token = getAccessToken();
    if (!token) return;
    setActionError(null);
    try {
      await removeCompanyTeamMember(token, memberId);
      await load();
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : 'Failed to remove member.');
    }
  }

  if (authStatus === 'unknown' || authStatus === 'loading' || loading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <p style={{ color: '#94a3b8' }}>Loading...</p>
      </div>
    );
  }

  if (notAMember) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <p role="alert" style={{ color: '#fca5a5' }}>
          You are not part of a company team yet.
        </p>
        <p style={{ marginTop: '0.75rem' }}>
          <Link href="/become-a-company" style={{ color: '#93c5fd' }}>
            Set up a company profile
          </Link>{' '}
          or check{' '}
          <Link href="/company/invitations" style={{ color: '#93c5fd' }}>
            your pending invitations
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem',
        }}
      >
        <h1 style={{ margin: 0, color: '#f1f5f9', fontSize: '1.6rem', fontWeight: 700 }}>
          Company Team
        </h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/company/shortlists" style={{ color: '#93c5fd', fontSize: '0.85rem' }}>
            Shortlists →
          </Link>
          <Link href="/company/candidates" style={{ color: '#93c5fd', fontSize: '0.85rem' }}>
            Candidate search →
          </Link>
          <Link href="/become-a-company" style={{ color: '#93c5fd', fontSize: '0.85rem' }}>
            ← Company profile
          </Link>
        </div>
      </div>

      {pageError && (
        <p role="alert" style={{ color: '#fca5a5', marginBottom: '1rem' }}>
          {pageError}
        </p>
      )}
      {actionError && (
        <p role="alert" style={{ color: '#fca5a5', marginBottom: '1rem' }}>
          {actionError}
        </p>
      )}

      <div style={cardStyle}>
        <h2 style={{ margin: '0 0 0.75rem', color: '#f1f5f9', fontSize: '1.05rem' }}>Members</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {members.map((member) => (
            <div key={member.id} style={rowStyle}>
              <div>
                <div style={{ color: '#e2e8f0', fontWeight: 600 }}>{member.displayName}</div>
                <div style={{ color: '#64748b', fontSize: '0.78rem' }}>{member.email}</div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {isManager && member.role !== 'OWNER' ? (
                  <select
                    value={member.role}
                    onChange={(e) =>
                      handleRoleChange(member.id, e.target.value as CompanyInvitableRoleValue)
                    }
                    style={inputStyle}
                  >
                    {COMPANY_INVITABLE_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span style={{ color: '#93c5fd', fontSize: '0.8rem' }}>
                    {ROLE_LABELS[member.role] ?? member.role}
                  </span>
                )}
                {member.role !== 'OWNER' && (
                  <button
                    onClick={() => handleRemove(member.id)}
                    style={{
                      padding: '0.3rem 0.6rem',
                      background: 'rgba(239,68,68,0.15)',
                      color: '#fca5a5',
                      border: '1px solid rgba(239,68,68,0.3)',
                      borderRadius: '0.4rem',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {isManager && (
        <div style={cardStyle}>
          <h2 style={{ margin: '0 0 0.75rem', color: '#f1f5f9', fontSize: '1.05rem' }}>
            Invite a team member
          </h2>
          <p style={{ margin: '0 0 0.75rem', color: '#64748b', fontSize: '0.8rem' }}>
            The invitee must already have a NextHire account.
          </p>
          <form
            onSubmit={handleInvite}
            style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}
          >
            <input
              type="email"
              required
              placeholder="teammate@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              style={{ ...inputStyle, flex: '1 1 220px' }}
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as CompanyInvitableRoleValue)}
              style={inputStyle}
            >
              {COMPANY_INVITABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={inviting}
              style={{
                padding: '0.5rem 1rem',
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: '0.4rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: inviting ? 'not-allowed' : 'pointer',
              }}
            >
              {inviting ? '...' : 'Invite'}
            </button>
          </form>

          {invitations.length > 0 && (
            <div
              style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
            >
              {invitations.map((inv) => (
                <div key={inv.id} style={rowStyle}>
                  <div>
                    <div style={{ color: '#e2e8f0' }}>{inv.email}</div>
                    <div style={{ color: '#64748b', fontSize: '0.78rem' }}>
                      {ROLE_LABELS[inv.role] ?? inv.role} · {inv.status} · invited by{' '}
                      {inv.invitedByDisplayName}
                    </div>
                  </div>
                  {inv.status === 'PENDING' && (
                    <button
                      onClick={() => handleRevoke(inv.id)}
                      style={{
                        padding: '0.3rem 0.6rem',
                        background: 'transparent',
                        color: '#94a3b8',
                        border: '1px solid #334155',
                        borderRadius: '0.4rem',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                      }}
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
