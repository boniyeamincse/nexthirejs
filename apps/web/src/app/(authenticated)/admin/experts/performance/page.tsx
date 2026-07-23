'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/auth-context';
import { getAdminExpertTop } from '@/lib/api-client';
import dashboardStyles from '@/app/(authenticated)/dashboard/dashboard.module.css';

export default function AdminExpertPerformancePage() {
  const { getAccessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [experts, setExperts] = useState<any[]>([]);

  async function loadTopExperts() {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    try {
      const data = await getAdminExpertTop(token);
      setExperts(data.experts || data.top || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadTopExperts(); }, []);

  return (
    <div className={dashboardStyles.page}>
      <div className={dashboardStyles.bgGlow} />
      <div className={dashboardStyles.container}>
        <div className={dashboardStyles.hero}>
          <h1 className={dashboardStyles.greeting}>Top Performing Experts</h1>
          <p className={dashboardStyles.statsText}>Experts ranked by performance metrics.</p>
        </div>

        {error && <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}

        <div className={dashboardStyles.card}>
          <div style={{ padding: '1.5rem', overflowX: 'auto' }}>
            {loading ? (
              <p style={{ color: '#94a3b8' }}>Loading top experts...</p>
            ) : experts.length === 0 ? (
              <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>No performance data available yet.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>#</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Expert</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Score</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Completed</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {experts.map((e: any, i: number) => (
                    <tr key={e.id || i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '0.75rem', color: '#64748b', fontWeight: 700 }}>{i + 1}</td>
                      <td style={{ padding: '0.75rem', color: '#f8fafc' }}>{e.name || e.email || e.fullName || `Expert ${e.id}`}</td>
                      <td style={{ padding: '0.75rem', color: '#4ade80', fontWeight: 600 }}>{e.score ?? e.performanceScore ?? '-'}</td>
                      <td style={{ padding: '0.75rem', color: '#94a3b8' }}>{e.completedCount ?? e.completed ?? 0}</td>
                      <td style={{ padding: '0.75rem', color: '#fbbf24' }}>{e.rating ?? e.averageRating ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
