'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-context';
import styles from '@/app/(auth)/auth.module.css';

interface ProfileData {
  user: {
    id: string;
    email: string;
    name?: string;
  };
  resume?: unknown;
  skills: unknown[];
  projects: unknown[];
  achievements: unknown[];
  metadata: {
    skillCount: number;
    projectCount: number;
    achievementCount: number;
  };
}

export default function PassportEditPage() {
  const router = useRouter();
  const { getAccessToken } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [headline, setHeadline] = useState('');
  const [summary, setSummary] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const token = getAccessToken();
      if (!token) return;

      try {
        const res = await fetch('http://localhost:3001/api/v1/passport/mine/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error('Failed to load profile');

        const data = await res.json();
        setProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading profile');
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [getAccessToken]);

  async function handleSave() {
    const token = getAccessToken();
    if (!token) return;

    setSaving(true);
    try {
      const res = await fetch('http://localhost:3001/api/v1/passport/mine/sections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'HEADLINE',
          title: 'Professional Headline',
          content: { headline },
        }),
      });

      if (!res.ok) throw new Error('Failed to save profile');

      router.push('/passport');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving profile');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className={styles.container}>Loading...</div>;

  if (!profile) {
    return (
      <div className={styles.container}>
        <p>{error || 'Profile not found'}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1>Edit Career Passport</h1>

        <div style={{ marginBottom: '30px' }}>
          <h2>Basic Info</h2>
          <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
            <p>
              <strong>Name:</strong> {profile.user.name || 'Not set'}
            </p>
            <p>
              <strong>Email:</strong> {profile.user.email}
            </p>
          </div>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h2>Headline</h2>
          <input
            type="text"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="Your professional headline"
            style={{
              width: '100%',
              padding: '10px',
              marginBottom: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
            }}
          />
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h2>Summary</h2>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Your professional summary"
            style={{
              width: '100%',
              height: '150px',
              padding: '10px',
              marginBottom: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              fontFamily: 'inherit',
            }}
          />
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h3>Profile Content</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
            <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '5px' }}>
                {profile.metadata.skillCount}
              </div>
              <div style={{ fontSize: '13px', color: '#666' }}>Skills</div>
            </div>
            <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '5px' }}>
                {profile.metadata.projectCount}
              </div>
              <div style={{ fontSize: '13px', color: '#666' }}>Projects</div>
            </div>
            <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '5px' }}>
                {profile.metadata.achievementCount}
              </div>
              <div style={{ fontSize: '13px', color: '#666' }}>Achievements</div>
            </div>
            <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '5px' }}>
                {profile.resume ? '✓' : '✗'}
              </div>
              <div style={{ fontSize: '13px', color: '#666' }}>Resume</div>
            </div>
          </div>
        </div>

        {error && (
          <div
            style={{
              background: '#ffe0e0',
              color: '#c00',
              padding: '10px',
              borderRadius: '4px',
              marginBottom: '20px',
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 1,
              padding: '12px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={() => router.back()}
            style={{
              flex: 1,
              padding: '12px',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
