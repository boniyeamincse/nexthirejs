'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ApiClientError, getPublicExpertProfile } from '@/lib/api-client';
import type { PublicExpertProfileDetail } from '@nexthire/types';

const LEVEL_LABELS: Record<string, string> = {
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
  EXPERT: 'Expert',
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', gap: '1rem', padding: '0.4rem 0', fontSize: '0.9rem' }}>
      <span style={{ color: '#64748b', flex: '0 0 140px' }}>{label}</span>
      <span style={{ color: '#e2e8f0' }}>{value}</span>
    </div>
  );
}

export default function PublicExpertProfilePage() {
  const params = useParams<{ slug: string }>();
  const [detail, setDetail] = useState<PublicExpertProfileDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setNotFound(false);
    getPublicExpertProfile(params.slug)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiClientError && err.statusCode === 404) {
          setNotFound(true);
        } else {
          setError('We could not load this profile. Please try again.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [params.slug]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <p style={{ color: '#94a3b8' }}>Loading profile...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <p style={{ color: '#94a3b8' }}>This expert profile could not be found.</p>
        <Link href="/find-expert" style={{ color: '#93c5fd', textDecoration: 'underline' }}>
          Back to Find Expert
        </Link>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <p role="alert" style={{ color: '#fca5a5' }}>
          {error ?? 'Something went wrong.'}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Link
        href="/find-expert"
        style={{ color: '#93c5fd', textDecoration: 'underline', fontSize: '0.85rem' }}
      >
        ← Back to Find Expert
      </Link>

      <h1
        style={{
          color: '#f1f5f9',
          fontSize: '1.8rem',
          fontWeight: 700,
          margin: '0.75rem 0 0.25rem',
        }}
      >
        {detail.professionalTitle}
      </h1>
      <p style={{ color: '#94a3b8', margin: '0 0 1.5rem' }}>
        {[detail.currentPosition, detail.currentCompany].filter(Boolean).join(' at ')}
      </p>

      <section
        style={{
          padding: '1.25rem',
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '0.75rem',
          marginBottom: '1.5rem',
        }}
      >
        <h2 style={{ color: '#f1f5f9', fontSize: '1.05rem', margin: '0 0 0.75rem' }}>About</h2>
        <p style={{ color: '#cbd5e1', fontSize: '0.9rem', whiteSpace: 'pre-wrap', margin: 0 }}>
          {detail.professionalSummary}
        </p>
        <div style={{ marginTop: '1rem' }}>
          <Row label="Experience" value={`${detail.yearsOfExperience} years`} />
          <Row label="Education" value={detail.highestEducation} />
          <Row label="Location" value={detail.city ?? undefined} />
          <Row
            label="Languages"
            value={detail.interviewLanguages.length ? detail.interviewLanguages.join(', ') : undefined}
          />
          <Row
            label="Links"
            value={
              (detail.linkedinUrl || detail.portfolioUrl || detail.personalWebsiteUrl) && (
              <>
                {detail.linkedinUrl && (
                  <a
                    href={detail.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#93c5fd', marginRight: '0.75rem' }}
                  >
                    LinkedIn
                  </a>
                )}
                {detail.portfolioUrl && (
                  <a
                    href={detail.portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#93c5fd', marginRight: '0.75rem' }}
                  >
                    Portfolio
                  </a>
                )}
                {detail.personalWebsiteUrl && (
                  <a
                    href={detail.personalWebsiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#93c5fd' }}
                  >
                    Website
                  </a>
                )}
              </>
              )
            }
          />
        </div>
      </section>

      {detail.expertise.length > 0 && (
        <section
          style={{
            padding: '1.25rem',
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '0.75rem',
            marginBottom: '1.5rem',
          }}
        >
          <h2 style={{ color: '#f1f5f9', fontSize: '1.05rem', margin: '0 0 0.75rem' }}>
            Expertise
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {detail.expertise.map((e) => (
              <span
                key={e.areaSlug}
                style={{
                  padding: '0.3rem 0.8rem',
                  background: e.isPrimary ? 'rgba(99,102,241,0.15)' : '#0f172a',
                  border: `1px solid ${e.isPrimary ? 'rgba(99,102,241,0.4)' : '#334155'}`,
                  borderRadius: '9999px',
                  color: '#cbd5e1',
                  fontSize: '0.82rem',
                }}
              >
                {e.areaName} · {LEVEL_LABELS[e.level] ?? e.level}
              </span>
            ))}
          </div>
        </section>
      )}

      {detail.services.length > 0 && (
        <section
          style={{
            padding: '1.25rem',
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '0.75rem',
          }}
        >
          <h2 style={{ color: '#f1f5f9', fontSize: '1.05rem', margin: '0 0 0.75rem' }}>
            Services
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {detail.services.map((service) => (
              <div
                key={service.id}
                style={{
                  padding: '0.9rem',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '0.6rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                }}
              >
                <div>
                  <p style={{ margin: 0, color: '#f1f5f9', fontWeight: 600, fontSize: '0.92rem' }}>
                    {service.title}
                  </p>
                  <p style={{ margin: '0.2rem 0 0', color: '#94a3b8', fontSize: '0.82rem' }}>
                    {service.shortDescription}
                  </p>
                  <p style={{ margin: '0.2rem 0 0', color: '#64748b', fontSize: '0.78rem' }}>
                    {service.durationMinutes} min
                  </p>
                </div>
                <div style={{ color: '#f1f5f9', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {service.price.currency} {service.price.amount}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
