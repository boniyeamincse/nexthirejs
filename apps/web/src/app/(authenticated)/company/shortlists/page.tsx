'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-context';
import { ApiClientError, listTalentShortlists, createTalentShortlist } from '@/lib/api-client';
import type { TalentShortlistSummary } from '@nexthire/types';

const cardStyle: React.CSSProperties = {
  display: 'block',
  padding: '0.9rem 1rem',
  background: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '0.6rem',
  marginBottom: '0.6rem',
  textDecoration: 'none',
};

const inputStyle: React.CSSProperties = {
  padding: '0.5rem 0.7rem',
  background: '#0f172a',
  border: '1px solid #334155',
  borderRadius: '0.4rem',
  color: '#e2e8f0',
  fontSize: '0.88rem',
};

export default function CompanyShortlistsPage() {
  const { getAccessToken, logout, status: authStatus } = useAuth();

  const [shortlists, setShortlists] = useState<TalentShortlistSummary[]>([]);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
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
      const rows = await listTalentShortlists(token);
      setShortlists(rows);
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
      setPageError('Failed to load shortlists. Please try again.');
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

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const token = getAccessToken();
    if (!token || !name.trim()) return;
    setCreating(true);
    setPageError(null);
    try {
      await createTalentShortlist(token, { name: name.trim() });
      setName('');
      await load();
    } catch (err) {
      setPageError(err instanceof ApiClientError ? err.message : 'Failed to create shortlist.');
    } finally {
      setCreating(false);
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
          Shortlists are only available to verified companies.
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
          Talent Shortlists
        </h1>
        <Link href="/company/candidates" style={{ color: '#93c5fd', fontSize: '0.85rem' }}>
          Candidate search →
        </Link>
      </div>

      {pageError && (
        <p role="alert" style={{ color: '#fca5a5', marginBottom: '1rem' }}>
          {pageError}
        </p>
      )}

      <form
        onSubmit={handleCreate}
        style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}
      >
        <input
          type="text"
          placeholder="New shortlist name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ ...inputStyle, flex: '1 1 auto' }}
        />
        <button
          type="submit"
          disabled={creating || !name.trim()}
          style={{
            padding: '0.5rem 1rem',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '0.4rem',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: creating || !name.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          {creating ? '...' : 'Create'}
        </button>
      </form>

      {shortlists.length === 0 ? (
        <p style={{ color: '#64748b' }}>No shortlists yet — create one above.</p>
      ) : (
        shortlists.map((s) => (
          <Link key={s.id} href={`/company/shortlists/${s.id}`} style={cardStyle}>
            <div style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '0.95rem' }}>{s.name}</div>
            <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.2rem' }}>
              {s.memberCount} candidate{s.memberCount === 1 ? '' : 's'}
            </div>
          </Link>
        ))
      )}
    </div>
  );
}
