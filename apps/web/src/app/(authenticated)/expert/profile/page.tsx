'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-context';
import {
  ApiClientError,
  getMyExpertProfile,
  updateMyExpertProfile,
  listSupportedCountries,
} from '@/lib/api-client';
import type { ExpertProfileInput, ExpertProfileResult, Country } from '@nexthire/types';
import { ExpertProfileForm } from '@/features/experts/components/ExpertProfileForm';
import type { ExpertProfileFieldErrors } from '@/features/experts/lib/expert-profile-validation';
import { ExpertNav } from '@/features/experts/components/ExpertNav';

export default function ExpertProfilePage() {
  const { getAccessToken, logout, status: authStatus } = useAuth();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ExpertProfileResult | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);

  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverFieldErrors, setServerFieldErrors] = useState<ExpertProfileFieldErrors>({});
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const [profileResult, countriesResult] = await Promise.all([
        getMyExpertProfile(token),
        listSupportedCountries(token).catch(() => ({ countries: [] })),
      ]);
      setProfile(profileResult);
      setCountries(countriesResult.countries);
    } catch (err) {
      if (err instanceof ApiClientError && err.statusCode === 401) {
        await logout();
        return;
      }
      setLoadError('We could not load your profile. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, logout]);

  useEffect(() => {
    if (authStatus === 'authenticated') {
      void load();
    } else if (authStatus === 'unauthenticated') {
      setLoading(false);
    }
  }, [authStatus, load]);

  const handleSave = async (input: ExpertProfileInput) => {
    const token = getAccessToken();
    if (!token) return;
    setSaving(true);
    setServerError(null);
    setServerFieldErrors({});
    setSavedAt(null);
    try {
      const result = await updateMyExpertProfile(token, input);
      setProfile(result);
      setSavedAt(new Date().toISOString());
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.statusCode === 401) {
          await logout();
          return;
        }
        if (err.errors && err.errors.length > 0) {
          const fieldErrors: ExpertProfileFieldErrors = {};
          for (const detail of err.errors) {
            if (detail.field) {
              fieldErrors[detail.field as keyof ExpertProfileInput] = detail.message;
            }
          }
          setServerFieldErrors(fieldErrors);
        }
        setServerError(err.message);
      } else {
        setServerError('We could not save your profile. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (authStatus === 'unknown' || authStatus === 'loading' || loading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <p style={{ color: '#94a3b8' }}>Loading your profile…</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 style={{ color: '#f1f5f9', fontSize: '1.6rem', fontWeight: 700, margin: '0 0 0.35rem' }}>
        Expert profile
      </h1>
      <p style={{ color: '#94a3b8', margin: '0 0 1.25rem' }}>
        Tell candidates about your professional background. This information is used for
        verification and is not made public in this step.
      </p>

      <ExpertNav active="profile" />

      {loadError && (
        <div
          role="alert"
          style={{
            margin: '1rem 0',
            padding: '0.75rem 0.9rem',
            borderRadius: '0.6rem',
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.4)',
            color: '#fca5a5',
          }}
        >
          {loadError}{' '}
          <button
            onClick={() => void load()}
            style={{
              marginLeft: '0.5rem',
              textDecoration: 'underline',
              background: 'none',
              border: 'none',
              color: '#fca5a5',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {savedAt && (
        <p role="status" style={{ margin: '1rem 0', color: '#86efac', fontSize: '0.9rem' }}>
          ✓ Profile saved.{' '}
          <Link
            href="/expert/verification"
            style={{ color: '#93c5fd', textDecoration: 'underline' }}
          >
            Continue to verification documents
          </Link>
        </p>
      )}

      <div style={{ marginTop: '1rem' }}>
        <ExpertProfileForm
          initialProfile={profile}
          countries={countries}
          onSave={handleSave}
          saving={saving}
          serverError={serverError}
          serverFieldErrors={serverFieldErrors}
        />
      </div>
    </div>
  );
}
