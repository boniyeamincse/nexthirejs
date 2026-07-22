'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getSharedProfile } from '@/lib/api-client';
import type { PublicCandidateProfile } from '@nexthire/types';

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

function SectionCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '1.5rem' }}>
      <h3
        style={{
          color: '#e2e8f0',
          fontWeight: 600,
          fontSize: '1rem',
          marginBottom: '0.75rem',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          paddingBottom: '0.35rem',
        }}
      >
        {label}
      </h3>
      {children}
    </section>
  );
}

export default function SharedProfilePage() {
  const params = useParams<{ token: string }>();
  const [profile, setProfile] = useState<PublicCandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      setLoading(true);
      setError(null);
      try {
        const data = await getSharedProfile(params.token);
        if (cancelled) return;
        if (!data) {
          setError('This shared profile link is invalid or has expired.');
          return;
        }
        setProfile(data);
      } catch (err: unknown) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load shared profile.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, [params.token]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f0f1a',
          color: '#94a3b8',
        }}
      >
        <p>Loading shared profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f0f1a',
          color: '#94a3b8',
          flexDirection: 'column',
          gap: '1rem',
          padding: '1rem',
          textAlign: 'center',
        }}
      >
        <h1 style={{ color: '#f8fafc', fontSize: '1.5rem', margin: 0 }}>
          Shared Profile Unavailable
        </h1>
        <p style={{ margin: 0, maxWidth: '400px' }}>{error}</p>
        <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>
          The link you followed may have been rotated or disabled by the profile owner.
        </p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f0f1a',
          color: '#94a3b8',
        }}
      >
        <p>Profile not found.</p>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0f0f1a',
        color: '#f8fafc',
        padding: '2rem 1rem',
      }}
    >
      <div
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '0.75rem',
          padding: '2rem',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <section>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            {profile.displayName}
          </h1>
          {profile.professionalHeadline && (
            <p style={{ color: '#94a3b8', fontSize: '1rem', marginBottom: '0.75rem' }}>
              {profile.professionalHeadline}
            </p>
          )}
          {profile.location && (
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
              {[profile.location.city, profile.location.countryName].filter(Boolean).join(', ')}
            </p>
          )}
          {profile.professionalSummary && (
            <p
              style={{
                color: '#cbd5e1',
                fontSize: '0.9rem',
                lineHeight: 1.6,
                marginBottom: '1.5rem',
              }}
            >
              {profile.professionalSummary}
            </p>
          )}
        </section>

        {profile.preferredJobRoles.length > 0 && (
          <SectionCard label="Preferred Job Roles">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {profile.preferredJobRoles.map((role, idx) => (
                <span
                  key={idx}
                  style={{
                    padding: '0.25rem 0.5rem',
                    background: 'rgba(99, 102, 241, 0.08)',
                    borderRadius: '0.25rem',
                    fontSize: '0.8rem',
                    color: '#a5b4fc',
                  }}
                >
                  {role}
                </span>
              ))}
            </div>
          </SectionCard>
        )}

        {profile.education.length > 0 && (
          <SectionCard label="Education">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {profile.education.map((edu) => (
                <div
                  key={edu.id}
                  style={{
                    padding: '0.75rem',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '0.375rem',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <p style={{ color: '#f8fafc', fontWeight: 500, margin: 0 }}>
                    {edu.qualification}
                  </p>
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.15rem 0' }}>
                    {edu.institutionName}
                  </p>
                  <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>
                    {formatDateRange(edu.startDate, edu.endDate, edu.currentlyStudying)}
                    {edu.grade ? ` | ${edu.grade}` : ''}
                  </p>
                  {edu.description && (
                    <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.35rem' }}>
                      {edu.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {profile.experience.length > 0 && (
          <SectionCard label="Work Experience">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {profile.experience.map((exp) => (
                <div
                  key={exp.id}
                  style={{
                    padding: '0.75rem',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '0.375rem',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <p style={{ color: '#f8fafc', fontWeight: 500, margin: 0 }}>{exp.jobTitle}</p>
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.15rem 0' }}>
                    {exp.companyName}
                    {exp.location ? ` - ${exp.location}` : ''}
                    {exp.isRemote ? ' (Remote)' : ''}
                  </p>
                  <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>
                    {formatDateRange(exp.startDate, exp.endDate, exp.currentlyWorking)}
                    {' | '}
                    {exp.employmentType.replace(/_/g, ' ')}
                  </p>
                  {exp.responsibilities && (
                    <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.35rem' }}>
                      {exp.responsibilities}
                    </p>
                  )}
                  {exp.achievements && (
                    <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                      {exp.achievements}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {profile.skills.length > 0 && (
          <SectionCard label="Skills">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {profile.skills.map((s) => (
                <span
                  key={s.id}
                  style={{
                    padding: '0.35rem 0.65rem',
                    background: 'rgba(99, 102, 241, 0.1)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    borderRadius: '999px',
                    fontSize: '0.8rem',
                    color: '#a5b4fc',
                  }}
                >
                  {s.name}
                  {s.level !== 'NOT_SPECIFIED' && ` - ${s.level.replace(/_/g, ' ')}`}
                </span>
              ))}
            </div>
          </SectionCard>
        )}

        {profile.languages.length > 0 && (
          <SectionCard label="Languages">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {profile.languages.map((l) => (
                <span
                  key={l.id}
                  style={{
                    padding: '0.35rem 0.65rem',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '0.375rem',
                    fontSize: '0.8rem',
                    color: '#cbd5e1',
                  }}
                >
                  {l.name} ({l.speaking}/{l.reading}/{l.writing})
                </span>
              ))}
            </div>
          </SectionCard>
        )}

        {profile.certifications.length > 0 && (
          <SectionCard label="Certifications">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {profile.certifications.map((c) => (
                <div
                  key={c.id}
                  style={{
                    padding: '0.75rem',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '0.375rem',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <p style={{ color: '#f8fafc', fontWeight: 500, margin: 0 }}>{c.name}</p>
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.15rem 0' }}>
                    {c.issuer}
                  </p>
                  <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>
                    Issued: {formatDate(c.issueDate)}
                    {!c.doesNotExpire && c.expiryDate
                      ? ` | Expires: ${formatDate(c.expiryDate)}`
                      : c.doesNotExpire
                        ? ' | No Expiry'
                        : ''}
                  </p>
                  {c.credentialUrl && (
                    <a
                      href={c.credentialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#818cf8', fontSize: '0.8rem' }}
                    >
                      View Credential
                    </a>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {profile.training.length > 0 && (
          <SectionCard label="Training">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {profile.training.map((t) => (
                <div
                  key={t.id}
                  style={{
                    padding: '0.75rem',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '0.375rem',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <p style={{ color: '#f8fafc', fontWeight: 500, margin: 0 }}>{t.title}</p>
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.15rem 0' }}>
                    {t.provider}
                    {t.durationHours ? ` (${t.durationHours}h)` : ''}
                  </p>
                  <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>
                    Completed: {formatDate(t.completionDate)}
                  </p>
                  {t.description && (
                    <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.35rem' }}>
                      {t.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {profile.achievements.length > 0 && (
          <SectionCard label="Achievements">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {profile.achievements.map((a) => (
                <div
                  key={a.id}
                  style={{
                    padding: '0.75rem',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '0.375rem',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <p style={{ color: '#f8fafc', fontWeight: 500, margin: 0 }}>{a.title}</p>
                  {a.issuer && (
                    <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.15rem 0' }}>
                      {a.issuer}
                    </p>
                  )}
                  {a.achievedAt && (
                    <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>
                      {formatDate(a.achievedAt)}
                    </p>
                  )}
                  {a.description && (
                    <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.35rem' }}>
                      {a.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {profile.professionalLinks.length > 0 && (
          <SectionCard label="Professional Links">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {profile.professionalLinks.map((l) => (
                <a
                  key={l.id}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#818cf8', fontSize: '0.85rem', textDecoration: 'none' }}
                >
                  {l.label || l.type.replace(/_/g, ' ')}
                </a>
              ))}
            </div>
          </SectionCard>
        )}

        <p
          style={{ marginTop: '2rem', fontSize: '0.75rem', color: '#64748b', textAlign: 'center' }}
        >
          Last updated: {formatDate(profile.updatedAt)}
        </p>
      </div>
    </div>
  );
}
