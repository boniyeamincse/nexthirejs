'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/auth-context';
import { getMyCandidateProfile, updateMyCandidateProfile } from '@/lib/api-client';
import type { CandidateProfileCompletion } from '@nexthire/types';
import type { CandidateProfileBasicsInput } from '@nexthire/validation';
import styles from '../../(auth)/auth.module.css';

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
      [name]: value === '' ? null : value
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
      <div className={styles.container}>
        <div className={styles.background}></div>
        <div className={styles.glassCard} style={{ textAlign: 'center', padding: '4rem' }}>
          <p className={styles.subtitle}>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container} style={{ minHeight: 'calc(100vh - 72px)', padding: '2rem 1rem' }}>
      <div className={styles.background}></div>
      <div className={styles.glassCard} style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        <div className={styles.header} style={{ marginBottom: '2rem', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className={styles.title} style={{ fontSize: '2rem' }}>Candidate Profile</h1>
            <p className={styles.subtitle}>Update your basic information to complete your Career Passport.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <a href="/profile/preferences" style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.1)', color: '#fff', textDecoration: 'none', borderRadius: '0.5rem', fontSize: '0.9rem', border: '1px solid rgba(255,255,255,0.2)' }}>
              Edit Preferences →
            </a>
            <a href="/profile/skills" style={{ padding: '0.5rem 1rem', background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', textDecoration: 'none', borderRadius: '0.5rem', fontSize: '0.9rem', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
              Skills →
            </a>
            <a href="/profile/languages" style={{ padding: '0.5rem 1rem', background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', textDecoration: 'none', borderRadius: '0.5rem', fontSize: '0.9rem', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
              Languages →
            </a>
          </div>
        </div>

        {completion && (
          <div style={{ 
            marginBottom: '2rem', 
            padding: '1.5rem', 
            background: 'rgba(255,255,255,0.03)', 
            borderRadius: '0.75rem',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ color: '#f8fafc', fontWeight: 600, margin: 0 }}>Profile Completion</h3>
              <span style={{ color: '#a5b4fc', fontWeight: 700, fontSize: '1.25rem' }}>{completion.percentage}%</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${completion.percentage}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #a5b4fc)', transition: 'width 0.5s ease' }}></div>
            </div>
            {completion.missingFields.length > 0 && (
              <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#94a3b8' }}>
                Missing fields: {completion.missingFields.join(', ')}
              </p>
            )}
            <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#64748b' }}>
              Note: Additional profile sections like Education and Work Experience will be added in future updates.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Email Address (Read-only)</label>
            <input 
              type="text" 
              className={styles.input} 
              value={user?.email || ''} 
              disabled 
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="fullName" className={styles.label}>Full Name *</label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              className={styles.input}
              value={formData.fullName || ''}
              onChange={handleChange}
              placeholder="e.g. Jane Doe"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="professionalHeadline" className={styles.label}>Professional Headline</label>
            <input
              id="professionalHeadline"
              name="professionalHeadline"
              type="text"
              className={styles.input}
              value={formData.professionalHeadline || ''}
              onChange={handleChange}
              placeholder="e.g. Senior Frontend Developer"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="professionalSummary" className={styles.label}>Professional Summary</label>
            <textarea
              id="professionalSummary"
              name="professionalSummary"
              className={styles.input}
              style={{ minHeight: '120px', resize: 'vertical' }}
              value={formData.professionalSummary || ''}
              onChange={handleChange}
              placeholder="A brief overview of your career and skills..."
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
            <div className={styles.formGroup}>
              <label htmlFor="dateOfBirth" className={styles.label}>Date of Birth</label>
              <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                className={styles.input}
                value={formData.dateOfBirth || ''}
                onChange={handleChange}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {errorMsg && (
            <div className={styles.errorContainer}>
              <p className={styles.errorText}>{errorMsg}</p>
            </div>
          )}

          {saveStatus === 'success' && (
            <div style={{ padding: '0.75rem', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '0.5rem', color: '#4ade80', fontSize: '0.9rem', textAlign: 'center' }}>
              Profile updated successfully!
            </div>
          )}

          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={saving}
            style={{ marginTop: '1rem' }}
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>

      </div>
    </div>
  );
}
