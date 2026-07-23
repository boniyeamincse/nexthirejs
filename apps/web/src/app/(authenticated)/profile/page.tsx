'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/auth-context';
import { getMyCandidateProfile, updateMyCandidateProfile } from '@/lib/api-client';
import { ProfilePhotoCard } from '@/features/candidate-profile/photo/ProfilePhotoCard';
import type { CandidateProfileCompletion } from '@nexthire/types';
import type { CandidateProfileBasicsInput } from '@nexthire/validation';
import Link from 'next/link';
import authStyles from '@/app/(auth)/auth.module.css';
import dashboardStyles from '@/app/(authenticated)/dashboard/dashboard.module.css';

export default function ProfilePage() {
  const { getAccessToken, user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [completion, setCompletion] = useState<CandidateProfileCompletion | null>(null);

  const [formData, setFormData] = useState<CandidateProfileBasicsInput>({
    fullName: '',
    professionalHeadline: '',
    professionalSummary: '',
    dateOfBirth: '',
  });

  useEffect(() => {
    async function loadProfile() {
      const token = getAccessToken();
      if (!token) return;

      try {
        const data = await getMyCandidateProfile(token);
        setCompletion(data.completion);

        if (data.profile) {
          setFormData({
            fullName: data.profile.fullName || '',
            professionalHeadline: data.profile.professionalHeadline || '',
            professionalSummary: data.profile.professionalSummary || '',
            dateOfBirth: data.profile.dateOfBirth ? data.profile.dateOfBirth.split('T')[0] : '',
          });
        }
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    }

    void loadProfile();
  }, [getAccessToken]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === '' ? null : value,
    }));
    setSaveStatus('idle');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveStatus('idle');
    setErrorMsg('');

    const token = getAccessToken();
    if (!token) return;

    try {
      const result = await updateMyCandidateProfile(token, formData);
      setCompletion(result.completion);
      setSaveStatus('success');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update profile');
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={dashboardStyles.centerState} aria-live="polite" aria-busy="true">
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className={dashboardStyles.page}>
      <div className={dashboardStyles.bgGlow} />

      <div className={dashboardStyles.container} style={{ maxWidth: '800px' }}>
        {/* Hero section equivalent for Profile */}
        <div
          className={dashboardStyles.hero}
          style={{
            padding: '2.5rem',
            marginBottom: '2rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
          }}
        >
          <h1 className={dashboardStyles.heroGreeting}>Candidate Profile</h1>
          <p className={dashboardStyles.heroSubtitle}>
            Update your basic information to complete your Career Passport.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem', flexWrap: 'wrap' }}>
            <Link
              href="/profile/preferences"
              className={dashboardStyles.retryBtn}
              style={{ textDecoration: 'none' }}
            >
              Preferences →
            </Link>
            <Link
              href="/profile/experience"
              className={dashboardStyles.retryBtn}
              style={{
                textDecoration: 'none',
                background: 'rgba(99, 102, 241, 0.15)',
                borderColor: 'rgba(99, 102, 241, 0.3)',
                color: '#a5b4fc',
              }}
            >
              Experience →
            </Link>
            <Link
              href="/profile/education"
              className={dashboardStyles.retryBtn}
              style={{
                textDecoration: 'none',
                background: 'rgba(99, 102, 241, 0.15)',
                borderColor: 'rgba(99, 102, 241, 0.3)',
                color: '#a5b4fc',
              }}
            >
              Education →
            </Link>
            <Link
              href="/profile/skills"
              className={dashboardStyles.retryBtn}
              style={{
                textDecoration: 'none',
                background: 'rgba(99, 102, 241, 0.15)',
                borderColor: 'rgba(99, 102, 241, 0.3)',
                color: '#a5b4fc',
              }}
            >
              Skills →
            </Link>
            <Link
              href="/profile/languages"
              className={dashboardStyles.retryBtn}
              style={{
                textDecoration: 'none',
                background: 'rgba(99, 102, 241, 0.15)',
                borderColor: 'rgba(99, 102, 241, 0.3)',
                color: '#a5b4fc',
              }}
            >
              Languages →
            </Link>
            <Link
              href="/profile/certifications"
              className={dashboardStyles.retryBtn}
              style={{
                textDecoration: 'none',
                background: 'rgba(99, 102, 241, 0.15)',
                borderColor: 'rgba(99, 102, 241, 0.3)',
                color: '#a5b4fc',
              }}
            >
              Certs &amp; Training →
            </Link>
            <Link
              href="/profile/achievements"
              className={dashboardStyles.retryBtn}
              style={{
                textDecoration: 'none',
                background: 'rgba(99, 102, 241, 0.15)',
                borderColor: 'rgba(99, 102, 241, 0.3)',
                color: '#a5b4fc',
              }}
            >
              Achievements &amp; Links →
            </Link>
            <Link
              href="/cv"
              className={dashboardStyles.retryBtn}
              style={{
                textDecoration: 'none',
                background: 'rgba(99, 102, 241, 0.15)',
                borderColor: 'rgba(99, 102, 241, 0.3)',
                color: '#a5b4fc',
              }}
            >
              CV Builder →
            </Link>
          </div>
        </div>

        {/* Profile Completion Indicator */}
        {completion && (
          <div
            className={dashboardStyles.card}
            style={{ minHeight: 'auto', marginBottom: '1.5rem', padding: '1.5rem' }}
          >
            <div className={dashboardStyles.cardHeader} style={{ marginBottom: '1rem' }}>
              <h2 className={dashboardStyles.cardTitle}>Profile Completion</h2>
              <span
                className={dashboardStyles.cardBadge}
                style={{ fontSize: '1rem', color: '#a5b4fc' }}
              >
                {completion.percentage}%
              </span>
            </div>

            <div
              style={{
                width: '100%',
                height: '8px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${completion.percentage}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #6366f1, #a5b4fc)',
                  transition: 'width 0.5s ease',
                }}
              />
            </div>

            {completion.missingFields.length > 0 && (
              <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#94a3b8' }}>
                <strong>Missing fields:</strong> {completion.missingFields.join(', ')}
              </p>
            )}
          </div>
        )}

        <ProfilePhotoCard getAccessToken={getAccessToken} />

        {/* Form Card */}
        <div className={dashboardStyles.card} style={{ minHeight: 'auto' }}>
          <div className={dashboardStyles.cardHeader}>
            <h2 className={dashboardStyles.cardTitle}>Basic Information</h2>
          </div>

          <form onSubmit={handleSubmit} className={authStyles.form}>
            <div className={authStyles.formGroup}>
              <label className={authStyles.label}>Email Address (Read-only)</label>
              <input
                type="text"
                className={authStyles.input}
                value={user?.email || ''}
                disabled
                style={{ opacity: 0.5, cursor: 'not-allowed' }}
              />
            </div>

            <div className={authStyles.formGroup}>
              <label htmlFor="fullName" className={authStyles.label}>
                Full Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                className={authStyles.input}
                value={formData.fullName || ''}
                onChange={handleChange}
                placeholder="e.g. Jane Doe"
              />
            </div>

            <div className={authStyles.formGroup}>
              <label htmlFor="professionalHeadline" className={authStyles.label}>
                Professional Headline
              </label>
              <input
                id="professionalHeadline"
                name="professionalHeadline"
                type="text"
                className={authStyles.input}
                value={formData.professionalHeadline || ''}
                onChange={handleChange}
                placeholder="e.g. Senior Frontend Developer"
              />
            </div>

            <div className={authStyles.formGroup}>
              <label htmlFor="professionalSummary" className={authStyles.label}>
                Professional Summary
              </label>
              <textarea
                id="professionalSummary"
                name="professionalSummary"
                className={authStyles.input}
                style={{ minHeight: '120px', resize: 'vertical' }}
                value={formData.professionalSummary || ''}
                onChange={handleChange}
                placeholder="A brief overview of your career and skills..."
              />
            </div>

            <div className={authStyles.formGroup}>
              <label htmlFor="dateOfBirth" className={authStyles.label}>
                Date of Birth
              </label>
              <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                className={authStyles.input}
                value={formData.dateOfBirth || ''}
                onChange={handleChange}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            {errorMsg && (
              <div className={authStyles.alertError} style={{ marginTop: '1rem', marginBottom: 0 }}>
                {errorMsg}
              </div>
            )}

            {saveStatus === 'success' && (
              <div
                style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  background: 'rgba(34, 197, 94, 0.1)',
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                  borderRadius: '0.75rem',
                  color: '#4ade80',
                  fontSize: '0.9rem',
                  textAlign: 'center',
                }}
              >
                Profile updated successfully!
              </div>
            )}

            <button
              type="submit"
              className={authStyles.submitButton}
              disabled={saving}
              style={{ marginTop: '1.5rem' }}
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
