'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/auth-context';
import { getAdminSecurityOverview, getAdminSecuritySuspicious, getAdminSecuritySessions, getAdminSecurityPolicies } from '@/lib/api-client';
import dashboardStyles from '@/app/(authenticated)/dashboard/dashboard.module.css';
import Link from 'next/link';

type Tab = 'overview' | 'activity' | 'sessions' | 'policies';

export default function AdminSecurityPage() {
  const { getAccessToken } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [overview, setOverview] = useState<any>(null);
  const [suspicious, setSuspicious] = useState<any>(null);
  const [sessions, setSessions] = useState<any>(null);
  const [policies, setPolicies] = useState<any>(null);

  const token = getAccessToken();

  async function loadOverview() {
    if (!token) return; setLoading(true);
    try { setOverview(await getAdminSecurityOverview(token)); }
    catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function loadSuspicious() {
    if (!token) return; setLoading(true);
    try { setSuspicious(await getAdminSecuritySuspicious(token)); }
    catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function loadSessions() {
    if (!token) return; setLoading(true);
    try { setSessions(await getAdminSecuritySessions(token)); }
    catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function loadPolicies() {
    if (!token) return; setLoading(true);
    try { setPolicies(await getAdminSecurityPolicies(token)); }
    catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (tab === 'overview') loadOverview();
    else if (tab === 'activity') loadSuspicious();
    else if (tab === 'sessions') loadSessions();
    else loadPolicies();
  }, [tab]);

  return (
    <div className={dashboardStyles.page}>
      <div className={dashboardStyles.bgGlow} />
      <div className={dashboardStyles.container}>
        <div className={dashboardStyles.hero}>
          <Link href="/admin" style={{ display: 'inline-block', marginBottom: '1rem', color: '#a5b4fc', textDecoration: 'none', fontSize: '0.9rem' }}>← Back to Dashboard</Link>
          <h1 className={dashboardStyles.greeting}>Security Overview</h1>
          <p className={dashboardStyles.statsText}>Monitor platform security, suspicious activity, and access controls.</p>
        </div>

        {error && <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {([
            { key: 'overview', label: 'Overview' },
            { key: 'activity', label: 'Suspicious Activity' },
            { key: 'sessions', label: 'Active Sessions' },
            { key: 'policies', label: 'Security Policies' },
          ] as const).map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)}
              style={{
                padding: '0.5rem 1.25rem', borderRadius: '6px', border: 'none', cursor: 'pointer',
                background: tab === key ? '#6366f1' : 'rgba(255,255,255,0.05)', color: tab === key ? '#fff' : '#94a3b8',
                fontSize: '0.85rem', fontWeight: tab === key ? 600 : 400,
              }}>{label}</button>
          ))}
        </div>

        {loading && <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>Loading...</p>}

        {!loading && tab === 'overview' && overview && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              {[
                { label: 'Failed Logins (24h)', value: overview.summary.failedLogins24h, color: '#ef4444' },
                { label: 'Denied Actions (24h)', value: overview.summary.deniedActions24h, color: '#f59e0b' },
                { label: 'Active Sessions', value: overview.summary.activeSessions, color: '#4ade80' },
                { label: 'Events (7d)', value: overview.summary.totalEvents7d, color: '#a5b4fc' },
                { label: 'Unique Actors (7d)', value: overview.summary.uniqueActors7d, color: '#f472b6' },
              ].map((stat, i) => (
                <div key={i} className={dashboardStyles.card}>
                  <div style={{ padding: '1.25rem', textAlign: 'center' }}>
                    <p style={{ color: stat.color, fontSize: '2rem', fontWeight: 700, margin: '0 0 0.25rem' }}>{stat.value}</p>
                    <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {overview.dailyStats?.length > 0 && (
              <div className={dashboardStyles.card}>
                <div className={dashboardStyles.cardHeader}><h2 className={dashboardStyles.cardTitle}>Daily Security Events (7d)</h2></div>
                <div style={{ padding: '1rem', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>Date</th>
                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>Failures</th>
                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>Denied</th>
                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overview.dailyStats.map((d: any, i: number) => (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '0.5rem', color: '#f8fafc' }}>{d.date}</td>
                          <td style={{ padding: '0.5rem', color: '#ef4444' }}>{d.failures}</td>
                          <td style={{ padding: '0.5rem', color: '#f59e0b' }}>{d.denied}</td>
                          <td style={{ padding: '0.5rem', color: '#94a3b8' }}>{d.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {overview.recentEvents?.length > 0 && (
              <div className={dashboardStyles.card} style={{ marginTop: '1.5rem' }}>
                <div className={dashboardStyles.cardHeader}><h2 className={dashboardStyles.cardTitle}>Recent Security Events</h2></div>
                <div style={{ padding: '1rem', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>Time</th>
                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>Action</th>
                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>Outcome</th>
                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>Actor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overview.recentEvents.map((e: any, i: number) => (
                        <tr key={e.id || i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '0.5rem', color: '#94a3b8', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>{new Date(e.occurredAt).toLocaleString()}</td>
                          <td style={{ padding: '0.5rem', color: '#f8fafc', fontFamily: 'monospace', fontSize: '0.8rem' }}>{e.action}</td>
                          <td style={{ padding: '0.5rem' }}>
                            <span style={{ color: e.outcome === 'FAILURE' ? '#ef4444' : '#f59e0b', fontWeight: 600 }}>{e.outcome}</span>
                          </td>
                          <td style={{ padding: '0.5rem', color: '#a5b4fc', fontSize: '0.8rem' }}>{e.actorUserId?.slice(0, 12) || e.actorType || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {!loading && tab === 'activity' && suspicious && (
          <>
            {suspicious.suspiciousIps?.length > 0 && (
              <div className={dashboardStyles.card} style={{ marginBottom: '1.5rem' }}>
                <div className={dashboardStyles.cardHeader}><h2 className={dashboardStyles.cardTitle}>Suspicious IPs (3+ failed attempts)</h2></div>
                <div style={{ padding: '1rem', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>IP Address</th>
                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>Failed Attempts</th>
                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>Last Seen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {suspicious.suspiciousIps.map((ip: any, i: number) => (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '0.5rem', color: '#f8fafc', fontFamily: 'monospace' }}>{ip.ip}</td>
                          <td style={{ padding: '0.5rem', color: '#ef4444', fontWeight: 600 }}>{ip.attempts}</td>
                          <td style={{ padding: '0.5rem', color: '#94a3b8', fontSize: '0.8rem' }}>{new Date(ip.lastSeen).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className={dashboardStyles.card}>
              <div className={dashboardStyles.cardHeader}><h2 className={dashboardStyles.cardTitle}>Recent Failed Login Attempts (48h)</h2></div>
              <div style={{ padding: '1rem', overflowX: 'auto' }}>
                {suspicious.events?.length === 0 ? (
                  <p style={{ color: '#64748b', textAlign: 'center', padding: '1rem' }}>No failed login attempts in the last 48 hours.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>Time</th>
                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>Action</th>
                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>Actor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {suspicious.events.map((e: any, i: number) => (
                        <tr key={e.id || i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '0.5rem', color: '#94a3b8', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>{new Date(e.occurredAt).toLocaleString()}</td>
                          <td style={{ padding: '0.5rem', color: '#f8fafc', fontFamily: 'monospace', fontSize: '0.8rem' }}>{e.action}</td>
                          <td style={{ padding: '0.5rem', color: '#a5b4fc', fontSize: '0.8rem' }}>{e.actorUserId?.slice(0, 12) || e.actorType || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}

        {!loading && tab === 'sessions' && sessions && (
          <div className={dashboardStyles.card}>
            <div className={dashboardStyles.cardHeader}><h2 className={dashboardStyles.cardTitle}>Active Sessions ({sessions.pagination?.total || 0})</h2></div>
            <div style={{ padding: '1rem', overflowX: 'auto' }}>
              {sessions.sessions?.length === 0 ? (
                <p style={{ color: '#64748b', textAlign: 'center', padding: '1rem' }}>No active sessions.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>User</th>
                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>Created</th>
                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>Expires</th>
                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.sessions.map((s: any) => (
                      <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '0.5rem', color: '#f8fafc' }}>{s.user?.email || s.userId?.slice(0, 12)}</td>
                        <td style={{ padding: '0.5rem', color: '#94a3b8', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{new Date(s.createdAt).toLocaleString()}</td>
                        <td style={{ padding: '0.5rem', color: '#94a3b8', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{new Date(s.expiresAt).toLocaleString()}</td>
                        <td style={{ padding: '0.5rem' }}>
                          <span style={{ color: '#4ade80', fontWeight: 600 }}>{s.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {sessions.pagination?.totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
                  <span style={{ color: '#64748b' }}>Page {sessions.pagination.page} of {sessions.pagination.totalPages}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {!loading && tab === 'policies' && policies && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {[
              { title: 'Password Policy', data: policies.password },
              { title: 'Session Policy', data: policies.session },
              { title: 'Login Policy', data: policies.login },
              { title: '2FA Policy', data: policies.twoFactor },
            ].map((section, i) => (
              <div key={i} className={dashboardStyles.card}>
                <div className={dashboardStyles.cardHeader}><h2 className={dashboardStyles.cardTitle}>{section.title}</h2></div>
                <div style={{ padding: '1rem' }}>
                  {Object.entries(section.data || {}).map(([key, val]) => (
                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <span style={{ color: '#94a3b8', fontSize: '0.85rem', textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span style={{ color: '#f8fafc', fontSize: '0.85rem', fontFamily: 'monospace' }}>{typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
