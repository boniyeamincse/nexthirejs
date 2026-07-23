'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/auth-context';
import { getAdminRevenueTrends } from '@/lib/api-client';
import dashboardStyles from '@/app/(authenticated)/dashboard/dashboard.module.css';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import Link from 'next/link';

export default function RevenueAnalyticsPage() {
  const { getAccessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [revenue, setRevenue] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      const token = getAccessToken();
      if (!token) return;
      try {
        const data = await getAdminRevenueTrends(token);
        setRevenue(data.revenue);
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to load revenue analytics');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [getAccessToken]);

  return (
    <div className={dashboardStyles.page}>
      <div className={dashboardStyles.bgGlow}></div>
      <div className={dashboardStyles.container}>
        <div className={dashboardStyles.hero}>
          <Link href="/admin" style={{ display: 'inline-block', marginBottom: '1rem', color: '#a5b4fc', textDecoration: 'none', fontSize: '0.9rem' }}>
            ← Back to Dashboard
          </Link>
          <h1 className={dashboardStyles.greeting}>Revenue Analytics</h1>
          <p className={dashboardStyles.statsText}>
            Revenue trends and financial metrics.
          </p>
        </div>

        {errorMsg && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '1rem', borderRadius: '8px', marginBottom: '2rem' }}>
            {errorMsg}
          </div>
        )}

        <div className={dashboardStyles.card} style={{ marginBottom: '2rem' }}>
          <div className={dashboardStyles.cardHeader}>
            <h2 className={dashboardStyles.cardTitle}>Revenue Trend (30 Days)</h2>
          </div>
          <div style={{ height: '400px', padding: '1.5rem' }}>
            {loading ? (
              <p style={{ color: '#94a3b8', textAlign: 'center' }}>Loading chart data...</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenue} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <RechartsTooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                  <Bar dataKey="revenue" fill="#4ade80" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
