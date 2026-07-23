'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/auth-context';
import {
  getAdminStats,
  getAdminActivity,
  getAdminAlerts,
} from '@/lib/api-client';
import adminStyles from './admin.module.css';
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
      <div className={adminStyles.page}>
        <div className={adminStyles.bgGlow}></div>
        <div className={adminStyles.container}>
          <div className={adminStyles.loadingState}>
            Loading Platform Overview...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={adminStyles.page}>
      <div className={adminStyles.bgGlow}></div>
      <div className={adminStyles.container}>
        <div className={adminStyles.hero}>
          <h1 className={adminStyles.greeting}>SuperAdmin Dashboard</h1>
          <p className={adminStyles.statsText}>
            A complete overview of platform health, core KPI metrics, and recent activity.
          </p>
          <div className={adminStyles.actions}>
            <Link
              href="/admin/analytics/growth"
              className={adminStyles.btnPrimary}
            >
              Growth Analytics →
            </Link>
            <Link
              href="/admin/analytics/revenue"
              className={adminStyles.btnSecondary}
            >
              Revenue Analytics →
            </Link>
          </div>
        </div>

        {errorMsg && (
          <div className={adminStyles.errorState}>
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {stats && (
          <div className={adminStyles.kpiGrid}>
            <div className={adminStyles.kpiCard}>
              <h3 className={adminStyles.kpiTitle}>Total Users</h3>
              <p className={adminStyles.kpiValue}>{stats.totalUsers}</p>
            </div>
            <div className={adminStyles.kpiCard}>
              <h3 className={adminStyles.kpiTitle}>Active Users (30d)</h3>
              <p className={adminStyles.kpiValue}>{stats.activeUsers}</p>
            </div>
            <div className={adminStyles.kpiCard}>
              <h3 className={adminStyles.kpiTitle}>Total Revenue (30d)</h3>
              <p className={`${adminStyles.kpiValue} ${adminStyles.success}`}>
                ${stats.totalRevenue}
              </p>
            </div>
            <div className={adminStyles.kpiCard}>
              <h3 className={adminStyles.kpiTitle}>Pending Verifications</h3>
              <p className={`${adminStyles.kpiValue} ${stats.pendingVerifications > 0 ? adminStyles.warning : ''}`}>
                {stats.pendingVerifications}
              </p>
            </div>
          </div>
        )}

        <div className={adminStyles.twoColGrid}>
          <div className={adminStyles.panel}>
            <div className={adminStyles.panelHeader}>
              <h2 className={adminStyles.panelTitle}>Recent Activity</h2>
            </div>
            <div className={adminStyles.panelBody}>
              {activity.map((act) => (
                <div key={act.id} className={adminStyles.activityItem}>
                  <div>
                    <p className={adminStyles.activityType}>{act.type}</p>
                    <p className={adminStyles.activityDesc}>{act.description}</p>
                  </div>
                  <span className={adminStyles.activityTime}>
                    {new Date(act.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))}
              {activity.length === 0 && (
                <p className={adminStyles.emptyState}>No recent activity.</p>
              )}
            </div>
          </div>

          <div className={adminStyles.panel}>
            <div className={adminStyles.panelHeader}>
              <h2 className={adminStyles.panelTitle}>System Alerts</h2>
            </div>
            <div className={adminStyles.panelBody}>
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`${adminStyles.alertItem} ${
                    alert.type === 'warning' ? adminStyles.alertWarning : adminStyles.alertSuccess
                  }`}
                >
                  <p className={adminStyles.alertText}>{alert.message}</p>
                  {alert.actionUrl && (
                    <a href={alert.actionUrl} className={adminStyles.alertAction}>
                      Take Action
                    </a>
                  )}
                </div>
              ))}
              {alerts.length === 0 && (
                <p className={adminStyles.emptyState}>All systems operate normally.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
