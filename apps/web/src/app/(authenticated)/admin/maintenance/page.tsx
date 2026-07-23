'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/auth-context';
import { getAdminMaintenanceStatus, getAdminMaintenanceHealth, toggleAdminMaintenanceMode } from '@/lib/api-client';
import dashboardStyles from '@/app/(authenticated)/dashboard/dashboard.module.css';

type Tab = 'status' | 'health' | 'history';

export default function AdminMaintenancePage() {
  const { getAccessToken } = useAuth();
  const [tab, setTab] = useState<Tab>('status');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [modeMsg, setModeMsg] = useState('');
  const [toggling, setToggling] = useState(false);

  const token = getAccessToken();

  async function loadStatus() {
    if (!token) return;
    setLoading(true);
    try {
      const data = await getAdminMaintenanceStatus(token);
      setStatus(data);
      setModeMsg(data.maintenanceMessage || '');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadHealth() {
    if (!token) return;
    setLoading(true);
    try {
      const data = await getAdminMaintenanceHealth(token);
      setHealth(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (tab === 'status') loadStatus();
    else if (tab === 'health') loadHealth();
    else loadStatus();
  }, [tab]);

  async function handleToggle() {
    if (!token) return;
    setToggling(true);
    try {
      const data = await toggleAdminMaintenanceMode(token, !status.maintenanceMode, modeMsg);
      setStatus((prev: any) => ({ ...prev, ...data }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setToggling(false);
    }
  }

  const formatBytes = (b: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    let v = b;
    while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
    return `${v.toFixed(1)} ${units[i]}`;
  };

  return (
    <div className={dashboardStyles.page}>
      <div className={dashboardStyles.bgGlow} />
      <div className={dashboardStyles.container}>
        <div className={dashboardStyles.hero}>
          <h1 className={dashboardStyles.greeting}>System Maintenance</h1>
          <p className={dashboardStyles.statsText}>Monitor system health, control maintenance mode, and view status.</p>
        </div>

        {error && <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {(['status', 'health'] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              style={{
                padding: '0.5rem 1.25rem', borderRadius: '6px', border: 'none', cursor: 'pointer',
                background: tab === t ? '#6366f1' : 'rgba(255,255,255,0.05)', color: tab === t ? '#fff' : '#94a3b8',
                fontSize: '0.85rem', fontWeight: tab === t ? 600 : 400,
              }}>
              {t === 'status' ? 'System Status' : 'Health Checks'}
            </button>
          ))}
        </div>

        {loading && <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>Loading...</p>}

        {!loading && tab === 'status' && status && (
          <>
            <div className={dashboardStyles.card} style={{ marginBottom: '1.5rem' }}>
              <div className={dashboardStyles.cardHeader}>
                <h2 className={dashboardStyles.cardTitle}>Maintenance Mode</h2>
              </div>
              <div style={{ padding: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '250px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: status.maintenanceMode ? '#f59e0b' : '#4ade80' }} />
                    <span style={{ color: '#f8fafc', fontWeight: 600 }}>
                      {status.maintenanceMode ? 'Maintenance Mode Active' : 'Maintenance Mode Disabled'}
                    </span>
                  </div>
                  <input type="text" value={modeMsg} onChange={(e) => setModeMsg(e.target.value)}
                    placeholder="Maintenance message..."
                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#f8fafc', fontSize: '0.85rem', marginBottom: '0.75rem' }} />
                  <button onClick={handleToggle} disabled={toggling} className={dashboardStyles.retryBtn}
                    style={{ opacity: toggling ? 0.6 : 1, fontSize: '0.85rem' }}>
                    {toggling ? 'Toggling...' : status.maintenanceMode ? 'Disable Maintenance Mode' : 'Enable Maintenance Mode'}
                  </button>
                </div>
              </div>
            </div>

            <div className={dashboardStyles.card} style={{ marginBottom: '1.5rem' }}>
              <div className={dashboardStyles.cardHeader}>
                <h2 className={dashboardStyles.cardTitle}>Service Status</h2>
              </div>
              <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                {status.services?.map((svc: any, i: number) => {
                  const ok = svc.status === 'operational';
                  return (
                    <div key={i} style={{ padding: '1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${ok ? 'rgba(74,222,128,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: ok ? '#4ade80' : '#ef4444' }} />
                        <span style={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.9rem' }}>{svc.name}</span>
                      </div>
                      <p style={{ color: ok ? '#4ade80' : '#ef4444', fontSize: '0.85rem', margin: 0 }}>{svc.status}</p>
                      {svc.details && <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '0.25rem 0 0' }}>{svc.details}</p>}
                      {svc.uptime && <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '0.25rem 0 0' }}>Uptime: {Math.floor(svc.uptime / 60)}m {svc.uptime % 60}s</p>}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={dashboardStyles.card}>
              <div className={dashboardStyles.cardHeader}>
                <h2 className={dashboardStyles.cardTitle}>System Resources</h2>
              </div>
              <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                {[
                  { label: 'Platform', value: status.system?.platform },
                  { label: 'Node Version', value: status.system?.nodeVersion },
                  { label: 'CPU Model', value: status.system?.cpuModel },
                  { label: 'CPU Cores', value: status.system?.cpuCores },
                  { label: 'Load Average', value: status.system?.loadAverage?.map((v: number) => v.toFixed(2)).join(', ') },
                  { label: 'Total Memory', value: formatBytes(status.system?.memory?.total || 0) },
                  { label: 'Free Memory', value: formatBytes(status.system?.memory?.free || 0) },
                  { label: 'Used Memory', value: formatBytes(status.system?.memory?.used || 0) },
                  { label: 'Heap Used', value: formatBytes(status.system?.memory?.heapUsed || 0) },
                  { label: 'RSS', value: formatBytes(status.system?.memory?.rss || 0) },
                  { label: 'System Uptime', value: `${Math.floor((status.system?.uptime || 0) / 3600)}h ${Math.floor(((status.system?.uptime || 0) % 3600) / 60)}m` },
                  { label: 'Process Uptime', value: `${Math.floor((status.services?.[0]?.uptime || 0) / 60)}m` },
                ].map((item, i) => (
                  <div key={i} style={{ padding: '0.75rem', borderRadius: '6px', background: 'rgba(255,255,255,0.02)' }}>
                    <p style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', margin: '0 0 0.25rem' }}>{item.label}</p>
                    <p style={{ color: '#f8fafc', fontSize: '0.9rem', fontFamily: 'monospace', margin: 0 }}>{item.value || '-'}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {!loading && tab === 'health' && health && (
          <>
            <div className={dashboardStyles.card} style={{ marginBottom: '1.5rem' }}>
              <div className={dashboardStyles.cardHeader}>
                <h2 className={dashboardStyles.cardTitle}>Overall Health</h2>
              </div>
              <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
                  padding: '1rem 2rem', borderRadius: '12px',
                  background: health.overall === 'healthy' ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)',
                }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: health.overall === 'healthy' ? '#4ade80' : '#ef4444' }} />
                  <span style={{ color: health.overall === 'healthy' ? '#4ade80' : '#ef4444', fontSize: '1.25rem', fontWeight: 600, textTransform: 'capitalize' }}>
                    {health.overall}
                  </span>
                </div>
              </div>
            </div>

            <div className={dashboardStyles.card}>
              <div className={dashboardStyles.cardHeader}>
                <h2 className={dashboardStyles.cardTitle}>Service Checks</h2>
              </div>
              <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {health.checks?.map((check: any, i: number) => {
                  const ok = check.status === 'healthy';
                  return (
                    <div key={i} style={{ padding: '1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${ok ? 'rgba(74,222,128,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: ok ? '#4ade80' : '#ef4444' }} />
                        <span style={{ color: '#f8fafc', fontWeight: 600 }}>{check.name}</span>
                      </div>
                      {check.latency !== undefined && check.latency !== null && (
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.25rem 0' }}>Latency: {check.latency}ms</p>
                      )}
                      {check.memoryUsage !== undefined && (
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.25rem 0' }}>Memory Usage: {check.memoryUsage}%</p>
                      )}
                      {check.cpuLoad !== undefined && (
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.25rem 0' }}>CPU Load: {check.cpuLoad.toFixed(2)}</p>
                      )}
                      {check.memoryFree !== undefined && (
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.25rem 0' }}>Free Memory: {formatBytes(check.memoryFree)} / {formatBytes(check.memoryTotal)}</p>
                      )}
                      <p style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                        Last checked: {new Date(check.lastChecked).toLocaleTimeString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
