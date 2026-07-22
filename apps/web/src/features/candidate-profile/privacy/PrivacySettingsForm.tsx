'use client';

import { useState } from 'react';
import type { GetProfilePrivacyResult } from '@/lib/api-client';

interface PrivacySettingsFormProps {
  settings: GetProfilePrivacyResult;
  onSave: (data: {
    overallDiscoverability: string;
    sections: Record<string, string>;
  }) => Promise<void>;
}

const DISCOVERABILITY_DESCRIPTIONS: Record<string, string> = {
  PRIVATE: 'Your profile is visible only to you and authorized internal processes.',
  LINK_ONLY:
    'Future: your profile will be accessible only through a share link. This feature is not yet active.',
  PLATFORM_DISCOVERABLE:
    'Future: authorized companies and recruiters may discover your profile through platform search. This feature is not yet active.',
};

const VISIBILITY_DESCRIPTIONS: Record<string, string> = {
  HIDDEN: 'Only you can view this section.',
  PLATFORM_ONLY: 'Future: authorized companies and recruiters may view this section.',
  PUBLIC: 'Future: this section may be visible to anyone when overall discoverability permits.',
};

const SECTION_LABELS: Record<string, string> = {
  BASIC_PROFILE: 'Basic Profile',
  LOCATION_AND_PREFERENCES: 'Location & Preferences',
  EDUCATION: 'Education',
  WORK_EXPERIENCE: 'Work Experience',
  SKILLS_AND_LANGUAGES: 'Skills & Languages',
  CERTIFICATIONS_AND_TRAINING: 'Certifications & Training',
  ACHIEVEMENTS_AND_LINKS: 'Achievements & Links',
};

export function PrivacySettingsForm({ settings, onSave }: PrivacySettingsFormProps) {
  const [overallDiscoverability, setOverallDiscoverability] = useState(
    settings.overallDiscoverability,
  );
  const [sections, setSections] = useState<Record<string, string>>({ ...settings.sections });
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isDirty =
    overallDiscoverability !== settings.overallDiscoverability ||
    Object.keys(sections).some((key) => sections[key] !== settings.sections[key]);

  const hasWarning =
    overallDiscoverability === 'LINK_ONLY' || overallDiscoverability === 'PLATFORM_DISCOVERABLE';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setSaveStatus('idle');
    setErrorMsg(null);

    try {
      await onSave({
        overallDiscoverability,
        sections,
      });
      setSaveStatus('success');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save privacy settings');
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const handleVisibilityChange = (section: string, value: string) => {
    setSections((prev) => ({ ...prev, [section]: value }));
    if (saveStatus === 'success') setSaveStatus('idle');
  };

  const sectionKeys = Object.keys(settings.sections);

  return (
    <form onSubmit={handleSubmit}>
      <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
        <legend
          style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.5rem' }}
        >
          Overall Profile Discoverability
        </legend>
        <p
          id="discoverability-desc"
          style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1rem' }}
        >
          Controls who can find your profile on the platform. Your profile content is always visible
          to you.
        </p>

        <div
          role="radiogroup"
          aria-labelledby="discoverability-desc"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            marginBottom: '1.5rem',
          }}
        >
          {['PRIVATE', 'LINK_ONLY', 'PLATFORM_DISCOVERABLE'].map((mode) => (
            <label
              key={mode}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                padding: '0.75rem',
                background:
                  overallDiscoverability === mode
                    ? 'rgba(99, 102, 241, 0.1)'
                    : 'rgba(255,255,255,0.03)',
                borderRadius: '0.5rem',
                border:
                  overallDiscoverability === mode
                    ? '1px solid rgba(99, 102, 241, 0.3)'
                    : '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="overallDiscoverability"
                value={mode}
                checked={overallDiscoverability === mode}
                onChange={(e) => {
                  setOverallDiscoverability(e.target.value);
                  if (saveStatus === 'success') setSaveStatus('idle');
                }}
                style={{ marginTop: '0.15rem' }}
              />
              <div>
                <span style={{ color: '#f8fafc', fontWeight: 500 }}>{mode.replace(/_/g, ' ')}</span>
                <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0.15rem 0 0' }}>
                  {DISCOVERABILITY_DESCRIPTIONS[mode]}
                </p>
              </div>
            </label>
          ))}
        </div>

        {hasWarning && (
          <div
            role="alert"
            style={{
              padding: '0.75rem',
              background: 'rgba(234, 179, 8, 0.1)',
              border: '1px solid rgba(234, 179, 8, 0.3)',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem',
              fontSize: '0.85rem',
              color: '#eab308',
            }}
          >
            <strong>Note:</strong> Share-link and recruiter discovery features are not yet active.
            This setting controls future visibility behavior. Hidden sections will remain hidden.
          </div>
        )}

        <h3
          style={{
            fontSize: '1.1rem',
            fontWeight: 600,
            color: '#f8fafc',
            marginBottom: '0.75rem',
            marginTop: '0',
          }}
        >
          Section Visibility
        </h3>

        {sectionKeys.map((sectionKey) => (
          <fieldset
            key={sectionKey}
            style={{
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '0.5rem',
              padding: '0.75rem',
              marginBottom: '0.75rem',
            }}
          >
            <legend
              style={{
                color: '#e2e8f0',
                fontWeight: 500,
                fontSize: '0.9rem',
                padding: '0 0.25rem',
              }}
            >
              {SECTION_LABELS[sectionKey] || sectionKey}
            </legend>
            <div
              role="radiogroup"
              aria-label={`Visibility for ${SECTION_LABELS[sectionKey] || sectionKey}`}
              style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}
            >
              {['HIDDEN', 'PLATFORM_ONLY', 'PUBLIC'].map((vis) => (
                <label
                  key={vis}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    color: sections[sectionKey] === vis ? '#a5b4fc' : '#94a3b8',
                  }}
                >
                  <input
                    type="radio"
                    name={`section-${sectionKey}`}
                    value={vis}
                    checked={sections[sectionKey] === vis}
                    onChange={() => handleVisibilityChange(sectionKey, vis)}
                  />
                  {vis.replace(/_/g, ' ')}
                </label>
              ))}
            </div>
            <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0.25rem 0 0' }}>
              {VISIBILITY_DESCRIPTIONS[sections[sectionKey] ?? 'PLATFORM_ONLY']}
            </p>
          </fieldset>
        ))}

        {errorMsg && (
          <div
            role="alert"
            style={{
              padding: '0.75rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '0.5rem',
              marginBottom: '1rem',
              fontSize: '0.85rem',
              color: '#ef4444',
            }}
          >
            {errorMsg}
          </div>
        )}

        {saveStatus === 'success' && (
          <div
            role="status"
            aria-live="polite"
            style={{
              padding: '0.75rem',
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '0.5rem',
              marginBottom: '1rem',
              fontSize: '0.85rem',
              color: '#4ade80',
              textAlign: 'center',
            }}
          >
            Privacy settings saved successfully.
          </div>
        )}

        {(isDirty || saveStatus === 'success') && (
          <p
            style={{
              fontSize: '0.75rem',
              color: '#64748b',
              textAlign: 'center',
              marginBottom: '0.5rem',
            }}
          >
            {isDirty ? 'You have unsaved changes.' : 'All changes saved.'}
          </p>
        )}

        <button
          type="submit"
          disabled={saving || !isDirty}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: saving || !isDirty ? 'rgba(99, 102, 241, 0.3)' : '#6366f1',
            color: '#fff',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: saving || !isDirty ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
          }}
        >
          {saving ? 'Saving...' : 'Save Privacy Settings'}
        </button>
      </fieldset>
    </form>
  );
}
