'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-context';
import { ApiClientError, getExpertiseAreas, createExpertService } from '@/lib/api-client';
import type { ExpertiseAreaResult, ExpertServiceType, SupportedCurrency } from '@nexthire/types';
import {
  EXPERT_SERVICE_TYPES,
  EXPERT_SERVICE_ALLOWED_DURATIONS,
  SUPPORTED_CURRENCIES,
} from '@nexthire/constants';

const SERVICE_TYPE_LABELS: Record<string, string> = {
  MOCK_INTERVIEW: 'Mock Interview',
  CV_REVIEW: 'CV Review',
  CAREER_COACHING: 'Career Coaching',
  TECHNICAL_INTERVIEW_PREPARATION: 'Technical Interview Prep',
  BEHAVIORAL_INTERVIEW_PREPARATION: 'Behavioral Interview Prep',
  PORTFOLIO_REVIEW: 'Portfolio Review',
};

export default function NewServicePage() {
  const { getAccessToken, logout, status: authStatus } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [catalog, setCatalog] = useState<ExpertiseAreaResult[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [expertiseAreaId, setExpertiseAreaId] = useState('');
  const [type, setType] = useState<ExpertServiceType>('MOCK_INTERVIEW');
  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [detailedDescription, setDetailedDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [priceAmount, setPriceAmount] = useState('');
  const [priceCurrency, setPriceCurrency] = useState<SupportedCurrency>('USD');
  const [languageCodes, setLanguageCodes] = useState('');
  const [preparationInstructions, setPreparationInstructions] = useState('');

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    try {
      const areas = await getExpertiseAreas();
      setCatalog(areas.filter((a) => a.isActive));
    } catch (err) {
      if (err instanceof ApiClientError && err.statusCode === 401) {
        await logout();
        return;
      }
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) return;

    setSaving(true);
    setSaveError(null);

    try {
      await createExpertService(token, {
        expertiseAreaId,
        type,
        title: title.trim(),
        shortDescription: shortDescription.trim(),
        detailedDescription: detailedDescription.trim(),
        durationMinutes,
        price: {
          amount: priceAmount,
          currency: priceCurrency,
        },
        languageCodes: languageCodes
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean),
        preparationInstructions: preparationInstructions.trim() || null,
      });
      router.push('/expert/services');
    } catch (err) {
      if (err instanceof ApiClientError && err.statusCode === 401) {
        await logout();
        return;
      }
      setSaveError(err instanceof Error ? err.message : 'Failed to create service.');
    } finally {
      setSaving(false);
    }
  }

  if (authStatus === 'unknown' || authStatus === 'loading' || loading) {
    return <p style={{ color: '#94a3b8' }}>Loading...</p>;
  }

  return (
    <div>
      <h1 style={{ color: '#f1f5f9', fontSize: '1.6rem', fontWeight: 700, margin: '0 0 0.35rem' }}>
        New Service
      </h1>
      <p style={{ color: '#94a3b8', margin: '0 0 1.5rem' }}>
        Create a new expert service offering.
      </p>

      {saveError && (
        <div
          role="alert"
          style={{
            padding: '0.75rem',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
            color: '#fca5a5',
          }}
        >
          {saveError}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          maxWidth: '640px',
        }}
      >
        <div>
          <label
            style={{
              display: 'block',
              color: '#cbd5e1',
              fontSize: '0.85rem',
              marginBottom: '0.35rem',
            }}
          >
            Expertise Area
          </label>
          <select
            value={expertiseAreaId}
            onChange={(e) => setExpertiseAreaId(e.target.value)}
            required
            style={selectStyle}
          >
            <option value="">Select...</option>
            {catalog.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            style={{
              display: 'block',
              color: '#cbd5e1',
              fontSize: '0.85rem',
              marginBottom: '0.35rem',
            }}
          >
            Type
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ExpertServiceType)}
            required
            style={selectStyle}
          >
            {EXPERT_SERVICE_TYPES.map((t) => (
              <option key={t} value={t}>
                {SERVICE_TYPE_LABELS[t] || t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            style={{
              display: 'block',
              color: '#cbd5e1',
              fontSize: '0.85rem',
              marginBottom: '0.35rem',
            }}
          >
            Title (5-150 characters)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            minLength={5}
            maxLength={150}
            style={inputStyle}
          />
        </div>

        <div>
          <label
            style={{
              display: 'block',
              color: '#cbd5e1',
              fontSize: '0.85rem',
              marginBottom: '0.35rem',
            }}
          >
            Short Description (30-300 characters)
          </label>
          <textarea
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            required
            minLength={30}
            maxLength={300}
            rows={3}
            style={textareaStyle}
          />
        </div>

        <div>
          <label
            style={{
              display: 'block',
              color: '#cbd5e1',
              fontSize: '0.85rem',
              marginBottom: '0.35rem',
            }}
          >
            Detailed Description (100-3000 characters)
          </label>
          <textarea
            value={detailedDescription}
            onChange={(e) => setDetailedDescription(e.target.value)}
            required
            minLength={100}
            maxLength={3000}
            rows={6}
            style={textareaStyle}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label
              style={{
                display: 'block',
                color: '#cbd5e1',
                fontSize: '0.85rem',
                marginBottom: '0.35rem',
              }}
            >
              Duration
            </label>
            <select
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              style={selectStyle}
            >
              {EXPERT_SERVICE_ALLOWED_DURATIONS.map((d) => (
                <option key={d} value={d}>
                  {d} minutes
                </option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1 }}>
            <label
              style={{
                display: 'block',
                color: '#cbd5e1',
                fontSize: '0.85rem',
                marginBottom: '0.35rem',
              }}
            >
              Price Amount
            </label>
            <input
              type="text"
              value={priceAmount}
              onChange={(e) => setPriceAmount(e.target.value)}
              required
              placeholder="0.00"
              style={inputStyle}
            />
          </div>

          <div style={{ flex: 1 }}>
            <label
              style={{
                display: 'block',
                color: '#cbd5e1',
                fontSize: '0.85rem',
                marginBottom: '0.35rem',
              }}
            >
              Currency
            </label>
            <select
              value={priceCurrency}
              onChange={(e) => setPriceCurrency(e.target.value as SupportedCurrency)}
              style={selectStyle}
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label
            style={{
              display: 'block',
              color: '#cbd5e1',
              fontSize: '0.85rem',
              marginBottom: '0.35rem',
            }}
          >
            Language Codes (comma-separated, e.g. en, bn)
          </label>
          <input
            type="text"
            value={languageCodes}
            onChange={(e) => setLanguageCodes(e.target.value)}
            required
            placeholder="en, bn, ur"
            style={inputStyle}
          />
        </div>

        <div>
          <label
            style={{
              display: 'block',
              color: '#cbd5e1',
              fontSize: '0.85rem',
              marginBottom: '0.35rem',
            }}
          >
            Preparation Instructions (optional, max 2000 characters)
          </label>
          <textarea
            value={preparationInstructions}
            onChange={(e) => setPreparationInstructions(e.target.value)}
            maxLength={2000}
            rows={4}
            style={textareaStyle}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '0.65rem 1.4rem',
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.5 : 1,
            }}
          >
            {saving ? 'Saving...' : 'Create Service'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/expert/services')}
            style={{
              padding: '0.65rem 1.4rem',
              background: 'transparent',
              color: '#cbd5e1',
              border: '1px solid #475569',
              borderRadius: '0.5rem',
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.6rem 0.75rem',
  background: '#0f172a',
  color: '#e2e8f0',
  border: '1px solid #334155',
  borderRadius: '0.375rem',
  fontSize: '0.9rem',
  boxSizing: 'border-box',
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: 'vertical',
  fontFamily: 'inherit',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'auto',
};
