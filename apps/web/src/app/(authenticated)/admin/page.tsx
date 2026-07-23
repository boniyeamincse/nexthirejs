'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/auth-context';
import {
  getAdminStats,
  getAdminActivity,
  getAdminAlerts,
} from '@/lib/api-client';
import dashboardStyles from '@/app/(authenticated)/dashboard/dashboard.module.css';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const { getAccessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [stats, setStats] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    async function loadAdminData() {
      const token = getAccessToken();
      if (!token) return;
      try {
        const [statsData, activityData, alertsData] = await Promise.all([
          getAdminStats(token),
          getAdminActivity(token),
          getAdminAlerts(token),
        ]);

        setStats(statsData);
        setActivity(activityData.recentActivity);
        setAlerts(alertsData.alerts);
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to load admin dashboard');
      } finally {
        setLoading(false);
      }
    }
    loadAdminData();
  }, [getAccessToken]);

  if (loading) {
    return (
      <div className={dashboardStyles.page}>
        <div className={dashboardStyles.bgGlow}></div>
        <div className={dashboardStyles.container}>
          <div className={dashboardStyles.card} style={{ textAlign: 'center', padding: '4rem' }}>
            <p className={dashboardStyles.cardTitle}>Loading Admin Dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={dashboardStyles.page}>
      <div className={dashboardStyles.bgGlow}></div>
      <div className={dashboardStyles.container}>
        <div className={dashboardStyles.hero}>
          <h1 className={dashboardStyles.greeting}>SuperAdmin Dashboard</h1>
          <p className={dashboardStyles.statsText}>
            Platform Overview: KPI metrics and activity.
          </p>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <Link
              href="/admin/analytics/growth"
              className={dashboardStyles.retryBtn}
              style={{ textDecoration: 'none' }}
            >
              Growth Analytics →
            </Link>
            <Link
              href="/admin/analytics/revenue"
              className={dashboardStyles.retryBtn}
              style={{ textDecoration: 'none', background: 'rgba(74, 222, 128, 0.1)', color: '#4ade80', border: '1px solid rgba(74, 222, 128, 0.3)' }}
            >
              Revenue Analytics →
            </Link>
          </div>
        </div>

        {errorMsg && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '2rem',
            }}
          >
            {errorMsg}
          </div>
        )}

        {stats && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem',
            }}
          >
            <div className={dashboardStyles.card} style={{ padding: '1.5rem' }}>
              <h3
                className={dashboardStyles.cardTitle}
                style={{ fontSize: '0.9rem', color: '#94a3b8' }}
              >
                Total Users
              </h3>
              <p
                style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: '#f8fafc',
                  margin: '0.5rem 0',
                }}
              >
                {stats.totalUsers}
              </p>
            </div>
            <div className={dashboardStyles.card} style={{ padding: '1.5rem' }}>
              <h3
                className={dashboardStyles.cardTitle}
                style={{ fontSize: '0.9rem', color: '#94a3b8' }}
              >
                Active Users (30d)
              </h3>
              <p
                style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: '#f8fafc',
                  margin: '0.5rem 0',
                }}
              >
                {stats.activeUsers}
              </p>
            </div>
            <div className={dashboardStyles.card} style={{ padding: '1.5rem' }}>
              <h3
                className={dashboardStyles.cardTitle}
                style={{ fontSize: '0.9rem', color: '#94a3b8' }}
              >
                Total Revenue (30d)
              </h3>
              <p
                style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: '#4ade80',
                  margin: '0.5rem 0',
                }}
              >
                ${stats.totalRevenue}
              </p>
            </div>
            <div className={dashboardStyles.card} style={{ padding: '1.5rem' }}>
              <h3
                className={dashboardStyles.cardTitle}
                style={{ fontSize: '0.9rem', color: '#94a3b8' }}
              >
                Pending Verifications
              </h3>
              <p
                style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: stats.pendingVerifications > 0 ? '#fbbf24' : '#f8fafc',
                  margin: '0.5rem 0',
                }}
              >
                {stats.pendingVerifications}
              </p>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div className={dashboardStyles.card}>
            <div className={dashboardStyles.cardHeader}>
              <h2 className={dashboardStyles.cardTitle}>Recent Activity</h2>
            </div>
            <div
              style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              {activity.map((act) => (
                <div
                  key={act.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    paddingBottom: '0.75rem',
                  }}
                >
                  <div>
                    <p style={{ margin: 0, color: '#f8fafc', fontWeight: 500 }}>{act.type}</p>
                    <p
                      style={{
                        margin: 0,
                        color: '#94a3b8',
                        fontSize: '0.85rem',
                        marginTop: '0.25rem',
                      }}
                    >
                      {act.description}
                    </p>
                  </div>
                  <span style={{ color: '#64748b', fontSize: '0.8rem' }}>
                    {new Date(act.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))}
              {activity.length === 0 && <p style={{ color: '#94a3b8' }}>No recent activity.</p>}
            </div>
          </div>

          <div className={dashboardStyles.card}>
            <div className={dashboardStyles.cardHeader}>
              <h2 className={dashboardStyles.cardTitle}>System Alerts</h2>
            </div>
            <div
              style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  style={{
                    padding: '1rem',
                    borderRadius: '8px',
                    background:
                      alert.type === 'warning'
                        ? 'rgba(245, 158, 11, 0.1)'
                        : 'rgba(34, 197, 94, 0.1)',
                    border: `1px solid ${alert.type === 'warning' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
                    color: alert.type === 'warning' ? '#fcd34d' : '#4ade80',
                  }}
                >
                  <p style={{ margin: 0 }}>{alert.message}</p>
                  {alert.actionUrl && (
                    <a
                      href={alert.actionUrl}
                      style={{
                        color: '#fff',
                        fontSize: '0.85rem',
                        display: 'inline-block',
                        marginTop: '0.5rem',
                        textDecoration: 'underline',
                      }}
                    >
                      Take Action
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
