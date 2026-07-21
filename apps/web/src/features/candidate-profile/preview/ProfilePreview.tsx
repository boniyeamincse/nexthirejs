'use client';

import { useState, useCallback } from 'react';
import type {
  OwnerProfilePreview,
  PreviewAccessMode,
  PublicEducationRecord,
  PublicWorkExperienceRecord,
  PublicSkillRecord,
  PublicLanguageRecord,
  PublicCertificationRecord,
  PublicTrainingRecord,
  PublicAchievementRecord,
  PublicProfessionalLinkRecord,
} from '@nexthire/types';
import {
  rotateProfileShareLink,
  setProfileShareLinkEnabled,
} from '@/lib/api-client';

interface ProfilePreviewProps {
  preview: OwnerProfilePreview;
  accessToken: string;
}

const MODE_LABELS: Record<PreviewAccessMode, string> = {
  OWNER: 'Owner View (everything visible)',
  LINK_ONLY: 'Link-Only View (share link)',
  PLATFORM_DISCOVERABLE: 'Platform Discoverable View',
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

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
}

function formatDateRange(start: string, end: string | null, current: boolean): string {
  const startFmt = formatDate(start);
  if (current) return `${startFmt} - Present`;
  return `${startFmt} - ${end ? formatDate(end) : ''}`;
}

function getHiddenSections(preview: OwnerProfilePreview): string[] {
  return Object.entries(preview.privacySummary.sectionVisibility)
    .filter(([, vis]) => vis === 'HIDDEN')
    .map(([key]) => key);
}

function getVisibleSections(preview: OwnerProfilePreview): string[] {
  return Object.entries(preview.privacySummary.sectionVisibility)
    .filter(([, vis]) => vis !== 'HIDDEN')
    .map(([key]) => key);
}

export function ProfilePreview({ preview, accessToken }: ProfilePreviewProps) {
  const [previewMode, setPreviewMode] = useState<PreviewAccessMode>('OWNER');
  const [shareCopied, setShareCopied] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [disabling, setDisabling] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [rotatedAt, setRotatedAt] = useState<string | null>(null);
  const [shareEnabled, setShareEnabled] = useState(true);

  const isOwner = previewMode === 'OWNER';
  const hiddenSections = getHiddenSections(preview);
  const visibleSections = getVisibleSections(preview);
  const profile = preview.profile;

  const handleCopyLink = useCallback(async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      setShareError('Failed to copy link to clipboard.');
    }
  }, [shareUrl]);

  const handleRotate = useCallback(async () => {
    setRotating(true);
    setShareError(null);
    try {
      const result = await rotateProfileShareLink(accessToken);
      setShareUrl(result.shareUrl);
      setRotatedAt(result.rotatedAt);
    } catch (err: unknown) {
      setShareError(err instanceof Error ? err.message : 'Failed to rotate share link.');
    } finally {
      setRotating(false);
    }
  }, [accessToken]);

  const handleDisable = useCallback(async () => {
    if (!confirm('Disable share link? Existing links will stop working.')) return;
    setDisabling(true);
    setShareError(null);
    try {
      await setProfileShareLinkEnabled(accessToken, false);
      setShareEnabled(false);
      setShareUrl(null);
    } catch (err: unknown) {
      setShareError(err instanceof Error ? err.message : 'Failed to disable share link.');
    } finally {
      setDisabling(false);
    }
  }, [accessToken]);

  const handleEnable = useCallback(async () => {
    setDisabling(true);
    setShareError(null);
    try {
      const result = await setProfileShareLinkEnabled(accessToken, true);
      setShareEnabled(result.enabled);
      const rotateResult = await rotateProfileShareLink(accessToken);
      setShareUrl(rotateResult.shareUrl);
      setRotatedAt(rotateResult.rotatedAt);
    } catch (err: unknown) {
      setShareError(err instanceof Error ? err.message : 'Failed to enable share link.');
    } finally {
      setDisabling(false);
    }
  }, [accessToken]);

  return (
    <div>
      <section>
        <fieldset style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1.5rem' }}>
          <legend style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.95rem', padding: '0 0.25rem' }}>
            Preview Mode
          </legend>
          <div
            role="radiogroup"
            aria-label="Preview mode selector"
            style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
          >
            {(Object.entries(MODE_LABELS) as [PreviewAccessMode, string][]).map(([mode, label]) => (
              <label
                key={mode}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  color: previewMode === mode ? '#a5b4fc' : '#94a3b8',
                }}
              >
                <input
                  type="radio"
                  name="previewMode"
                  value={mode}
                  checked={previewMode === mode}
                  onChange={() => setPreviewMode(mode)}
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      <section>
        <fieldset style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1.5rem' }}>
          <legend style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.95rem', padding: '0 0.25rem' }}>
            Privacy Summary
          </legend>

          <div style={{ marginBottom: '0.75rem' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Overall Visibility: </span>
            <span style={{ color: '#f8fafc', fontWeight: 500, fontSize: '0.85rem' }}>
              {preview.privacySummary.overallVisibility.replace(/_/g, ' ')}
            </span>
          </div>

          <div style={{ marginBottom: '0.5rem' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Share Link: </span>
            <span style={{
              color: preview.privacySummary.shareLinkEnabled ? '#4ade80' : '#ef4444',
              fontWeight: 500,
              fontSize: '0.85rem',
            }}>
              {preview.privacySummary.shareLinkEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          <div>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.35rem' }}>Section Visibility:</p>
            {Object.entries(preview.privacySummary.sectionVisibility).map(([key, vis]) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                <span style={{ color: '#cbd5e1' }}>{SECTION_LABELS[key] || key}</span>
                <span style={{
                  color: vis === 'HIDDEN' ? '#ef4444' : vis === 'PUBLIC' ? '#4ade80' : '#facc15',
                  fontWeight: 500,
                }}>
                  {vis.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
        </fieldset>
      </section>

      {isOwner && (
        <section>
          <fieldset style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1.5rem' }}>
            <legend style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.95rem', padding: '0 0.25rem' }}>
              Share Link Controls
            </legend>

            {shareEnabled && shareUrl && (
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'block', marginBottom: '0.35rem' }}>
                  Share URL
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '0.375rem',
                      color: '#f8fafc',
                      fontSize: '0.8rem',
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    style={{
                      padding: '0.5rem 0.75rem',
                      background: shareCopied ? 'rgba(34, 197, 94, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                      color: shareCopied ? '#4ade80' : '#a5b4fc',
                      border: shareCopied ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(99, 102, 241, 0.3)',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                    }}
                  >
                    {shareCopied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            )}

            {shareEnabled && rotatedAt && (
              <p style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                Last rotated: {new Date(rotatedAt).toLocaleString()}
              </p>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {shareEnabled ? (
                <>
                  <button
                    type="button"
                    onClick={handleRotate}
                    disabled={rotating}
                    style={{
                      padding: '0.5rem 0.75rem',
                      background: rotating ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)',
                      color: rotating ? '#94a3b8' : '#a5b4fc',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      borderRadius: '0.375rem',
                      cursor: rotating ? 'not-allowed' : 'pointer',
                      fontSize: '0.85rem',
                    }}
                  >
                    {rotating ? 'Rotating...' : 'Rotate Link'}
                  </button>
                  <button
                    type="button"
                    onClick={handleDisable}
                    disabled={disabling}
                    style={{
                      padding: '0.5rem 0.75rem',
                      background: disabling ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
                      color: disabling ? '#94a3b8' : '#ef4444',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '0.375rem',
                      cursor: disabling ? 'not-allowed' : 'pointer',
                      fontSize: '0.85rem',
                    }}
                  >
                    {disabling ? 'Disabling...' : 'Disable Link'}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleEnable}
                  disabled={disabling}
                  style={{
                    padding: '0.5rem 0.75rem',
                    background: disabling ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.1)',
                    color: disabling ? '#94a3b8' : '#4ade80',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    borderRadius: '0.375rem',
                    cursor: disabling ? 'not-allowed' : 'pointer',
                    fontSize: '0.85rem',
                  }}
                >
                  {disabling ? 'Enabling...' : 'Enable Share Link'}
                </button>
              )}
            </div>

            {shareError && (
              <div
                role="alert"
                style={{
                  marginTop: '0.75rem',
                  padding: '0.5rem',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '0.375rem',
                  fontSize: '0.8rem',
                  color: '#ef4444',
                }}
              >
                {shareError}
              </div>
            )}

            <div aria-live="polite" aria-atomic="true" style={{ height: 0, overflow: 'hidden' }}>
              {shareCopied ? 'Share link copied to clipboard.' : ''}
            </div>
          </fieldset>
        </section>
      )}

      {!isOwner && (
        <section>
          <div
            style={{
              padding: '1rem',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
              Previewing as {previewMode === 'LINK_ONLY' ? 'Link-Only' : 'Platform Discoverable'} view.
              Only sections with visibility above Hidden are shown.
            </p>
          </div>
        </section>
      )}

      <section>
        <h2 style={{ color: '#f8fafc', fontSize: '1.25rem', marginBottom: '1rem' }}>
          {profile.displayName}
          {profile.professionalHeadline && (
            <span style={{ color: '#94a3b8', fontWeight: 400, fontSize: '1rem', marginLeft: '0.75rem' }}>
              {profile.professionalHeadline}
            </span>
          )}
        </h2>

        {profile.location && (
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
            {[profile.location.city, profile.location.countryName].filter(Boolean).join(', ')}
          </p>
        )}

        {profile.professionalSummary && (
          <p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            {profile.professionalSummary}
          </p>
        )}
      </section>

      {preferredJobRolesSection(profile.preferredJobRoles, profile.preferredWorkModes, profile.preferredEmploymentTypes, visibleSections, isOwner, hiddenSections)}

      {educationSection(profile.education, visibleSections, isOwner, hiddenSections)}
      {experienceSection(profile.experience, visibleSections, isOwner, hiddenSections)}
      {skillsSection(profile.skills, visibleSections, isOwner, hiddenSections)}
      {languagesSection(profile.languages, visibleSections, isOwner, hiddenSections)}
      {certificationsSection(profile.certifications, visibleSections, isOwner, hiddenSections)}
      {trainingSection(profile.training, visibleSections, isOwner, hiddenSections)}
      {achievementsSection(profile.achievements, visibleSections, isOwner, hiddenSections)}
      {professionalLinksSection(profile.professionalLinks, visibleSections, isOwner, hiddenSections)}

      <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#64748b', textAlign: 'center' }}>
        Last updated: {formatDate(profile.updatedAt)}
      </div>
    </div>
  );
}

function sectionContainer(children: React.ReactNode, key: string, label: string) {
  return (
    <section key={key} style={{ marginBottom: '1.5rem' }}>
      <h3 style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '1rem', marginBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.35rem' }}>
        {label}
      </h3>
      {children}
    </section>
  );
}

function hiddenSectionPlaceholder(key: string, label: string) {
  return (
    <section key={key} style={{ marginBottom: '1.5rem' }}>
      <h3 style={{ color: '#64748b', fontWeight: 600, fontSize: '1rem', marginBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.35rem' }}>
        {label}
      </h3>
      <div
        style={{
          padding: '1rem',
          background: 'rgba(255,255,255,0.02)',
          borderRadius: '0.375rem',
          border: '1px dashed rgba(255,255,255,0.08)',
        }}
      >
        <p style={{ color: '#64748b', fontSize: '0.8rem', fontStyle: 'italic', margin: 0 }}>
          This section is hidden. Only you can see this message.
        </p>
      </div>
    </section>
  );
}

function renderSection<T>(
  items: T[],
  key: string,
  label: string,
  renderItem: (item: T, idx: number) => React.ReactNode,
  _visibleSections: string[],
  isOwner: boolean,
  _hiddenSections: string[],
) {
  if (items.length === 0 && !isOwner) return null;
  if (items.length === 0) {
    return sectionContainer(
      <p style={{ color: '#64748b', fontSize: '0.85rem', fontStyle: 'italic', margin: 0 }}>No entries added yet.</p>,
      key,
      label,
    );
  }
  return sectionContainer(
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {items.map((item, idx) => renderItem(item, idx))}
    </div>,
    key,
    label,
  );
}

function educationCard(edu: PublicEducationRecord) {
  return (
    <div key={edu.id} style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.375rem', border: '1px solid rgba(255,255,255,0.06)' }}>
      <p style={{ color: '#f8fafc', fontWeight: 500, margin: 0 }}>{edu.qualification}</p>
      <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.15rem 0' }}>{edu.institutionName}</p>
      <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>
        {formatDateRange(edu.startDate, edu.endDate, edu.currentlyStudying)}
        {edu.grade ? ` | ${edu.grade}` : ''}
      </p>
      {edu.description && <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.35rem' }}>{edu.description}</p>}
    </div>
  );
}

function experienceCard(exp: PublicWorkExperienceRecord) {
  return (
    <div key={exp.id} style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.375rem', border: '1px solid rgba(255,255,255,0.06)' }}>
      <p style={{ color: '#f8fafc', fontWeight: 500, margin: 0 }}>{exp.jobTitle}</p>
      <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.15rem 0' }}>
        {exp.companyName}
        {exp.location ? ` - ${exp.location}` : ''}
        {exp.isRemote ? ' (Remote)' : ''}
      </p>
      <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>
        {formatDateRange(exp.startDate, exp.endDate, exp.currentlyWorking)}
        {' | '}{exp.employmentType.replace(/_/g, ' ')}
      </p>
      {exp.responsibilities && <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.35rem' }}>{exp.responsibilities}</p>}
      {exp.achievements && <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.2rem' }}>{exp.achievements}</p>}
    </div>
  );
}

function skillList(skills: PublicSkillRecord[]) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
      {skills.map((s) => (
        <span key={s.id} style={{
          padding: '0.35rem 0.65rem',
          background: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          borderRadius: '999px',
          fontSize: '0.8rem',
          color: '#a5b4fc',
        }}>
          {s.name}
          {s.level !== 'NOT_SPECIFIED' && ` - ${s.level.replace(/_/g, ' ')}`}
        </span>
      ))}
    </div>
  );
}

function languageList(languages: PublicLanguageRecord[]) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
      {languages.map((l) => (
        <span key={l.id} style={{
          padding: '0.35rem 0.65rem',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '0.375rem',
          fontSize: '0.8rem',
          color: '#cbd5e1',
        }}>
          {l.name} ({l.speaking}/{l.reading}/{l.writing})
        </span>
      ))}
    </div>
  );
}

function certificationCard(c: PublicCertificationRecord) {
  return (
    <div key={c.id} style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.375rem', border: '1px solid rgba(255,255,255,0.06)' }}>
      <p style={{ color: '#f8fafc', fontWeight: 500, margin: 0 }}>{c.name}</p>
      <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.15rem 0' }}>{c.issuer}</p>
      <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>
        Issued: {formatDate(c.issueDate)}
        {!c.doesNotExpire && c.expiryDate ? ` | Expires: ${formatDate(c.expiryDate)}` : c.doesNotExpire ? ' | No Expiry' : ''}
      </p>
      {c.credentialUrl && (
        <a href={c.credentialUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#818cf8', fontSize: '0.8rem' }}>
          View Credential
        </a>
      )}
    </div>
  );
}

function trainingCard(t: PublicTrainingRecord) {
  return (
    <div key={t.id} style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.375rem', border: '1px solid rgba(255,255,255,0.06)' }}>
      <p style={{ color: '#f8fafc', fontWeight: 500, margin: 0 }}>{t.title}</p>
      <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.15rem 0' }}>
        {t.provider}
        {t.durationHours ? ` (${t.durationHours}h)` : ''}
      </p>
      <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>Completed: {formatDate(t.completionDate)}</p>
      {t.description && <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.35rem' }}>{t.description}</p>}
    </div>
  );
}

function achievementCard(a: PublicAchievementRecord) {
  return (
    <div key={a.id} style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.375rem', border: '1px solid rgba(255,255,255,0.06)' }}>
      <p style={{ color: '#f8fafc', fontWeight: 500, margin: 0 }}>{a.title}</p>
      {a.issuer && <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.15rem 0' }}>{a.issuer}</p>}
      {a.achievedAt && <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>{formatDate(a.achievedAt)}</p>}
      {a.description && <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.35rem' }}>{a.description}</p>}
    </div>
  );
}

function professionalLinkCard(l: PublicProfessionalLinkRecord) {
  return (
    <a
      key={l.id}
      href={l.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        color: '#818cf8',
        fontSize: '0.85rem',
        textDecoration: 'none',
      }}
    >
      {l.label || l.type.replace(/_/g, ' ')}
    </a>
  );
}

function preferredJobRolesSection(
  jobRoles: string[],
  workModes: string[],
  employmentTypes: string[],
  visibleSections: string[],
  isOwner: boolean,
  hiddenSections: string[],
) {
  const key = 'LOCATION_AND_PREFERENCES';
  if (hiddenSections.includes(key)) {
    return isOwner ? hiddenSectionPlaceholder(key, 'Location & Preferences') : null;
  }
  if (!visibleSections.includes(key)) return null;
  if (jobRoles.length === 0 && workModes.length === 0 && employmentTypes.length === 0 && !isOwner) return null;
  return sectionContainer(
    <div>
      {jobRoles.length > 0 && (
        <div style={{ marginBottom: '0.5rem' }}>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Preferred Job Roles</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            {jobRoles.map((role, idx) => (
              <span key={idx} style={{
                padding: '0.25rem 0.5rem',
                background: 'rgba(99, 102, 241, 0.08)',
                borderRadius: '0.25rem',
                fontSize: '0.8rem',
                color: '#a5b4fc',
              }}>
                {role}
              </span>
            ))}
          </div>
        </div>
      )}
      {workModes.length > 0 && (
        <div style={{ marginBottom: '0.5rem' }}>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Work Modes</p>
          <p style={{ color: '#cbd5e1', fontSize: '0.85rem', margin: 0 }}>{workModes.join(', ')}</p>
        </div>
      )}
      {employmentTypes.length > 0 && (
        <div>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Employment Types</p>
          <p style={{ color: '#cbd5e1', fontSize: '0.85rem', margin: 0 }}>{employmentTypes.join(', ')}</p>
        </div>
      )}
    </div>,
    key,
    'Location & Preferences',
  );
}

function educationSection(
  items: PublicEducationRecord[],
  visibleSections: string[],
  isOwner: boolean,
  hiddenSections: string[],
) {
  if (hiddenSections.includes('EDUCATION')) return isOwner ? hiddenSectionPlaceholder('EDUCATION', 'Education') : null;
  if (!visibleSections.includes('EDUCATION')) return null;
  return renderSection(items, 'EDUCATION', 'Education', educationCard, visibleSections, isOwner, hiddenSections);
}

function experienceSection(
  items: PublicWorkExperienceRecord[],
  visibleSections: string[],
  isOwner: boolean,
  hiddenSections: string[],
) {
  if (hiddenSections.includes('WORK_EXPERIENCE')) return isOwner ? hiddenSectionPlaceholder('WORK_EXPERIENCE', 'Work Experience') : null;
  if (!visibleSections.includes('WORK_EXPERIENCE')) return null;
  return renderSection(items, 'WORK_EXPERIENCE', 'Work Experience', experienceCard, visibleSections, isOwner, hiddenSections);
}

function skillsSection(
  items: PublicSkillRecord[],
  visibleSections: string[],
  isOwner: boolean,
  hiddenSections: string[],
) {
  if (hiddenSections.includes('SKILLS_AND_LANGUAGES')) {
    return isOwner ? hiddenSectionPlaceholder('SKILLS_AND_LANGUAGES', 'Skills & Languages') : null;
  }
  if (!visibleSections.includes('SKILLS_AND_LANGUAGES')) return null;
  return sectionContainer(
    <div>
      {items.length > 0 ? skillList(items) : isOwner ? (
        <p style={{ color: '#64748b', fontSize: '0.85rem', fontStyle: 'italic', margin: 0 }}>No skills added yet.</p>
      ) : null}
    </div>,
    'SKILLS_AND_LANGUAGES',
    'Skills & Languages',
  );
}

function languagesSection(
  items: PublicLanguageRecord[],
  visibleSections: string[],
  isOwner: boolean,
  hiddenSections: string[],
) {
  if (hiddenSections.includes('SKILLS_AND_LANGUAGES')) return null;
  if (!visibleSections.includes('SKILLS_AND_LANGUAGES')) return null;
  return sectionContainer(
    items.length > 0 ? languageList(items) : isOwner ? (
      <p style={{ color: '#64748b', fontSize: '0.85rem', fontStyle: 'italic', margin: 0 }}>No languages added yet.</p>
    ) : null,
    'LANGUAGES',
    'Languages',
  );
}

function certificationsSection(
  items: PublicCertificationRecord[],
  visibleSections: string[],
  isOwner: boolean,
  hiddenSections: string[],
) {
  if (hiddenSections.includes('CERTIFICATIONS_AND_TRAINING')) return null;
  if (!visibleSections.includes('CERTIFICATIONS_AND_TRAINING')) return null;
  return renderSection(items, 'CERTIFICATIONS', 'Certifications', certificationCard, visibleSections, isOwner, hiddenSections);
}

function trainingSection(
  items: PublicTrainingRecord[],
  visibleSections: string[],
  isOwner: boolean,
  hiddenSections: string[],
) {
  if (hiddenSections.includes('CERTIFICATIONS_AND_TRAINING')) return null;
  if (!visibleSections.includes('CERTIFICATIONS_AND_TRAINING')) return null;
  return renderSection(items, 'TRAINING', 'Training', trainingCard, visibleSections, isOwner, hiddenSections);
}

function achievementsSection(
  items: PublicAchievementRecord[],
  visibleSections: string[],
  isOwner: boolean,
  hiddenSections: string[],
) {
  if (hiddenSections.includes('ACHIEVEMENTS_AND_LINKS')) return null;
  if (!visibleSections.includes('ACHIEVEMENTS_AND_LINKS')) return null;
  return renderSection(items, 'ACHIEVEMENTS', 'Achievements', achievementCard, visibleSections, isOwner, hiddenSections);
}

function professionalLinksSection(
  items: PublicProfessionalLinkRecord[],
  visibleSections: string[],
  isOwner: boolean,
  hiddenSections: string[],
) {
  if (hiddenSections.includes('ACHIEVEMENTS_AND_LINKS')) return null;
  if (!visibleSections.includes('ACHIEVEMENTS_AND_LINKS')) return null;
  return renderSection(items, 'PROFESSIONAL_LINKS', 'Professional Links', professionalLinkCard, visibleSections, isOwner, hiddenSections);
}
