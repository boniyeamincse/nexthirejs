'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-context';
import styles from '@/app/(auth)/auth.module.css';

interface PassportData {
  id: string;
  status: string;
  publicProfile: boolean;
  viewCount: number;
  headline?: string;
  summary?: string;
  sections: { id: string; type: string; title: string; isVisible: boolean }[];
}

interface PassportStats {
  status: string;
  isPublic: boolean;
  viewCount: number;
  sectionCount: number;
  visibleSections: number;
  sections: string[];
  lastViewed?: string;
}

export default function PassportPage() {
  const { getAccessToken } = useAuth();
  const [passport, setPassport] = useState<PassportData | null>(null);
  const [stats, setStats] = useState<PassportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    async function loadPassport() {
      const token = getAccessToken();
      if (!token) return;

      try {
        const [passportRes, statsRes] = await Promise.all([
          fetch('http://localhost:3001/api/v1/passport/mine', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('http://localhost:3001/api/v1/passport/mine/stats', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!passportRes.ok) throw new Error('Failed to load passport');
        if (!statsRes.ok) throw new Error('Failed to load stats');

        const passportData = await passportRes.json();
        const statsData = await statsRes.json();

        setPassport(passportData);
        setStats(statsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading passport');
      } finally {
        setLoading(false);
      }
    }

    loadPassport();
  }, [getAccessToken]);

  async function handlePublish() {
    const token = getAccessToken();
    if (!token || !passport) return;

    setPublishing(true);
    try {
      const res = await fetch('http://localhost:3001/api/v1/passport/mine/publish', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to publish passport');

      const updated = await res.json();
      setPassport(updated);
      setStats((prev) => (prev ? { ...prev, isPublic: true, status: 'ACTIVE' } : null));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error publishing passport');
    } finally {
      setPublishing(false);
    }
  }

  if (loading) return <div className={styles.container}>Loading...</div>;

  if (!passport) {
    return (
      <div className={styles.container}>
        <h1>Career Passport</h1>
        <p>{error || 'Passport not found'}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1>Career Passport</h1>

        <div
          style={{
            background: '#f5f5f5',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px',
          }}
        >
          <h2>{passport.headline || 'Your Professional Profile'}</h2>
          {passport.summary && <p>{passport.summary}</p>}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '20px',
              marginTop: '20px',
            }}
          >
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats?.viewCount || 0}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>Profile Views</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats?.sectionCount || 0}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>Sections</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                {passport.publicProfile ? '🔓' : '🔒'}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {passport.publicProfile ? 'Public' : 'Private'}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <Link href="/passport/edit" style={{ flex: 1 }}>
            <button
              style={{
                width: '100%',
                padding: '10px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Edit Profile
            </button>
          </Link>
          {!passport.publicProfile && (
            <button
              onClick={handlePublish}
              disabled={publishing}
              style={{
                flex: 1,
                padding: '10px',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                opacity: publishing ? 0.6 : 1,
              }}
            >
              {publishing ? 'Publishing...' : 'Publish'}
            </button>
          )}
        </div>

        {stats && stats.sections.length > 0 && (
          <div>
            <h3>Sections</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {stats.sections.map((section, idx) => (
                <li
                  key={idx}
                  style={{
                    padding: '10px',
                    background: '#f9f9f9',
                    borderBottom: '1px solid #eee',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span>{section}</span>
                  <span style={{ fontSize: '12px', color: '#666' }}>
                    {idx < stats.visibleSections ? '✓ Visible' : '✗ Hidden'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
