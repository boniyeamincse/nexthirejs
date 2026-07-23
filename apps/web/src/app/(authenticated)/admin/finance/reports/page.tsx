'use client';

import dashboardStyles from '@/app/(authenticated)/dashboard/dashboard.module.css';

export default function AdminFinanceReportsPage() {
  return (
    <div className={dashboardStyles.page}>
      <div className={dashboardStyles.bgGlow} />
      <div className={dashboardStyles.container}>
        <div className={dashboardStyles.hero}>
          <h1 className={dashboardStyles.greeting}>Finance Reports</h1>
          <p className={dashboardStyles.statsText}>This section is coming soon.</p>
        </div>
        <div className={dashboardStyles.card} style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>🚧 Under Development</p>
          <p style={{ color: '#64748b', marginTop: '0.5rem' }}>This feature is being built and will be available soon.</p>
        </div>
      </div>
    </div>
  );
}
