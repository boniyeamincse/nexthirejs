'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/auth-context';
import { getMyCandidatePreferences, updateMyCandidatePreferences, listSupportedCountries } from '@/lib/api-client';
import type { Country, CandidateProfileCompletion } from '@nexthire/types';
import type { CandidatePreferenceInput } from '@nexthire/validation';
import styles from '../../../(auth)/auth.module.css';

export default function PreferencesPage() {
  const { getAccessToken } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [countries, setCountries] = useState<Country[]>([]);
  const [completion, setCompletion] = useState<CandidateProfileCompletion | null>(null);

  const [formData, setFormData] = useState<CandidatePreferenceInput>({
    countryCode: '',
    currentCity: '',
    preferredJobRoles: [],
    preferredWorkModes: [],
    preferredEmploymentTypes: [],
  });
  const [roleInput, setRoleInput] = useState('');

  useEffect(() => {
    async function loadData() {
      const token = getAccessToken();
      if (!token) return;
      
      try {
        const [prefsResult, countriesResult] = await Promise.all([
          getMyCandidatePreferences(token),
          listSupportedCountries(token),
        ]);
        
        setCountries(countriesResult.countries);

        if (prefsResult.preferences) {
          setCompletion(prefsResult.preferences.completion);
          setFormData({
            countryCode: prefsResult.preferences.country.code,
            currentCity: prefsResult.preferences.currentCity,
            preferredJobRoles: prefsResult.preferences.preferredJobRoles,
            preferredWorkModes: prefsResult.preferences.preferredWorkModes,
            preferredEmploymentTypes: prefsResult.preferences.preferredEmploymentTypes,
          });
        } else {
          // pre-select first country if available
          const firstCountry = countriesResult.countries[0];
          if (firstCountry) {
            setFormData(prev => ({ ...prev, countryCode: firstCountry.code }));
          }
        }
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : 'Failed to load preferences');
      } finally {
        setLoading(false);
      }
    }
    
    void loadData();
  }, [getAccessToken]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setSaveStatus('idle');
  };

  const handleCheckboxChange = (name: 'preferredWorkModes' | 'preferredEmploymentTypes', value: string) => {
    setFormData(prev => {
      const current = prev[name] as string[];
      const updated = current.includes(value) 
        ? current.filter(v => v !== value) 
        : [...current, value];
      
      return { ...prev, [name]: updated };
    });
    setSaveStatus('idle');
  };

  const handleAddRole = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = roleInput.trim();
      if (!val) return;
      
      const isDuplicate = formData.preferredJobRoles.some(r => r.toLowerCase() === val.toLowerCase());
      if (isDuplicate) {
        setErrorMsg('Role already added');
        return;
      }
      
      if (formData.preferredJobRoles.length >= 5) {
        setErrorMsg('Maximum of 5 preferred job roles allowed');
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        preferredJobRoles: [...prev.preferredJobRoles, val]
      }));
      setRoleInput('');
      setErrorMsg('');
      setSaveStatus('idle');
    }
  };

  const handleRemoveRole = (role: string) => {
    setFormData(prev => ({
      ...prev,
      preferredJobRoles: prev.preferredJobRoles.filter(r => r !== role)
    }));
    setSaveStatus('idle');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveStatus('idle');
    setErrorMsg('');

    try {
      const token = getAccessToken();
      if (!token) throw new Error('Not authenticated');
      
      const result = await updateMyCandidatePreferences(token, formData);
      setCompletion(result.completion);
      setSaveStatus('success');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update preferences');
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
          <p className={styles.subtitle}>Loading preferences...</p>
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
            <a href="/profile" style={{ display: 'inline-block', marginBottom: '0.5rem', color: '#a5b4fc', textDecoration: 'none', fontSize: '0.9rem' }}>
              ← Back to Basic Profile
            </a>
            <h1 className={styles.title} style={{ fontSize: '2rem' }}>Career Preferences</h1>
            <p className={styles.subtitle}>Let us know what you are looking for in your next role.</p>
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
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          
          <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '1rem', marginTop: '1rem' }}>Location</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className={styles.formGroup}>
              <label htmlFor="countryCode" className={styles.label}>Country *</label>
              <select
                id="countryCode"
                name="countryCode"
                required
                className={styles.input}
                value={formData.countryCode}
                onChange={handleChange as React.ChangeEventHandler<HTMLSelectElement>}
                style={{ appearance: 'auto' }}
              >
                <option value="" disabled>Select Country</option>
                {countries.map(c => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="currentCity" className={styles.label}>Current City *</label>
              <input
                id="currentCity"
                name="currentCity"
                type="text"
                required
                className={styles.input}
                value={formData.currentCity}
                onChange={handleChange}
                placeholder="e.g. Dhaka"
              />
            </div>
          </div>

          <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '1rem', marginTop: '1.5rem' }}>Job Roles</h3>
          <div className={styles.formGroup}>
            <label htmlFor="roleInput" className={styles.label}>Preferred Roles (1-5) *</label>
            <input
              id="roleInput"
              type="text"
              className={styles.input}
              value={roleInput}
              onChange={(e) => setRoleInput(e.target.value)}
              onKeyDown={handleAddRole}
              placeholder="Type a role and press Enter (e.g. Frontend Engineer)"
              disabled={formData.preferredJobRoles.length >= 5}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
              {formData.preferredJobRoles.map(role => (
                <div key={role} style={{ 
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.35rem 0.75rem', background: 'rgba(99, 102, 241, 0.2)', 
                  border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '2rem',
                  fontSize: '0.85rem', color: '#e2e8f0'
                }}>
                  <span>{role}</span>
                  <button 
                    type="button" 
                    onClick={() => handleRemoveRole(role)}
                    style={{ background: 'none', border: 'none', color: '#a5b4fc', cursor: 'pointer', padding: 0, fontSize: '1rem', lineHeight: 1 }}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>

          <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '1rem', marginTop: '1.5rem' }}>Work Environment</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Work Modes *</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                {['ONSITE', 'HYBRID', 'REMOTE'].map(mode => (
                  <label key={mode} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cbd5e1', cursor: 'pointer', fontSize: '0.9rem' }}>
                    <input 
                      type="checkbox" 
                      checked={(formData.preferredWorkModes as string[]).includes(mode)}
                      onChange={() => handleCheckboxChange('preferredWorkModes', mode)}
                      style={{ width: '1rem', height: '1rem', accentColor: '#6366f1' }}
                    />
                    {mode.charAt(0) + mode.slice(1).toLowerCase()}
                  </label>
                ))}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Employment Types *</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                {['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE'].map(type => (
                  <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cbd5e1', cursor: 'pointer', fontSize: '0.9rem' }}>
                    <input 
                      type="checkbox" 
                      checked={(formData.preferredEmploymentTypes as string[]).includes(type)}
                      onChange={() => handleCheckboxChange('preferredEmploymentTypes', type)}
                      style={{ width: '1rem', height: '1rem', accentColor: '#6366f1' }}
                    />
                    {type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                  </label>
                ))}
              </div>
            </div>

          </div>

          {errorMsg && (
            <div className={styles.errorContainer}>
              <p className={styles.errorText}>{errorMsg}</p>
            </div>
          )}

          {saveStatus === 'success' && (
            <div style={{ padding: '0.75rem', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '0.5rem', color: '#4ade80', fontSize: '0.9rem', textAlign: 'center', marginTop: '1rem' }}>
              Preferences updated successfully!
            </div>
          )}

          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={saving}
            style={{ marginTop: '1.5rem' }}
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </form>

      </div>
    </div>
  );
}
