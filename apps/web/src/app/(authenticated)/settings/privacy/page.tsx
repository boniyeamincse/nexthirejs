'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-context';
import { getMyProfilePrivacy, updateMyProfilePrivacy } from '@/lib/api-client';
import { ApiClientError } from '@/lib/api-client';
import type { GetProfilePrivacyResult } from '@/lib/api-client';
import { PrivacySettingsForm } from '@/features/candidate-profile/privacy/PrivacySettingsForm';
import styles from '../../(auth)/auth.module.css';

export default function PrivacySettingsPage() {
  const { getAccessToken, logout, status: authStatus } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<GetProfilePrivacyResult | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setPageError(null);

    try {
      const data = await getMyProfilePrivacy(token);
      setSettings(data);
    } catch (err) {
      if (err instanceof ApiClientError && err.statusCode === 401) {
        await logout();
        router.push('/login');
        return;
      }
      setPageError('Privacy settings are temporarily unavailable. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, logout, router]);

  useEffect(() => {
    void fetchSettings();
  }, [fetchSettings]);

  const handleSave = async (data: { overallDiscoverability: string; sections: Record<string, string> }) => {
    const token = getAccessToken();
    if (!token) {
      await logout();
      router.push('/login');
      return;
    }

    const result = await updateMyProfilePrivacy(token, data);
    setSettings(result);
  };

  if (authStatus === 'loading' || loading) {
    return (
      <div className={styles.container}>
        <div className={styles.background}></div>
        <div className={styles.glassCard} style={{ textAlign: 'center', padding: '4rem' }}>
          <p className={styles.subtitle}>Loading privacy settings...</p>
        </div>
      </div>
    );
  }

  if (authStatus === 'unauthenticated') {
    return (
      <div className={styles.container}>
        <div className={styles.background}></div>
        <div className={styles.glassCard} style={{ textAlign: 'center', padding: '4rem' }}>
          <p className={styles.subtitle}>Session expired. Please log in again.</p>
          <button onClick={() => router.push('/login')} className={styles.submitButton} style={{ marginTop: '1rem' }}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container} style={{ minHeight: 'calc(100vh - 72px)', padding: '2rem 1rem' }}>
      <div className={styles.background}></div>
      <div className={styles.glassCard} style={{ maxWidth: '700px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 className={styles.title} style={{ fontSize: '1.75rem', margin: 0 }}>Privacy Settings</h1>
          <p className={styles.subtitle} style={{ marginTop: '0.5rem' }}>
            Control how your profile and its sections are visible to others.
            Public profile and recruiter discovery features are not yet available.
          </p>
        </div>

        {pageError && (
          <div
            role="alert"
            style={{
              padding: '0.75rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem',
              fontSize: '0.85rem',
              color: '#ef4444',
            }}
          >
            {pageError}
          </div>
        )}

        {settings && (
          <PrivacySettingsForm
            settings={settings}
            onSave={handleSave}
          />
        )}

        <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.5rem', fontSize: '0.8rem', color: '#64748b' }}>
          <p style={{ margin: 0 }}>
            <strong>Policy Version:</strong> {settings?.policyVersion || 'Not available'}
            {settings?.source === 'DEFAULT' && ' (default — not yet saved)'}
          </p>
          <p style={{ margin: '0.25rem 0 0' }}>
            These settings do not yet affect public or recruiter views. Those features are planned for future releases.
          </p>
        </div>
      </div>
    </div>
  );
}
