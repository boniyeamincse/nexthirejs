'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-context';
import { ApiClientError, searchCompanyCandidates } from '@/lib/api-client';
import type { CompanyCandidateSearchResultCard } from '@nexthire/types';

const cardStyle: React.CSSProperties = {
  padding: '0.9rem 1rem',
  background: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '0.6rem',
  marginBottom: '0.6rem',
};

const inputStyle: React.CSSProperties = {
  padding: '0.5rem 0.7rem',
  background: '#0f172a',
  border: '1px solid #334155',
  borderRadius: '0.4rem',
  color: '#e2e8f0',
  fontSize: '0.88rem',
};

export default function CompanyCandidateSearchPage() {
  const { getAccessToken, logout, status: authStatus } = useAuth();

  const [rows, setRows] = useState<CompanyCandidateSearchResultCard[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedSkill, setAppliedSkill] = useState('');
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [notVerified, setNotVerified] = useState(false);

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setPageError(null);
    setNotVerified(false);
    try {
      const result = await searchCompanyCandidates(token, {
        page,
        pageSize: 20,
        search: appliedSearch || undefined,
        skill: appliedSkill || undefined,
      });
      setRows(result.data);
      setTotalPages(result.pagination.totalPages);
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
      setPageError('Failed to search candidates. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, logout, page, appliedSearch, appliedSkill]);

  useEffect(() => {
    if (authStatus === 'authenticated') {
      void load();
    } else if (authStatus === 'unauthenticated') {
      setLoading(false);
    }
  }, [authStatus, load]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setAppliedSearch(searchInput);
    setAppliedSkill(skillInput);
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
          Candidate search is only available to verified companies.
        </p>
        <p style={{ marginTop: '0.75rem' }}>
          <Link href="/become-a-company" style={{ color: '#93c5fd' }}>
            Check your verification status
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 style={{ color: '#f1f5f9', fontSize: '1.6rem', fontWeight: 700, margin: '0 0 1rem' }}>
        Candidate Search
      </h1>

      {pageError && (
        <p role="alert" style={{ color: '#fca5a5', marginBottom: '1rem' }}>
          {pageError}
        </p>
      )}

      <form
        onSubmit={handleSearchSubmit}
        style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}
      >
        <input
          type="text"
          placeholder="Search name or headline"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{ ...inputStyle, flex: '1 1 220px' }}
        />
        <input
          type="text"
          placeholder="Skill (e.g. TypeScript)"
          value={skillInput}
          onChange={(e) => setSkillInput(e.target.value)}
          style={{ ...inputStyle, flex: '1 1 180px' }}
        />
        <button
          type="submit"
          style={{
            padding: '0.5rem 1rem',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '0.4rem',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Search
        </button>
      </form>

      {rows.length === 0 ? (
        <p style={{ color: '#64748b' }}>No discoverable candidates match your search.</p>
      ) : (
        rows.map((row) => (
          <Link
            key={row.candidateUserId}
            href={`/company/candidates/${row.candidateUserId}`}
            style={{ display: 'block', textDecoration: 'none' }}
          >
            <div style={cardStyle}>
              <div style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '0.95rem' }}>
                {row.displayName}
              </div>
              {row.professionalHeadline && (
                <div style={{ color: '#93c5fd', fontSize: '0.85rem', marginTop: '0.15rem' }}>
                  {row.professionalHeadline}
                </div>
              )}
              {row.location && (row.location.city || row.location.countryName) && (
                <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                  {[row.location.city, row.location.countryName].filter(Boolean).join(', ')}
                </div>
              )}
              {row.topSkills.length > 0 && (
                <div
                  style={{ marginTop: '0.4rem', display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}
                >
                  {row.topSkills.map((s) => (
                    <span
                      key={s}
                      style={{
                        padding: '0.15rem 0.5rem',
                        background: 'rgba(37,99,235,0.15)',
                        color: '#93c5fd',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Link>
        ))
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', alignItems: 'center' }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            style={{ padding: '0.3rem 0.7rem', cursor: page <= 1 ? 'not-allowed' : 'pointer' }}
          >
            Prev
          </button>
          <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            style={{
              padding: '0.3rem 0.7rem',
              cursor: page >= totalPages ? 'not-allowed' : 'pointer',
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
