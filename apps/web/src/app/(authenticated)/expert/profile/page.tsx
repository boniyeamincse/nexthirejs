'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-context';
import {
  ApiClientError,
  getMyExpertProfile,
  updateMyExpertProfile,
  updateMyExpertProfileVisibility,
  listSupportedCountries,
} from '@/lib/api-client';
import type { ExpertProfileInput, ExpertProfileResult, Country } from '@nexthire/types';
import { ExpertProfileForm } from '@/features/experts/components/ExpertProfileForm';
import type { ExpertProfileFieldErrors } from '@/features/experts/lib/expert-profile-validation';
import { ExpertNav } from '@/features/experts/components/ExpertNav';

export default function ExpertProfilePage() {
  const { getAccessToken, logout, status: authStatus, user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ExpertProfileResult | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);

  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverFieldErrors, setServerFieldErrors] = useState<ExpertProfileFieldErrors>({});
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const [visibilitySaving, setVisibilitySaving] = useState(false);
  const [visibilityError, setVisibilityError] = useState<string | null>(null);

  const isApprovedExpert = user?.roleCodes.includes('expert') ?? false;

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

  const handleToggleVisibility = async () => {
    const token = getAccessToken();
    if (!token || !profile) return;
    setVisibilitySaving(true);
    setVisibilityError(null);
    try {
      const result = await updateMyExpertProfileVisibility(token, {
        isPublic: !profile.isPublic,
      });
      setProfile((prev) =>
        prev ? { ...prev, isPublic: result.isPublic, publicSlug: result.publicSlug } : prev,
      );
    } catch (err) {
      if (err instanceof ApiClientError && err.statusCode === 401) {
        await logout();
        return;
      }
      setVisibilityError(
        err instanceof Error ? err.message : 'Could not update your visibility setting.',
      );
    } finally {
      setVisibilitySaving(false);
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

      {isApprovedExpert && profile && (
        <section
          style={{
            margin: '1rem 0',
            padding: '1rem 1.1rem',
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '0.75rem',
          }}
        >
          <h2 style={{ color: '#f1f5f9', fontSize: '1rem', margin: '0 0 0.5rem' }}>
            Public Directory
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: '0 0 0.75rem' }}>
            {profile.isPublic
              ? 'Your profile is visible in the public expert directory.'
              : 'Your profile is private and does not appear in the public directory.'}
          </p>
          {profile.isPublic && profile.publicSlug && (
            <p style={{ margin: '0 0 0.75rem' }}>
              <Link
                href={`/find-expert/${profile.publicSlug}`}
                target="_blank"
                style={{ color: '#93c5fd', textDecoration: 'underline', fontSize: '0.85rem' }}
              >
                View your public profile →
              </Link>
            </p>
          )}
          {visibilityError && (
            <p role="alert" style={{ color: '#fca5a5', fontSize: '0.85rem', margin: '0 0 0.75rem' }}>
              {visibilityError}
            </p>
          )}
          <button
            onClick={() => void handleToggleVisibility()}
            disabled={visibilitySaving}
            style={{
              padding: '0.5rem 1.1rem',
              background: profile.isPublic ? 'transparent' : '#2563eb',
              color: profile.isPublic ? '#cbd5e1' : '#fff',
              border: profile.isPublic ? '1px solid #475569' : 'none',
              borderRadius: '0.5rem',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: visibilitySaving ? 'not-allowed' : 'pointer',
              opacity: visibilitySaving ? 0.6 : 1,
            }}
          >
            {visibilitySaving ? 'Saving...' : profile.isPublic ? 'Make Private' : 'Make Public'}
          </button>
        </section>
      )}

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
