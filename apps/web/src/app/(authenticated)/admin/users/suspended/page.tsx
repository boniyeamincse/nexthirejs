'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/auth-context';
import { getAdminSuspendedUsers, activateAdminSuspendedUser } from '@/lib/api-client';
import dashboardStyles from '@/app/(authenticated)/dashboard/dashboard.module.css';
import Link from 'next/link';

export default function AdminSuspendedUsersPage() {
  const { getAccessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [page, setPage] = useState(1);

  async function loadUsers() {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    try {
      const data = await getAdminSuspendedUsers(token, String(page), '20');
      setUsers(data.users || data.suspended || []);
      setPagination(data.pagination);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadUsers(); }, [page]);

  async function handleActivate(id: string) {
    const token = getAccessToken();
    if (!token) return;
    setError('');
    setSuccess('');
    try {
      await activateAdminSuspendedUser(token, id);
      setSuccess('User activated successfully');
      loadUsers();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className={dashboardStyles.page}>
      <div className={dashboardStyles.bgGlow} />
      <div className={dashboardStyles.container}>
        <div className={dashboardStyles.hero}>
          <h1 className={dashboardStyles.greeting}>Suspended Accounts</h1>
          <p className={dashboardStyles.statsText}>View and manage suspended user accounts.</p>
        </div>

        {error && <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}
        {success && <div style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>{success}</div>}

        <div className={dashboardStyles.card}>
          <div style={{ padding: '1.5rem', overflowX: 'auto' }}>
            {loading ? <p style={{ color: '#94a3b8' }}>Loading suspended users...</p> : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Email</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Name</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Suspension Reason</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Suspended At</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u: any) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '0.75rem' }}>
                        <Link href={`/admin/users/${u.id}`} style={{ color: '#a5b4fc', textDecoration: 'none' }}>{u.email}</Link>
                      </td>
                      <td style={{ padding: '0.75rem', color: '#f8fafc' }}>{u.fullName || u.full_name || '-'}</td>
                      <td style={{ padding: '0.75rem', color: '#94a3b8' }}>{u.suspensionReason || u.suspension_reason || '-'}</td>
                      <td style={{ padding: '0.75rem', color: '#94a3b8', fontSize: '0.85rem' }}>{new Date(u.suspendedAt || u.suspended_at || u.updatedAt).toLocaleDateString()}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <button onClick={() => handleActivate(u.id)} className={dashboardStyles.retryBtn}
                          style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem', background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)' }}>
                          Activate
                        </button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No suspended users</td></tr>}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {pagination && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem', alignItems: 'center' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              className={dashboardStyles.retryBtn} style={{ opacity: page <= 1 ? 0.5 : 1 }}>Previous</button>
            <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Page {pagination.page} of {pagination.totalPages} ({pagination.total} users)</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= pagination.totalPages}
              className={dashboardStyles.retryBtn} style={{ opacity: page >= pagination.totalPages ? 0.5 : 1 }}>Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
