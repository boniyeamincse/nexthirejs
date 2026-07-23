'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/auth-context';
import { getAdminUser, updateAdminUserStatus, deleteAdminUser, forceAdminUserLogout, assignAdminUserRole, removeAdminUserRole, getAdminRoles } from '@/lib/api-client';
import dashboardStyles from '@/app/(authenticated)/dashboard/dashboard.module.css';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function AdminUserDetailPage() {
  const { getAccessToken } = useAuth();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [roles, setRoles] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState('');

  async function loadUser() {
    const token = getAccessToken();
    if (!token) return;
    try {
      const [userData, rolesData] = await Promise.all([
        getAdminUser(token, id),
        getAdminRoles(token),
      ]);
      setUser(userData);
      setRoles(rolesData.roles || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadUser(); }, [id]);

  async function handleAction(action: string) {
    const token = getAccessToken();
    if (!token) return;
    try {
      if (action === 'suspend') await updateAdminUserStatus(token, id, 'suspended', 'Admin action');
      else if (action === 'activate') await updateAdminUserStatus(token, id, 'active');
      else if (action === 'logout') await forceAdminUserLogout(token, id);
      else if (action === 'delete') await deleteAdminUser(token, id);
      loadUser();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleAssignRole() {
    if (!selectedRole) return;
    const token = getAccessToken();
    if (!token) return;
    try {
      await assignAdminUserRole(token, id, selectedRole);
      setSelectedRole('');
      loadUser();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleRemoveRole(roleId: string) {
    const token = getAccessToken();
    if (!token) return;
    try {
      await removeAdminUserRole(token, id, roleId);
      loadUser();
    } catch (err: any) {
      setError(err.message);
    }
  }

  if (loading) return <div className={dashboardStyles.page}><div className={dashboardStyles.bgGlow} /><div className={dashboardStyles.container}><p style={{ color: '#94a3b8' }}>Loading user...</p></div></div>;

  if (!user) return <div className={dashboardStyles.page}><div className={dashboardStyles.bgGlow} /><div className={dashboardStyles.container}><p style={{ color: '#ef4444' }}>User not found</p></div></div>;

  return (
    <div className={dashboardStyles.page}>
      <div className={dashboardStyles.bgGlow} />
      <div className={dashboardStyles.container}>
        <div className={dashboardStyles.hero}>
          <Link href="/admin/users" style={{ color: '#a5b4fc', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-block', marginBottom: '0.5rem' }}>← Back to Users</Link>
          <h1 className={dashboardStyles.greeting}>{user.email}</h1>
          <p className={dashboardStyles.statsText}>User detail and account management.</p>
        </div>

        {error && <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          <div>
            <div className={dashboardStyles.card} style={{ marginBottom: '2rem' }}>
              <div className={dashboardStyles.cardHeader}><h2 className={dashboardStyles.cardTitle}>Account Information</h2></div>
              <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div><label style={{ color: '#64748b', fontSize: '0.8rem' }}>Email</label><p style={{ color: '#f8fafc', margin: '0.25rem 0' }}>{user.email}</p></div>
                <div><label style={{ color: '#64748b', fontSize: '0.8rem' }}>Phone</label><p style={{ color: '#f8fafc', margin: '0.25rem 0' }}>{user.phone || '-'}</p></div>
                <div><label style={{ color: '#64748b', fontSize: '0.8rem' }}>Status</label><p style={{ color: user.status === 'ACTIVE' ? '#4ade80' : '#ef4444', margin: '0.25rem 0' }}>{user.status}</p></div>
                <div><label style={{ color: '#64748b', fontSize: '0.8rem' }}>Email Verified</label><p style={{ color: user.emailVerifiedAt ? '#4ade80' : '#ef4444', margin: '0.25rem 0' }}>{user.emailVerifiedAt ? new Date(user.emailVerifiedAt).toLocaleDateString() : 'No'}</p></div>
                <div><label style={{ color: '#64748b', fontSize: '0.8rem' }}>Created</label><p style={{ color: '#94a3b8', margin: '0.25rem 0' }}>{new Date(user.createdAt).toLocaleDateString()}</p></div>
                <div><label style={{ color: '#64748b', fontSize: '0.8rem' }}>Updated</label><p style={{ color: '#94a3b8', margin: '0.25rem 0' }}>{new Date(user.updatedAt).toLocaleDateString()}</p></div>
              </div>
            </div>

            <div className={dashboardStyles.card}>
              <div className={dashboardStyles.cardHeader}><h2 className={dashboardStyles.cardTitle}>Role Assignment</h2></div>
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  {user.roles?.map((roleCode: string) => (
                    <span key={roleCode} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0.75rem', borderRadius: '6px', background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', fontSize: '0.85rem' }}>
                      {roleCode}
                      <button onClick={() => handleRemoveRole(roleCode)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem' }}>×</button>
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}
                    style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#f8fafc' }}>
                    <option value="">Select a role</option>
                    {roles.filter((r: any) => !user.roles?.includes(r.code)).map((r: any) => (
                      <option key={r.id} value={r.code}>{r.name} ({r.code})</option>
                    ))}
                  </select>
                  <button onClick={handleAssignRole} className={dashboardStyles.retryBtn}>Assign</button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className={dashboardStyles.card} style={{ marginBottom: '2rem' }}>
              <div className={dashboardStyles.cardHeader}><h2 className={dashboardStyles.cardTitle}>Actions</h2></div>
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {user.status === 'ACTIVE' && <button onClick={() => handleAction('suspend')} className={dashboardStyles.retryBtn} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', width: '100%' }}>Suspend User</button>}
                {user.status === 'SUSPENDED' && <button onClick={() => handleAction('activate')} className={dashboardStyles.retryBtn} style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)', width: '100%' }}>Activate User</button>}
                <button onClick={() => handleAction('logout')} className={dashboardStyles.retryBtn} style={{ width: '100%' }}>Force Logout</button>
                <button onClick={() => { if (confirm('Are you sure you want to delete this user?')) handleAction('delete'); }} className={dashboardStyles.retryBtn} style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', width: '100%' }}>Delete User</button>
              </div>
            </div>

            {user.recentSessions?.length > 0 && (
              <div className={dashboardStyles.card}>
                <div className={dashboardStyles.cardHeader}><h2 className={dashboardStyles.cardTitle}>Recent Sessions</h2></div>
                <div style={{ padding: '1.5rem' }}>
                  {user.recentSessions.map((s: any) => (
                    <div key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0.5rem 0' }}>
                      <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>{s.ipAddress || 'Unknown IP'} - {s.userAgent?.substring(0, 50) || 'Unknown'}</p>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '0.75rem' }}>{s.status} - {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : ''}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
