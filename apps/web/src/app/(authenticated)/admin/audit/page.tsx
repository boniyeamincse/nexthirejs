'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/providers/auth-context';
import { getAdminLogs, getAdminAuditStats, getAdminAuditActionTypes, getAdminAuditExport } from '@/lib/api-client';
import dashboardStyles from '@/app/(authenticated)/dashboard/dashboard.module.css';
import Link from 'next/link';

export default function AdminAuditPage() {
  const { getAccessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [actionTypes, setActionTypes] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterActorType, setFilterActorType] = useState('');
  const [filterOutcome, setFilterOutcome] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const exportRef = useRef<HTMLAnchorElement>(null);

  const token = getAccessToken();

  async function loadData() {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const [logsData, statsData, typesData] = await Promise.all([
        getAdminLogs(token, {
          page: String(page), limit: '50', search,
          ...(filterAction ? { action: filterAction } : {}),
          ...(filterActorType ? { actorType: filterActorType } : {}),
          ...(filterOutcome ? { outcome: filterOutcome } : {}),
          ...(startDate ? { startDate } : {}),
          ...(endDate ? { endDate } : {}),
        }),
        getAdminAuditStats(token),
        getAdminAuditActionTypes(token),
      ]);
      setLogs(logsData.logs || []);
      setPagination(logsData.pagination);
      setStats(statsData);
      setActionTypes(typesData.actionTypes || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, [page]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    loadData();
  }

  async function handleExport() {
    if (!token) return;
    setExporting(true);
    try {
      const data = await getAdminAuditExport(token, {
        ...(filterAction ? { action: filterAction } : {}),
        ...(filterActorType ? { actorType: filterActorType } : {}),
        ...(filterOutcome ? { outcome: filterOutcome } : {}),
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {}),
      });
      const blob = new Blob([data.csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `audit-export-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setExporting(false);
    }
  }

  const outcomeColor = (o: string) => {
    switch (o) {
      case 'FAILURE': return '#ef4444';
      case 'DENIED': return '#f59e0b';
      default: return '#4ade80';
    }
  };

  if (selectedLog) {
    return (
      <div className={dashboardStyles.page}>
        <div className={dashboardStyles.bgGlow} />
        <div className={dashboardStyles.container}>
          <button onClick={() => setSelectedLog(null)} className={dashboardStyles.retryBtn} style={{ marginBottom: '1rem' }}>← Back to Audit Log</button>
          <div className={dashboardStyles.card}>
            <div className={dashboardStyles.cardHeader}><h2 className={dashboardStyles.cardTitle}>Audit Entry Detail</h2></div>
            <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {Object.entries(selectedLog).map(([key, val]) => (
                <div key={key}>
                  <label style={{ color: '#64748b', fontSize: '0.8rem', textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1')}</label>
                  <p style={{ color: '#f8fafc', margin: '0.25rem 0', wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    {val instanceof Date ? val.toLocaleString() : String(val ?? '-')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={dashboardStyles.page}>
      <div className={dashboardStyles.bgGlow} />
      <div className={dashboardStyles.container}>
        <div className={dashboardStyles.hero}>
          <Link href="/admin" style={{ display: 'inline-block', marginBottom: '1rem', color: '#a5b4fc', textDecoration: 'none', fontSize: '0.9rem' }}>← Back to Dashboard</Link>
          <h1 className={dashboardStyles.greeting}>Audit Logs</h1>
          <p className={dashboardStyles.statsText}>Review and search all administrative actions and system events.</p>
        </div>

        {error && <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}

        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Total Events', value: stats.total, color: '#a5b4fc' },
              { label: 'Last 24h', value: stats.last24h, color: '#4ade80' },
              { label: 'Failures (24h)', value: stats.failures, color: '#ef4444' },
            ].map((s, i) => (
              <div key={i} className={dashboardStyles.card}>
                <div style={{ padding: '1rem', textAlign: 'center' }}>
                  <p style={{ color: s.color, fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.15rem' }}>{s.value}</p>
                  <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: 0 }}>{s.label}</p>
                </div>
              </div>
            ))}
            <div className={dashboardStyles.card}>
              <button onClick={handleExport} disabled={exporting}
                style={{
                  width: '100%', height: '100%', padding: '1rem', border: 'none', borderRadius: '12px',
                  background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', cursor: 'pointer',
                  fontSize: '0.85rem', fontWeight: 600, opacity: exporting ? 0.6 : 1,
                }}>
                {exporting ? 'Exporting...' : '⬇ Export CSV'}
              </button>
            </div>
          </div>
        )}

        <div className={dashboardStyles.card} style={{ marginBottom: '1.5rem' }}>
          <div style={{ padding: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'end' }}>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', flex: '1 1 100%' }}>
              <input type="text" placeholder="Search action, target, request ID..." value={search} onChange={(e) => setSearch(e.target.value)}
                style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#f8fafc', fontSize: '0.85rem' }} />
              <button type="submit" className={dashboardStyles.retryBtn} style={{ fontSize: '0.85rem', padding: '0.4rem 1rem' }}>Search</button>
            </form>
            <select value={filterAction} onChange={(e) => { setFilterAction(e.target.value); setPage(1); }}
              style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#f8fafc', fontSize: '0.85rem', minWidth: '180px' }}>
              <option value="">All Actions</option>
              {actionTypes.map((a: any) => (
                <option key={a.action} value={a.action}>{a.action} ({a.count})</option>
              ))}
            </select>
            <select value={filterActorType} onChange={(e) => { setFilterActorType(e.target.value); setPage(1); }}
              style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#f8fafc', fontSize: '0.85rem' }}>
              <option value="">All Actors</option>
              <option value="USER">User</option>
              <option value="SYSTEM">System</option>
              <option value="ANONYMOUS">Anonymous</option>
              <option value="INTERNAL">Internal</option>
            </select>
            <select value={filterOutcome} onChange={(e) => { setFilterOutcome(e.target.value); setPage(1); }}
              style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#f8fafc', fontSize: '0.85rem' }}>
              <option value="">All Outcomes</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILURE">Failure</option>
              <option value="DENIED">Denied</option>
            </select>
            <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#f8fafc', fontSize: '0.85rem' }} />
            <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#f8fafc', fontSize: '0.85rem' }} />
          </div>
        </div>

        <div className={dashboardStyles.card}>
          <div style={{ padding: '1rem', overflowX: 'auto' }}>
            {loading ? (
              <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>Loading audit logs...</p>
            ) : logs.length === 0 ? (
              <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>No audit logs match your filters.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>Timestamp</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>Outcome</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>Action</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>Actor</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>Target</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>Request ID</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log: any) => (
                    <tr key={log.id} onClick={() => setSelectedLog(log)} style={{ cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.1s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}>
                      <td style={{ padding: '0.5rem', color: '#94a3b8', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>{new Date(log.occurredAt).toLocaleString()}</td>
                      <td style={{ padding: '0.5rem' }}>
                        <span style={{ color: outcomeColor(log.outcome), fontWeight: 600 }}>{log.outcome}</span>
                      </td>
                      <td style={{ padding: '0.5rem', color: '#f8fafc', fontFamily: 'monospace', fontSize: '0.8rem' }}>{log.action}</td>
                      <td style={{ padding: '0.5rem', color: '#a5b4fc', fontSize: '0.8rem' }}>
                        {log.actorType}{log.actorUserId ? ` (${log.actorUserId.slice(0, 8)}...)` : ''}
                      </td>
                      <td style={{ padding: '0.5rem', color: '#94a3b8', fontSize: '0.8rem' }}>
                        {log.targetType ? `${log.targetType}${log.targetId ? `:${log.targetId.slice(0, 8)}` : ''}` : '-'}
                      </td>
                      <td style={{ padding: '0.5rem', color: '#64748b', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {log.requestId?.slice(0, 12) || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem', alignItems: 'center' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              className={dashboardStyles.retryBtn} style={{ opacity: page <= 1 ? 0.5 : 1 }}>Previous</button>
            <span style={{ color: '#94a3b8' }}>Page {pagination.page} of {pagination.totalPages} ({pagination.total} entries)</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= pagination.totalPages}
              className={dashboardStyles.retryBtn} style={{ opacity: page >= pagination.totalPages ? 0.5 : 1 }}>Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
