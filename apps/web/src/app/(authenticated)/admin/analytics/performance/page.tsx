'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/auth-context';
import {
  getAdminPerformanceApi,
  getAdminPerformanceQueue,
  getAdminPerformanceErrors,
  getAdminPerformanceSystem,
  getAdminPerformanceDatabase,
  getAdminPerformanceUptime,
} from '@/lib/api-client';
import dashboardStyles from '@/app/(authenticated)/dashboard/dashboard.module.css';
import Link from 'next/link';

export default function PerformanceAnalyticsPage() {
  const { getAccessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [apiData, setApiData] = useState<any>(null);
  const [queueData, setQueueData] = useState<any>(null);
  const [errorsData, setErrorsData] = useState<any>(null);
  const [systemData, setSystemData] = useState<any>(null);
  const [dbData, setDbData] = useState<any>(null);
  const [uptimeData, setUptimeData] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      const token = getAccessToken();
      if (!token) return;
      try {
        const [api, queue, errors, system, db, uptime] = await Promise.all([
          getAdminPerformanceApi(token),
          getAdminPerformanceQueue(token),
          getAdminPerformanceErrors(token),
          getAdminPerformanceSystem(token),
          getAdminPerformanceDatabase(token),
          getAdminPerformanceUptime(token),
        ]);
        setApiData(api);
        setQueueData(queue);
        setErrorsData(errors);
        setSystemData(system);
        setDbData(db);
        setUptimeData(uptime);
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to load performance data');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [getAccessToken]);

  const formatMs = (v: number) => `${v.toFixed(1)}ms`;
  const formatPct = (v: number) => `${(v * 100).toFixed(1)}%`;
  const formatBytes = (v: number) => {
    if (v > 1073741824) return `${(v / 1073741824).toFixed(1)} GB`;
    if (v > 1048576) return `${(v / 1048576).toFixed(1)} MB`;
    if (v > 1024) return `${(v / 1024).toFixed(1)} KB`;
    return `${v} B`;
  };

  return (
    <div className={dashboardStyles.page}>
      <div className={dashboardStyles.bgGlow}></div>
      <div className={dashboardStyles.container}>
        <div className={dashboardStyles.hero}>
          <Link href="/admin" style={{ display: 'inline-block', marginBottom: '1rem', color: '#a5b4fc', textDecoration: 'none', fontSize: '0.9rem' }}>
            ← Back to Dashboard
          </Link>
          <h1 className={dashboardStyles.greeting}>Performance Monitoring</h1>
          <p className={dashboardStyles.statsText}>
            API response times, queue status, error rates, system resources, DB performance, and uptime.
          </p>
        </div>

        {errorMsg && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '1rem', borderRadius: '8px', marginBottom: '2rem' }}>
            {errorMsg}
          </div>
        )}

        {loading ? (
          <div className={dashboardStyles.card} style={{ padding: '3rem', textAlign: 'center' }}>
            <p style={{ color: '#94a3b8' }}>Loading performance data...</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
            <div className={dashboardStyles.card}>
              <div className={dashboardStyles.cardHeader}>
                <h2 className={dashboardStyles.cardTitle}>API Response Times</h2>
              </div>
              <div style={{ padding: '0.5rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {apiData?.endpoints?.map((ep: any, i: number) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
                    <span style={{ color: '#cbd5e1', fontFamily: 'monospace', fontSize: '0.85rem' }}>{ep.route}</span>
                    <span style={{ color: ep.avgMs < 200 ? '#4ade80' : ep.avgMs < 500 ? '#fbbf24' : '#ef4444', fontWeight: 600 }}>{formatMs(ep.avgMs)}</span>
                  </div>
                ))}
                {apiData?.overallAvgMs != null && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <span style={{ color: '#94a3b8', fontWeight: 600 }}>Overall Average</span>
                    <span style={{ color: '#f8fafc', fontWeight: 700, fontSize: '1.1rem' }}>{formatMs(apiData.overallAvgMs)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className={dashboardStyles.card}>
              <div className={dashboardStyles.cardHeader}>
                <h2 className={dashboardStyles.cardTitle}>Queue Processing</h2>
              </div>
              <div style={{ padding: '0.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Pending</span>
                  <span style={{ color: '#fbbf24', fontWeight: 600 }}>{queueData?.pending ?? '-'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Processing</span>
                  <span style={{ color: '#a5b4fc', fontWeight: 600 }}>{queueData?.processing ?? '-'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Completed (24h)</span>
                  <span style={{ color: '#4ade80', fontWeight: 600 }}>{queueData?.completed24h ?? '-'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Failed (24h)</span>
                  <span style={{ color: '#ef4444', fontWeight: 600 }}>{queueData?.failed24h ?? '-'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.75rem' }}>
                  <span style={{ color: '#94a3b8' }}>Avg Wait Time</span>
                  <span style={{ color: '#f8fafc', fontWeight: 600 }}>{queueData?.avgWaitMs ? formatMs(queueData.avgWaitMs) : '-'}</span>
                </div>
              </div>
            </div>

            <div className={dashboardStyles.card}>
              <div className={dashboardStyles.cardHeader}>
                <h2 className={dashboardStyles.cardTitle}>Error Rates</h2>
              </div>
              <div style={{ padding: '0.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>4xx Rate</span>
                  <span style={{ color: errorsData?.rate4xx < 0.05 ? '#4ade80' : '#fbbf24', fontWeight: 600 }}>{errorsData?.rate4xx != null ? formatPct(errorsData.rate4xx) : '-'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>5xx Rate</span>
                  <span style={{ color: errorsData?.rate5xx < 0.01 ? '#4ade80' : '#ef4444', fontWeight: 600 }}>{errorsData?.rate5xx != null ? formatPct(errorsData.rate5xx) : '-'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Total Errors (24h)</span>
                  <span style={{ color: '#ef4444', fontWeight: 600 }}>{errorsData?.totalErrors24h ?? '-'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Error Rate Change</span>
                  <span style={{ color: (errorsData?.changePct ?? 0) > 0 ? '#ef4444' : '#4ade80', fontWeight: 600 }}>
                    {errorsData?.changePct != null ? `${errorsData.changePct > 0 ? '+' : ''}${(errorsData.changePct * 100).toFixed(1)}%` : '-'}
                  </span>
                </div>
              </div>
            </div>

            <div className={dashboardStyles.card}>
              <div className={dashboardStyles.cardHeader}>
                <h2 className={dashboardStyles.cardTitle}>System Resources</h2>
              </div>
              <div style={{ padding: '0.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>CPU Usage</span>
                  <span style={{ color: (systemData?.cpuPct ?? 0) < 70 ? '#4ade80' : '#ef4444', fontWeight: 600 }}>
                    {systemData?.cpuPct != null ? `${systemData.cpuPct.toFixed(1)}%` : '-'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Memory Usage</span>
                  <span style={{ color: (systemData?.memoryPct ?? 0) < 80 ? '#4ade80' : '#ef4444', fontWeight: 600 }}>
                    {systemData?.memoryPct != null ? `${systemData.memoryPct.toFixed(1)}%` : '-'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Memory Used</span>
                  <span style={{ color: '#f8fafc', fontWeight: 600 }}>{systemData?.memoryUsed != null ? formatBytes(systemData.memoryUsed) : '-'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Memory Total</span>
                  <span style={{ color: '#f8fafc', fontWeight: 600 }}>{systemData?.memoryTotal != null ? formatBytes(systemData.memoryTotal) : '-'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Node Version</span>
                  <span style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: '0.85rem' }}>{systemData?.nodeVersion ?? '-'}</span>
                </div>
              </div>
            </div>

            <div className={dashboardStyles.card}>
              <div className={dashboardStyles.cardHeader}>
                <h2 className={dashboardStyles.cardTitle}>Database Performance</h2>
              </div>
              <div style={{ padding: '0.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Query Avg Time</span>
                  <span style={{ color: (dbData?.avgQueryMs ?? 0) < 100 ? '#4ade80' : '#fbbf24', fontWeight: 600 }}>{dbData?.avgQueryMs ? formatMs(dbData.avgQueryMs) : '-'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Connection Pool</span>
                  <span style={{ color: '#f8fafc', fontWeight: 600 }}>{dbData?.activeConnections != null ? `${dbData.activeConnections}/${dbData?.maxConnections ?? '?'}` : '-'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Pool Utilization</span>
                  <span style={{ color: (dbData?.poolUtilization ?? 0) < 0.8 ? '#4ade80' : '#ef4444', fontWeight: 600 }}>
                    {dbData?.poolUtilization != null ? formatPct(dbData.poolUtilization) : '-'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Slow Queries (>{'>'}1s)</span>
                  <span style={{ color: (dbData?.slowQueries ?? 0) > 0 ? '#ef4444' : '#4ade80', fontWeight: 600 }}>{dbData?.slowQueries ?? '-'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>DB Size</span>
                  <span style={{ color: '#f8fafc', fontWeight: 600 }}>{dbData?.sizeBytes ? formatBytes(dbData.sizeBytes) : '-'}</span>
                </div>
              </div>
            </div>

            <div className={dashboardStyles.card}>
              <div className={dashboardStyles.cardHeader}>
                <h2 className={dashboardStyles.cardTitle}>Service Uptime</h2>
              </div>
              <div style={{ padding: '0.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#94a3b8' }}>API Uptime (30d)</span>
                  <span style={{ color: (uptimeData?.apiUptimePct ?? 100) >= 99.9 ? '#4ade80' : '#ef4444', fontWeight: 600 }}>
                    {uptimeData?.apiUptimePct != null ? `${uptimeData.apiUptimePct.toFixed(2)}%` : '-'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Current Incidents</span>
                  <span style={{ color: (uptimeData?.currentIncidents ?? 0) > 0 ? '#ef4444' : '#4ade80', fontWeight: 600 }}>{uptimeData?.currentIncidents ?? 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Last Incident</span>
                  <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{uptimeData?.lastIncident ? new Date(uptimeData.lastIncident).toLocaleString() : 'None'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Avg Response (P99)</span>
                  <span style={{ color: '#fbbf24', fontWeight: 600 }}>{uptimeData?.p99Ms ? formatMs(uptimeData.p99Ms) : '-'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Avg Response (P95)</span>
                  <span style={{ color: '#fbbf24', fontWeight: 600 }}>{uptimeData?.p95Ms ? formatMs(uptimeData.p95Ms) : '-'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.75rem' }}>
                  <span style={{ color: '#94a3b8' }}>Status</span>
                  <span style={{ color: uptimeData?.status === 'healthy' ? '#4ade80' : '#ef4444', fontWeight: 600, textTransform: 'capitalize' }}>
                    {uptimeData?.status ?? '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
