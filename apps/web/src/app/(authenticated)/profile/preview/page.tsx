'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-context';
import { getMyProfilePreview } from '@/lib/api-client';
import { ApiClientError } from '@/lib/api-client';
import type { OwnerProfilePreview } from '@nexthire/types';
import { ProfilePreview } from '@/features/candidate-profile/preview/ProfilePreview';
import styles from '@/app/(auth)/auth.module.css';

export default function ProfilePreviewPage() {
  const { getAccessToken, logout, status: authStatus } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<OwnerProfilePreview | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const fetchPreview = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setTimeout(() => setLoading(false), 0);
      return;
    }

    setTimeout(() => setLoading(true), 0);
    setPageError(null);

    try {
      const data = await getMyProfilePreview(token);
      setPreview(data);
    } catch (err) {
      if (err instanceof ApiClientError && err.statusCode === 401) {
        await logout();
        router.push('/login');
        return;
      }
      setPageError('Profile preview is temporarily unavailable. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, logout, router]);

  useEffect(() => {
    void fetchPreview();
  }, [fetchPreview]);

  if (authStatus === 'loading' || loading) {
    return (
      <div className={styles.container}>
        <div className={styles.background}></div>
        <div className={styles.glassCard} style={{ textAlign: 'center', padding: '4rem' }}>
          <p className={styles.subtitle}>Loading profile preview...</p>
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
          <button
            onClick={() => router.push('/login')}
            className={styles.submitButton}
            style={{ marginTop: '1rem' }}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={styles.container}
      style={{ minHeight: 'calc(100vh - 72px)', padding: '2rem 1rem' }}
    >
      <div className={styles.background}></div>
      <div className={styles.glassCard} style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 className={styles.title} style={{ fontSize: '1.75rem', margin: 0 }}>
            Profile Preview
          </h1>
          <p className={styles.subtitle} style={{ marginTop: '0.5rem' }}>
            See how your profile appears to others. Preview modes let you simulate different
            visibility levels.
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

        {preview && <ProfilePreview preview={preview} accessToken={getAccessToken() ?? ''} />}
      </div>
    </div>
  );
}
