'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/auth-context';
import { getAdminRoles, createAdminRole, deleteAdminRole } from '@/lib/api-client';
import dashboardStyles from '@/app/(authenticated)/dashboard/dashboard.module.css';

export default function AdminRolesPage() {
  const { getAccessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [roles, setRoles] = useState<any[]>([]);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  async function loadRoles() {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    try {
      const data = await getAdminRoles(token);
      setRoles(data.roles || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadRoles(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) return;
    setError('');
    setSuccess('');
    try {
      await createAdminRole(token, { code, name, description });
      setSuccess(`Role "${code}" created successfully`);
      setCode('');
      setName('');
      setDescription('');
      loadRoles();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this role?')) return;
    const token = getAccessToken();
    if (!token) return;
    setError('');
    setSuccess('');
    try {
      await deleteAdminRole(token, id);
      setSuccess('Role deleted successfully');
      loadRoles();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className={dashboardStyles.page}>
      <div className={dashboardStyles.bgGlow} />
      <div className={dashboardStyles.container}>
        <div className={dashboardStyles.hero}>
          <h1 className={dashboardStyles.greeting}>Roles & Permissions</h1>
          <p className={dashboardStyles.statsText}>Manage platform roles and their metadata.</p>
        </div>

        {error && <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}
        {success && <div style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>{success}</div>}

        <div className={dashboardStyles.card} style={{ marginBottom: '2rem' }}>
          <div className={dashboardStyles.cardHeader}>
            <h2 className={dashboardStyles.cardTitle}>Create New Role</h2>
          </div>
          <form onSubmit={handleCreate} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <input
                type="text" placeholder="Role code (e.g. moderator)" value={code}
                onChange={(e) => setCode(e.target.value)} required
                style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#f8fafc' }}
              />
              <input
                type="text" placeholder="Role name (e.g. Moderator)" value={name}
                onChange={(e) => setName(e.target.value)} required
                style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#f8fafc' }}
              />
            </div>
            <input
              type="text" placeholder="Description (optional)" value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#f8fafc' }}
            />
            <button type="submit" className={dashboardStyles.retryBtn} style={{ alignSelf: 'flex-start' }}>Create Role</button>
          </form>
        </div>

        <div className={dashboardStyles.card}>
          <div className={dashboardStyles.cardHeader}>
            <h2 className={dashboardStyles.cardTitle}>Existing Roles</h2>
          </div>
          <div style={{ padding: '1.5rem', overflowX: 'auto' }}>
            {loading ? <p style={{ color: '#94a3b8' }}>Loading roles...</p> : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Code</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Name</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Description</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Users</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>System</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((r: any) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '0.75rem', color: '#a5b4fc', fontFamily: 'monospace' }}>{r.code}</td>
                      <td style={{ padding: '0.75rem', color: '#f8fafc' }}>{r.name}</td>
                      <td style={{ padding: '0.75rem', color: '#94a3b8' }}>{r.description || '-'}</td>
                      <td style={{ padding: '0.75rem', color: '#f8fafc' }}>{r.userCount ?? 0}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{ color: r.isSystem ? '#fbbf24' : '#64748b' }}>{r.isSystem ? 'Yes' : 'No'}</span>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        {!r.isSystem && (
                          <button onClick={() => handleDelete(r.id)} className={dashboardStyles.retryBtn}
                            style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {roles.length === 0 && <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No roles found</td></tr>}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
