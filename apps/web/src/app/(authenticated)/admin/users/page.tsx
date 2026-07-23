'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/auth-context';
import { getAdminUsers, updateAdminUserStatus, deleteAdminUser, forceAdminUserLogout } from '@/lib/api-client';
import dashboardStyles from '@/app/(authenticated)/dashboard/dashboard.module.css';
import Link from 'next/link';

export default function AdminUsersPage() {
  const { getAccessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [actionMsg, setActionMsg] = useState('');

  async function loadUsers() {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;
      const data = await getAdminUsers(token, params);
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadUsers(); }, [page, roleFilter, statusFilter]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    loadUsers();
  }

  async function handleAction(userId: string, action: string) {
    const token = getAccessToken();
    if (!token) return;
    try {
      if (action === 'suspend') await updateAdminUserStatus(token, userId, 'suspended', 'Admin action');
      else if (action === 'activate') await updateAdminUserStatus(token, userId, 'active');
      else if (action === 'logout') await forceAdminUserLogout(token, userId);
      else if (action === 'delete') await deleteAdminUser(token, userId);
      setActionMsg(`User ${action} successful`);
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
          <h1 className={dashboardStyles.greeting}>User Management</h1>
          <p className={dashboardStyles.statsText}>Manage all platform users, roles, and account statuses.</p>
        </div>

        {error && <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}
        {actionMsg && <div style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>{actionMsg}</div>}

        <div className={dashboardStyles.card} style={{ marginBottom: '2rem' }}>
          <div style={{ padding: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ flex: 1, padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#f8fafc', fontSize: '0.9rem' }}
              />
              <button type="submit" className={dashboardStyles.retryBtn}>Search</button>
            </form>
            <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#f8fafc' }}>
              <option value="">All Roles</option>
              <option value="candidate">Candidate</option>
              <option value="expert">Expert</option>
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin</option>
            </select>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#f8fafc' }}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="pending_verification">Pending</option>
            </select>
          </div>
        </div>

        <div className={dashboardStyles.card}>
          <div style={{ padding: '1.5rem', overflowX: 'auto' }}>
            {loading ? <p style={{ color: '#94a3b8' }}>Loading users...</p> : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Email</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Name</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Roles</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Verified</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Joined</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u: any) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '0.75rem' }}>
                        <Link href={`/admin/users/${u.id}`} style={{ color: '#a5b4fc', textDecoration: 'none' }}>{u.email}</Link>
                      </td>
                      <td style={{ padding: '0.75rem', color: '#f8fafc' }}>{u.fullName || '-'}</td>
                      <td style={{ padding: '0.75rem' }}>
                        {u.roles.map((r: string) => (
                          <span key={r} style={{ display: 'inline-block', padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', fontSize: '0.75rem', marginRight: '0.25rem' }}>{r}</span>
                        ))}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{ color: u.status === 'ACTIVE' ? '#4ade80' : u.status === 'SUSPENDED' ? '#ef4444' : '#fbbf24' }}>{u.status}</span>
                      </td>
                      <td style={{ padding: '0.75rem', color: u.emailVerified ? '#4ade80' : '#ef4444' }}>{u.emailVerified ? 'Yes' : 'No'}</td>
                      <td style={{ padding: '0.75rem', color: '#94a3b8', fontSize: '0.85rem' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <Link href={`/admin/users/${u.id}`} className={dashboardStyles.retryBtn} style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}>View</Link>
                          {u.status === 'ACTIVE' && <button onClick={() => handleAction(u.id, 'suspend')} className={dashboardStyles.retryBtn} style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>Suspend</button>}
                          {u.status === 'SUSPENDED' && <button onClick={() => handleAction(u.id, 'activate')} className={dashboardStyles.retryBtn} style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem', background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)' }}>Activate</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No users found</td></tr>}
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
