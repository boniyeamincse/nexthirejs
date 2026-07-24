'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/providers/auth-context';
import {
  ApiClientError,
  getCompanyCandidateDetail,
  listTalentShortlists,
  addTalentShortlistMember,
} from '@/lib/api-client';
import type { CompanyCandidateDetail, TalentShortlistSummary } from '@nexthire/types';

const cardStyle: React.CSSProperties = {
  padding: '1.1rem',
  background: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '0.75rem',
  marginBottom: '1.25rem',
};

export default function CompanyCandidateDetailPage() {
  const params = useParams<{ candidateId: string }>();
  const { getAccessToken, logout, status: authStatus } = useAuth();

  const [detail, setDetail] = useState<CompanyCandidateDetail | null>(null);
  const [shortlists, setShortlists] = useState<TalentShortlistSummary[]>([]);
  const [selectedShortlistId, setSelectedShortlistId] = useState('');
  const [adding, setAdding] = useState(false);
  const [addStatus, setAddStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [notVerified, setNotVerified] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setPageError(null);
    setNotVerified(false);
    setNotFound(false);
    try {
      const [result, myShortlists] = await Promise.all([
        getCompanyCandidateDetail(token, params.candidateId),
        listTalentShortlists(token).catch(() => []),
      ]);
      setDetail(result);
      setShortlists(myShortlists);
      if (myShortlists[0]) setSelectedShortlistId(myShortlists[0].id);
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
        if (err.statusCode === 404) {
          setNotFound(true);
          return;
        }
      }
      setPageError('Failed to load candidate profile. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, logout, params.candidateId]);

  useEffect(() => {
    if (authStatus === 'authenticated') {
      void load();
    } else if (authStatus === 'unauthenticated') {
      setLoading(false);
    }
  }, [authStatus, load]);

  async function handleAddToShortlist() {
    const token = getAccessToken();
    if (!token || !selectedShortlistId) return;
    setAdding(true);
    setAddStatus(null);
    try {
      await addTalentShortlistMember(token, selectedShortlistId, {
        candidateUserId: params.candidateId,
      });
      const shortlistName =
        shortlists.find((s) => s.id === selectedShortlistId)?.name ?? 'shortlist';
      setAddStatus(`Added to ${shortlistName}.`);
    } catch (err) {
      setAddStatus(
        err instanceof ApiClientError ? err.message : 'Failed to add candidate to shortlist.',
      );
    } finally {
      setAdding(false);
    }
  }

  if (authStatus === 'unknown' || authStatus === 'loading' || loading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <p style={{ color: '#94a3b8' }}>Loading...</p>
      </div>
    );
  }

  if (notVerified) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <p role="alert" style={{ color: '#fca5a5' }}>
          Candidate profiles are only available to verified companies.
        </p>
      </div>
    );
  }

  if (notFound || !detail) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <p role="alert" style={{ color: '#fca5a5' }}>
          {pageError ?? 'This candidate is no longer discoverable.'}
        </p>
      </div>
    );
  }

  const { profile, publicCvs } = detail;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Link href="/company/candidates" style={{ color: '#93c5fd', fontSize: '0.85rem' }}>
        ← Back to search
      </Link>

      <h1
        style={{
          margin: '0.75rem 0 0.2rem',
          color: '#f1f5f9',
          fontSize: '1.5rem',
          fontWeight: 700,
        }}
      >
        {profile.displayName}
      </h1>
      {profile.professionalHeadline && (
        <p style={{ margin: '0 0 1rem', color: '#93c5fd', fontSize: '0.95rem' }}>
          {profile.professionalHeadline}
        </p>
      )}

      {profile.location && (profile.location.city || profile.location.countryName) && (
        <p style={{ margin: '0 0 1.25rem', color: '#64748b', fontSize: '0.85rem' }}>
          {[profile.location.city, profile.location.countryName].filter(Boolean).join(', ')}
        </p>
      )}

      <div style={cardStyle}>
        <h2 style={{ margin: '0 0 0.6rem', color: '#f1f5f9', fontSize: '1.05rem' }}>
          Add to shortlist
        </h2>
        {shortlists.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
            <Link href="/company/shortlists" style={{ color: '#93c5fd' }}>
              Create a shortlist
            </Link>{' '}
            to start tracking candidates.
          </p>
        ) : (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <select
              value={selectedShortlistId}
              onChange={(e) => setSelectedShortlistId(e.target.value)}
              style={{
                padding: '0.4rem 0.6rem',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '0.4rem',
                color: '#e2e8f0',
                fontSize: '0.85rem',
              }}
            >
              {shortlists.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleAddToShortlist}
              disabled={adding}
              style={{
                padding: '0.4rem 0.9rem',
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: '0.4rem',
                fontSize: '0.83rem',
                fontWeight: 600,
                cursor: adding ? 'not-allowed' : 'pointer',
              }}
            >
              {adding ? '...' : 'Add'}
            </button>
          </div>
        )}
        {addStatus && (
          <p style={{ marginTop: '0.5rem', color: '#94a3b8', fontSize: '0.82rem' }}>{addStatus}</p>
        )}
      </div>

      {profile.professionalSummary && (
        <div style={cardStyle}>
          <h2 style={{ margin: '0 0 0.6rem', color: '#f1f5f9', fontSize: '1.05rem' }}>Summary</h2>
          <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.88rem', whiteSpace: 'pre-wrap' }}>
            {profile.professionalSummary}
          </p>
        </div>
      )}

      {profile.skills.length > 0 && (
        <div style={cardStyle}>
          <h2 style={{ margin: '0 0 0.6rem', color: '#f1f5f9', fontSize: '1.05rem' }}>Skills</h2>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {profile.skills.map((s) => (
              <span
                key={s.id}
                style={{
                  padding: '0.2rem 0.6rem',
                  background: 'rgba(37,99,235,0.15)',
                  color: '#93c5fd',
                  borderRadius: '9999px',
                  fontSize: '0.8rem',
                }}
              >
                {s.name} · {s.level}
              </span>
            ))}
          </div>
        </div>
      )}

      {profile.experience.length > 0 && (
        <div style={cardStyle}>
          <h2 style={{ margin: '0 0 0.6rem', color: '#f1f5f9', fontSize: '1.05rem' }}>
            Experience
          </h2>
          {profile.experience.map((exp) => (
            <div key={exp.id} style={{ marginBottom: '0.75rem' }}>
              <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.88rem' }}>
                {exp.jobTitle} · {exp.companyName}
              </div>
              <div style={{ color: '#64748b', fontSize: '0.78rem' }}>
                {exp.startDate} – {exp.currentlyWorking ? 'Present' : (exp.endDate ?? '—')}
              </div>
            </div>
          ))}
        </div>
      )}

      {profile.education.length > 0 && (
        <div style={cardStyle}>
          <h2 style={{ margin: '0 0 0.6rem', color: '#f1f5f9', fontSize: '1.05rem' }}>Education</h2>
          {profile.education.map((ed) => (
            <div key={ed.id} style={{ marginBottom: '0.75rem' }}>
              <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.88rem' }}>
                {ed.qualification} · {ed.institutionName}
              </div>
              {ed.fieldOfStudy && (
                <div style={{ color: '#64748b', fontSize: '0.78rem' }}>{ed.fieldOfStudy}</div>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={cardStyle}>
        <h2 style={{ margin: '0 0 0.6rem', color: '#f1f5f9', fontSize: '1.05rem' }}>Public CV</h2>
        {publicCvs.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
            This candidate hasn&apos;t made a CV public.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {publicCvs.map((cv) => (
              <div
                key={cv.id}
                style={{
                  padding: '0.5rem 0.7rem',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '0.4rem',
                  fontSize: '0.85rem',
                  color: '#e2e8f0',
                }}
              >
                {cv.title} · {cv.template.replace('_', ' ')} · {cv.completionScore}% complete
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
