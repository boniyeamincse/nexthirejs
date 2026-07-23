'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/auth-context';
import { getAdminPendingVerifications, getAdminVerifiedAccounts, verifyAdminUser, rejectAdminVerification } from '@/lib/api-client';
import dashboardStyles from '@/app/(authenticated)/dashboard/dashboard.module.css';

export default function AdminUserVerificationPage() {
  const { getAccessToken } = useAuth();
  const [loadingPending, setLoadingPending] = useState(true);
  const [loadingVerified, setLoadingVerified] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pending, setPending] = useState<any[]>([]);
  const [verified, setVerified] = useState<any[]>([]);
  const [pendingPage, setPendingPage] = useState(1);
  const [verifiedPage, setVerifiedPage] = useState(1);
  const [pendingPagination, setPendingPagination] = useState<any>(null);
  const [verifiedPagination, setVerifiedPagination] = useState<any>(null);

  async function loadPending() {
    const token = getAccessToken();
    if (!token) return;
    setLoadingPending(true);
    try {
      const data = await getAdminPendingVerifications(token, String(pendingPage), '20');
      setPending(data.verifications || data.pending || data.users || []);
      setPendingPagination(data.pagination);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingPending(false);
    }
  }

  async function loadVerified() {
    const token = getAccessToken();
    if (!token) return;
    setLoadingVerified(true);
    try {
      const data = await getAdminVerifiedAccounts(token, String(verifiedPage), '20');
      setVerified(data.verifications || data.verified || data.users || []);
      setVerifiedPagination(data.pagination);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingVerified(false);
    }
  }

  useEffect(() => { loadPending(); }, [pendingPage]);
  useEffect(() => { loadVerified(); }, [verifiedPage]);

  async function handleVerify(id: string) {
    const token = getAccessToken();
    if (!token) return;
    setError('');
    setSuccess('');
    try {
      await verifyAdminUser(token, id);
      setSuccess('User verified successfully');
      loadPending();
      loadVerified();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleReject(id: string) {
    const token = getAccessToken();
    if (!token) return;
    setError('');
    setSuccess('');
    try {
      await rejectAdminVerification(token, id);
      setSuccess('Verification rejected');
      loadPending();
      loadVerified();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className={dashboardStyles.page}>
      <div className={dashboardStyles.bgGlow} />
      <div className={dashboardStyles.container}>
        <div className={dashboardStyles.hero}>
          <h1 className={dashboardStyles.greeting}>Account Verification</h1>
          <p className={dashboardStyles.statsText}>Manage email and identity verification for user accounts.</p>
        </div>

        {error && <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}
        {success && <div style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>{success}</div>}

        <div className={dashboardStyles.card} style={{ marginBottom: '2rem' }}>
          <div className={dashboardStyles.cardHeader}>
            <h2 className={dashboardStyles.cardTitle}>Pending Verifications</h2>
          </div>
          <div style={{ padding: '1.5rem', overflowX: 'auto' }}>
            {loadingPending ? <p style={{ color: '#94a3b8' }}>Loading pending verifications...</p> : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Email</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Name</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Requested</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map((u: any) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '0.75rem', color: '#f8fafc' }}>{u.email || u.user?.email}</td>
                      <td style={{ padding: '0.75rem', color: '#94a3b8' }}>{u.fullName || u.full_name || u.user?.fullName || '-'}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{ color: '#fbbf24' }}>{u.status || 'PENDING'}</span>
                      </td>
                      <td style={{ padding: '0.75rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                        {new Date(u.createdAt || u.requestedAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => handleVerify(u.id)} className={dashboardStyles.retryBtn}
                            style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem', background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)' }}>
                            Verify
                          </button>
                          <button onClick={() => handleReject(u.id)} className={dashboardStyles.retryBtn}
                            style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pending.length === 0 && <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No pending verifications</td></tr>}
                </tbody>
              </table>
            )}
          </div>
          {pendingPagination && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', padding: '0 1.5rem 1.5rem', alignItems: 'center' }}>
              <button onClick={() => setPendingPage(p => Math.max(1, p - 1))} disabled={pendingPage <= 1}
                className={dashboardStyles.retryBtn} style={{ opacity: pendingPage <= 1 ? 0.5 : 1 }}>Previous</button>
              <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Page {pendingPagination.page} of {pendingPagination.totalPages}</span>
              <button onClick={() => setPendingPage(p => p + 1)} disabled={pendingPage >= pendingPagination.totalPages}
                className={dashboardStyles.retryBtn} style={{ opacity: pendingPage >= pendingPagination.totalPages ? 0.5 : 1 }}>Next</button>
            </div>
          )}
        </div>

        <div className={dashboardStyles.card}>
          <div className={dashboardStyles.cardHeader}>
            <h2 className={dashboardStyles.cardTitle}>Verified Accounts</h2>
          </div>
          <div style={{ padding: '1.5rem', overflowX: 'auto' }}>
            {loadingVerified ? <p style={{ color: '#94a3b8' }}>Loading verified accounts...</p> : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Email</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Name</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Verified At</th>
                  </tr>
                </thead>
                <tbody>
                  {verified.map((u: any) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '0.75rem', color: '#4ade80' }}>{u.email || u.user?.email}</td>
                      <td style={{ padding: '0.75rem', color: '#f8fafc' }}>{u.fullName || u.full_name || u.user?.fullName || '-'}</td>
                      <td style={{ padding: '0.75rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                        {new Date(u.verifiedAt || u.emailVerifiedAt || u.updatedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {verified.length === 0 && <tr><td colSpan={3} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No verified accounts</td></tr>}
                </tbody>
              </table>
            )}
          </div>
          {verifiedPagination && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', padding: '0 1.5rem 1.5rem', alignItems: 'center' }}>
              <button onClick={() => setVerifiedPage(p => Math.max(1, p - 1))} disabled={verifiedPage <= 1}
                className={dashboardStyles.retryBtn} style={{ opacity: verifiedPage <= 1 ? 0.5 : 1 }}>Previous</button>
              <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Page {verifiedPagination.page} of {verifiedPagination.totalPages}</span>
              <button onClick={() => setVerifiedPage(p => p + 1)} disabled={verifiedPage >= verifiedPagination.totalPages}
                className={dashboardStyles.retryBtn} style={{ opacity: verifiedPage >= verifiedPagination.totalPages ? 0.5 : 1 }}>Next</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
