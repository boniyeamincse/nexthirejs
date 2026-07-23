'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/auth-context';
import dashboardStyles from '@/app/(authenticated)/dashboard/dashboard.module.css';
import Link from 'next/link';

export default function AdminSecurityPage() {
  const { getAccessToken } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (token) setLoading(false);
  }, [getAccessToken]);

  return (
    <div className={dashboardStyles.page}>
      <div className={dashboardStyles.bgGlow} />
      <div className={dashboardStyles.container}>
        <div className={dashboardStyles.hero}>
          <Link href="/admin" style={{ display: 'inline-block', marginBottom: '1rem', color: '#a5b4fc', textDecoration: 'none', fontSize: '0.9rem' }}>
            ← Back to Dashboard
          </Link>
          <h1 className={dashboardStyles.greeting}>Security Overview</h1>
          <p className={dashboardStyles.statsText}>
            Monitor platform security, suspicious activity, and access controls.
          </p>
        </div>

        {loading ? (
          <div className={dashboardStyles.card} style={{ padding: '3rem', textAlign: 'center' }}>
            <p style={{ color: '#94a3b8' }}>Loading...</p>
          </div>
        ) : (
          <div className={dashboardStyles.card} style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
            <h2 style={{ color: '#f8fafc', margin: '0 0 0.5rem' }}>This section is coming soon</h2>
            <p style={{ color: '#94a3b8', maxWidth: '500px', margin: '0 auto', lineHeight: 1.6 }}>
              The security overview interface is under development.
              You will soon be able to monitor suspicious activity, review access logs, configure security policies, and manage API tokens from this page.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
