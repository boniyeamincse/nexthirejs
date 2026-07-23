'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/auth-context';
import { getAdminExpertVerificationPending, approveAdminExpertVerification, rejectAdminExpertVerification } from '@/lib/api-client';
import dashboardStyles from '@/app/(authenticated)/dashboard/dashboard.module.css';
import Link from 'next/link';

export default function AdminExpertVerificationPage() {
  const { getAccessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [applications, setApplications] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [page, setPage] = useState(1);

  async function loadApplications() {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    try {
      const data = await getAdminExpertVerificationPending(token, String(page), '20');
      setApplications(data.applications || data.verifications || data.pending || []);
      setPagination(data.pagination);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadApplications(); }, [page]);

  async function handleApprove(id: string) {
    const token = getAccessToken();
    if (!token) return;
    setError('');
    setSuccess('');
    try {
      await approveAdminExpertVerification(token, id);
      setSuccess('Application approved successfully');
      loadApplications();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleReject(id: string) {
    const reason = prompt('Enter rejection reason (optional):');
    const token = getAccessToken();
    if (!token) return;
    setError('');
    setSuccess('');
    try {
      await rejectAdminExpertVerification(token, id, reason || undefined);
      setSuccess('Application rejected');
      loadApplications();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className={dashboardStyles.page}>
      <div className={dashboardStyles.bgGlow} />
      <div className={dashboardStyles.container}>
        <div className={dashboardStyles.hero}>
          <h1 className={dashboardStyles.greeting}>Expert Verification Queue</h1>
          <p className={dashboardStyles.statsText}>Review and approve/reject expert verification applications.</p>
        </div>

        {error && <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}
        {success && <div style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>{success}</div>}

        <div className={dashboardStyles.card}>
          <div style={{ padding: '1.5rem', overflowX: 'auto' }}>
            {loading ? <p style={{ color: '#94a3b8' }}>Loading applications...</p> : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Email</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Professional Title</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Submitted</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((a: any) => (
                    <tr key={a.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '0.75rem', color: '#f8fafc' }}>{a.user?.email || a.email}</td>
                      <td style={{ padding: '0.75rem', color: '#94a3b8' }}>{a.professionalTitle || a.professional_title || a.user?.professionalTitle || '-'}</td>
                      <td style={{ padding: '0.75rem', color: '#94a3b8', fontSize: '0.85rem' }}>{new Date(a.createdAt || a.submittedAt).toLocaleDateString()}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <Link href={`/admin/experts/verification/${a.id}`} className={dashboardStyles.retryBtn} style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem', textDecoration: 'none' }}>View Detail</Link>
                          <button onClick={() => handleApprove(a.id)} className={dashboardStyles.retryBtn}
                            style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem', background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)' }}>
                            Approve
                          </button>
                          <button onClick={() => handleReject(a.id)} className={dashboardStyles.retryBtn}
                            style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {applications.length === 0 && <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No pending verification applications</td></tr>}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {pagination && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem', alignItems: 'center' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              className={dashboardStyles.retryBtn} style={{ opacity: page <= 1 ? 0.5 : 1 }}>Previous</button>
            <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Page {pagination.page} of {pagination.totalPages} ({pagination.total} applications)</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= pagination.totalPages}
              className={dashboardStyles.retryBtn} style={{ opacity: page >= pagination.totalPages ? 0.5 : 1 }}>Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
