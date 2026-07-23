'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/auth-context';
import { getAdminCandidates } from '@/lib/api-client';
import dashboardStyles from '@/app/(authenticated)/dashboard/dashboard.module.css';
import Link from 'next/link';

export default function AdminCandidatesPage() {
  const { getAccessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [candidates, setCandidates] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  async function loadCandidates() {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (search) params.search = search;
      const data = await getAdminCandidates(token, params);
      setCandidates(data.candidates || data.users || []);
      setPagination(data.pagination);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadCandidates(); }, [page]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    loadCandidates();
  }

  return (
    <div className={dashboardStyles.page}>
      <div className={dashboardStyles.bgGlow} />
      <div className={dashboardStyles.container}>
        <div className={dashboardStyles.hero}>
          <h1 className={dashboardStyles.greeting}>All Candidates</h1>
          <p className={dashboardStyles.statsText}>Browse and manage candidate profiles.</p>
        </div>

        {error && <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}

        <div className={dashboardStyles.card} style={{ marginBottom: '2rem' }}>
          <div style={{ padding: '1.5rem' }}>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text" placeholder="Search by name or email..." value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ flex: 1, padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#f8fafc', fontSize: '0.9rem' }}
              />
              <button type="submit" className={dashboardStyles.retryBtn}>Search</button>
            </form>
          </div>
        </div>

        <div className={dashboardStyles.card}>
          <div style={{ padding: '1.5rem', overflowX: 'auto' }}>
            {loading ? <p style={{ color: '#94a3b8' }}>Loading candidates...</p> : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Email</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Full Name</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Headline</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Completion</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Created</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((c: any) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '0.75rem' }}>
                        <Link href={`/admin/candidates/${c.id}`} style={{ color: '#a5b4fc', textDecoration: 'none' }}>{c.email}</Link>
                      </td>
                      <td style={{ padding: '0.75rem', color: '#f8fafc' }}>{c.fullName || c.full_name || '-'}</td>
                      <td style={{ padding: '0.75rem', color: '#94a3b8', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.professionalHeadline || '-'}</td>
                      <td style={{ padding: '0.75rem', color: '#f8fafc' }}>{c.completionPercentage ?? c.completion_percentage ?? 0}%</td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{ color: c.status === 'ACTIVE' ? '#4ade80' : c.status === 'PENDING_VERIFICATION' ? '#fbbf24' : '#ef4444' }}>{c.status}</span>
                      </td>
                      <td style={{ padding: '0.75rem', color: '#94a3b8', fontSize: '0.85rem' }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <Link href={`/admin/candidates/${c.id}`} className={dashboardStyles.retryBtn} style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem', textDecoration: 'none' }}>View</Link>
                      </td>
                    </tr>
                  ))}
                  {candidates.length === 0 && <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No candidates found</td></tr>}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {pagination && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem', alignItems: 'center' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              className={dashboardStyles.retryBtn} style={{ opacity: page <= 1 ? 0.5 : 1 }}>Previous</button>
            <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Page {pagination.page} of {pagination.totalPages} ({pagination.total} candidates)</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= pagination.totalPages}
              className={dashboardStyles.retryBtn} style={{ opacity: page >= pagination.totalPages ? 0.5 : 1 }}>Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
