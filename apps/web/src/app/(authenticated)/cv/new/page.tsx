'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-context';
import { createCv, ApiClientError } from '@/lib/api-client';

const TEMPLATES = [
  {
    value: 'ATS_OPTIMIZED',
    label: 'ATS Optimized',
    description: 'Clean, keyword-friendly layout for applicant tracking systems.',
  },
  {
    value: 'MODERN',
    label: 'Modern',
    description: 'Bold accent color, suited for tech and design roles.',
  },
  { value: 'CLASSIC', label: 'Classic', description: 'Traditional, conservative formatting.' },
  { value: 'MINIMAL', label: 'Minimal', description: 'Understated, typography-focused layout.' },
] as const;

const pageStyle: React.CSSProperties = {
  maxWidth: '32rem',
  margin: '0 auto',
  padding: '2rem 1.5rem',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  color: '#94a3b8',
  fontSize: '0.9rem',
  marginBottom: '0.4rem',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.6rem 0.75rem',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: '0.5rem',
  color: '#e2e8f0',
  fontSize: '0.95rem',
};

export default function NewCvPage() {
  const { getAccessToken } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [template, setTemplate] = useState<(typeof TEMPLATES)[number]['value']>('ATS_OPTIMIZED');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = title.trim();
    if (trimmed.length < 3) {
      setError('Title must be at least 3 characters.');
      return;
    }

    const token = getAccessToken();
    if (!token) return;

    setPending(true);
    try {
      const cv = await createCv(token, { title: trimmed, template });
      router.push(`/cv/${cv.id}`);
    } catch (err) {
      if (err instanceof ApiClientError && err.statusCode === 400) {
        setError('You have reached the maximum of 10 CVs. Delete one to create another.');
      } else {
        setError('Unable to create the CV right now. Please try again.');
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div style={pageStyle}>
      <h1 style={{ color: '#e2e8f0', fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.5rem' }}>
        Create a new CV
      </h1>

      {error && (
        <div
          role="alert"
          style={{
            color: '#fca5a5',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '0.5rem',
            padding: '0.65rem 0.85rem',
            marginBottom: '1rem',
            fontSize: '0.88rem',
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div style={{ marginBottom: '1.25rem' }}>
          <label htmlFor="cv-title" style={labelStyle}>
            CV title
          </label>
          <input
            id="cv-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={inputStyle}
            placeholder="e.g. Senior Backend Engineer CV"
            maxLength={200}
            required
          />
        </div>

        <fieldset style={{ border: 'none', padding: 0, marginBottom: '1.5rem' }}>
          <legend style={{ ...labelStyle, marginBottom: '0.6rem' }}>Template</legend>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {TEMPLATES.map((t) => (
              <label
                key={t.value}
                style={{
                  display: 'flex',
                  gap: '0.6rem',
                  padding: '0.75rem',
                  background:
                    template === t.value ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255,255,255,0.03)',
                  border:
                    template === t.value
                      ? '1px solid rgba(99, 102, 241, 0.5)'
                      : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="template"
                  value={t.value}
                  checked={template === t.value}
                  onChange={() => setTemplate(t.value)}
                  style={{ marginTop: '0.2rem' }}
                />
                <span>
                  <span
                    style={{
                      display: 'block',
                      color: '#e2e8f0',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                    }}
                  >
                    {t.label}
                  </span>
                  <span style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem' }}>
                    {t.description}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button
            type="submit"
            disabled={pending}
            style={{
              padding: '0.6rem 1.2rem',
              background: 'rgba(99, 102, 241, 0.85)',
              color: '#fff',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            {pending ? 'Creating…' : 'Create CV'}
          </button>
          <Link
            href="/cv"
            style={{
              padding: '0.6rem 1.2rem',
              background: 'rgba(255,255,255,0.06)',
              color: '#e2e8f0',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '0.5rem',
              fontWeight: 500,
              fontSize: '0.9rem',
              textDecoration: 'none',
            }}
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
