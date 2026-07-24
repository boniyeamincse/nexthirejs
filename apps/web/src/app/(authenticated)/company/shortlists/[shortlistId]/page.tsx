'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/providers/auth-context';
import {
  ApiClientError,
  getTalentShortlist,
  updateTalentShortlistMember,
  removeTalentShortlistMember,
  getMyCompanyTeamRole,
} from '@/lib/api-client';
import type {
  TalentShortlistDetail,
  TalentShortlistMemberResult,
  TalentPipelineStageValue,
} from '@nexthire/types';
import { TALENT_PIPELINE_STAGES } from '@nexthire/constants';

const STAGE_LABELS: Record<string, string> = {
  SHORTLISTED: 'Shortlisted',
  CONTACTED: 'Contacted',
  SCREENING: 'Screening',
  INTERVIEWING: 'Interviewing',
  OFFER: 'Offer',
  HIRED: 'Hired',
  REJECTED: 'Rejected',
};

const cardStyle: React.CSSProperties = {
  padding: '0.75rem 0.85rem',
  background: '#0f172a',
  border: '1px solid #334155',
  borderRadius: '0.5rem',
  marginBottom: '0.5rem',
};

export default function TalentShortlistDetailPage() {
  const params = useParams<{ shortlistId: string }>();
  const { getAccessToken, logout, status: authStatus } = useAuth();

  const [detail, setDetail] = useState<TalentShortlistDetail | null>(null);
  const [canWrite, setCanWrite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notVerified, setNotVerified] = useState(false);
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setPageError(null);
    setNotVerified(false);
    try {
      const [shortlist, role] = await Promise.all([
        getTalentShortlist(token, params.shortlistId),
        getMyCompanyTeamRole(token),
      ]);
      setDetail(shortlist);
      setCanWrite(role.role !== 'VIEWER');
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.statusCode === 401) {
          await logout();
          return;
        }
        if (err.statusCode === 403) {
          setNotVerified(true);
          return;
        }
      }
      setPageError('Failed to load shortlist. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, logout, params.shortlistId]);

  useEffect(() => {
    if (authStatus === 'authenticated') {
      void load();
    } else if (authStatus === 'unauthenticated') {
      setLoading(false);
    }
  }, [authStatus, load]);

  async function handleMove(memberId: string, stage: TalentPipelineStageValue) {
    const token = getAccessToken();
    if (!token) return;
    setActionError(null);
    try {
      await updateTalentShortlistMember(token, params.shortlistId, memberId, { stage });
      await load();
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : 'Failed to move candidate.');
    }
  }

  async function handleReorder(member: TalentShortlistMemberResult, direction: -1 | 1) {
    const token = getAccessToken();
    if (!token) return;
    setActionError(null);
    try {
      await updateTalentShortlistMember(token, params.shortlistId, member.id, {
        targetIndex: Math.max(0, member.sortOrder + direction),
      });
      await load();
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : 'Failed to reorder candidate.');
    }
  }

  async function handleSaveNotes(memberId: string) {
    const token = getAccessToken();
    if (!token) return;
    setActionError(null);
    try {
      await updateTalentShortlistMember(token, params.shortlistId, memberId, {
        notes: notesDraft[memberId] ?? '',
      });
      await load();
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : 'Failed to save notes.');
    }
  }

  async function handleRemove(memberId: string) {
    const token = getAccessToken();
    if (!token) return;
    setActionError(null);
    try {
      await removeTalentShortlistMember(token, params.shortlistId, memberId);
      await load();
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : 'Failed to remove candidate.');
    }
  }

  if (authStatus === 'unknown' || authStatus === 'loading' || loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p style={{ color: '#94a3b8' }}>Loading...</p>
      </div>
    );
  }

  if (notVerified) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p role="alert" style={{ color: '#fca5a5' }}>
          Shortlists are only available to verified companies.
        </p>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p role="alert" style={{ color: '#fca5a5' }}>
          {pageError ?? 'Shortlist not found.'}
        </p>
      </div>
    );
  }

  const membersByStage = new Map<string, TalentShortlistMemberResult[]>();
  for (const stage of TALENT_PIPELINE_STAGES) {
    membersByStage.set(
      stage,
      detail.members.filter((m) => m.stage === stage).sort((a, b) => a.sortOrder - b.sortOrder),
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Link href="/company/shortlists" style={{ color: '#93c5fd', fontSize: '0.85rem' }}>
        ← All shortlists
      </Link>

      <h1
        style={{
          margin: '0.75rem 0 0.2rem',
          color: '#f1f5f9',
          fontSize: '1.5rem',
          fontWeight: 700,
        }}
      >
        {detail.name}
      </h1>
      {detail.description && (
        <p style={{ margin: '0 0 1rem', color: '#94a3b8', fontSize: '0.88rem' }}>
          {detail.description}
        </p>
      )}

      {actionError && (
        <p role="alert" style={{ color: '#fca5a5', marginBottom: '1rem' }}>
          {actionError}
        </p>
      )}

      {TALENT_PIPELINE_STAGES.map((stage) => {
        const members = membersByStage.get(stage) ?? [];
        return (
          <section key={stage} style={{ marginBottom: '1.5rem' }}>
            <h2
              style={{ margin: '0 0 0.5rem', color: '#93c5fd', fontSize: '1rem', fontWeight: 600 }}
            >
              {STAGE_LABELS[stage] ?? stage} ({members.length})
            </h2>
            {members.length === 0 ? (
              <p style={{ color: '#475569', fontSize: '0.82rem' }}>No candidates in this stage.</p>
            ) : (
              members.map((member, index) => (
                <div key={member.id} style={cardStyle}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div>
                      <Link
                        href={`/company/candidates/${member.candidateUserId}`}
                        style={{
                          color: '#f1f5f9',
                          fontWeight: 600,
                          fontSize: '0.9rem',
                          textDecoration: 'none',
                        }}
                      >
                        {member.displayName}
                      </Link>
                      {member.professionalHeadline && (
                        <div style={{ color: '#64748b', fontSize: '0.78rem' }}>
                          {member.professionalHeadline}
                        </div>
                      )}
                      {member.tags.length > 0 && (
                        <div
                          style={{
                            marginTop: '0.3rem',
                            display: 'flex',
                            gap: '0.3rem',
                            flexWrap: 'wrap',
                          }}
                        >
                          {member.tags.map((tag) => (
                            <span
                              key={tag}
                              style={{
                                padding: '0.1rem 0.45rem',
                                background: 'rgba(148,163,184,0.15)',
                                color: '#cbd5e1',
                                borderRadius: '9999px',
                                fontSize: '0.72rem',
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {canWrite && (
                      <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                        <button
                          aria-label={`Move ${member.displayName} up`}
                          onClick={() => handleReorder(member, -1)}
                          disabled={index === 0}
                          style={{
                            padding: '0.2rem 0.5rem',
                            cursor: index === 0 ? 'not-allowed' : 'pointer',
                          }}
                        >
                          ↑
                        </button>
                        <button
                          aria-label={`Move ${member.displayName} down`}
                          onClick={() => handleReorder(member, 1)}
                          disabled={index === members.length - 1}
                          style={{
                            padding: '0.2rem 0.5rem',
                            cursor: index === members.length - 1 ? 'not-allowed' : 'pointer',
                          }}
                        >
                          ↓
                        </button>
                        <label
                          htmlFor={`stage-${member.id}`}
                          style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}
                        >
                          Move {member.displayName} to stage
                        </label>
                        <select
                          id={`stage-${member.id}`}
                          value={member.stage}
                          onChange={(e) =>
                            handleMove(member.id, e.target.value as TalentPipelineStageValue)
                          }
                          style={{
                            padding: '0.25rem 0.4rem',
                            background: '#1e293b',
                            border: '1px solid #334155',
                            borderRadius: '0.35rem',
                            color: '#e2e8f0',
                            fontSize: '0.78rem',
                          }}
                        >
                          {TALENT_PIPELINE_STAGES.map((s) => (
                            <option key={s} value={s}>
                              {STAGE_LABELS[s]}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleRemove(member.id)}
                          style={{
                            padding: '0.2rem 0.5rem',
                            background: 'rgba(239,68,68,0.15)',
                            color: '#fca5a5',
                            border: '1px solid rgba(239,68,68,0.3)',
                            borderRadius: '0.35rem',
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  {canWrite ? (
                    <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.4rem' }}>
                      <textarea
                        aria-label={`Notes for ${member.displayName}`}
                        value={notesDraft[member.id] ?? member.notes ?? ''}
                        onChange={(e) =>
                          setNotesDraft((prev) => ({ ...prev, [member.id]: e.target.value }))
                        }
                        rows={2}
                        style={{
                          flex: '1 1 auto',
                          padding: '0.3rem 0.5rem',
                          background: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '0.35rem',
                          color: '#e2e8f0',
                          fontSize: '0.78rem',
                          resize: 'vertical',
                        }}
                      />
                      <button
                        onClick={() => handleSaveNotes(member.id)}
                        style={{
                          padding: '0.3rem 0.6rem',
                          background: '#334155',
                          color: '#e2e8f0',
                          border: 'none',
                          borderRadius: '0.35rem',
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                        }}
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    member.notes && (
                      <p style={{ marginTop: '0.5rem', color: '#94a3b8', fontSize: '0.8rem' }}>
                        {member.notes}
                      </p>
                    )
                  )}
                </div>
              ))
            )}
          </section>
        );
      })}
    </div>
  );
}
