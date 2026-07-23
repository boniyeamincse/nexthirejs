'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/providers/auth-context';
import {
  ApiClientError,
  getExpertiseAreas,
  getMyExpertExpertise,
  setMyExpertExpertise,
} from '@/lib/api-client';
import type {
  ExpertiseAreaResult,
  ExpertExpertiseItemResult,
  ExpertExpertiseLevel,
} from '@nexthire/types';
import { EXPERT_EXPERTISE_LEVELS } from '@nexthire/constants';

const LEVEL_COLORS: Record<ExpertExpertiseLevel, { bg: string; text: string }> = {
  INTERMEDIATE: { bg: 'rgba(59,130,246,0.15)', text: '#93c5fd' },
  ADVANCED: { bg: 'rgba(245,158,11,0.15)', text: '#fcd34d' },
  EXPERT: { bg: 'rgba(139,92,246,0.15)', text: '#c4b5fd' },
};

const LEVEL_LABELS: Record<ExpertExpertiseLevel, string> = {
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
  EXPERT: 'Expert',
};

export default function ExpertisePage() {
  const { getAccessToken, logout, status: authStatus } = useAuth();

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [expertise, setExpertise] = useState<ExpertExpertiseItemResult[]>([]);
  const [catalog, setCatalog] = useState<ExpertiseAreaResult[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<ExpertExpertiseLevel>('INTERMEDIATE');
  const [yearsExp, setYearsExp] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setPageError(null);
    try {
      const [expertiseResult, areas] = await Promise.all([
        getMyExpertExpertise(token),
        getExpertiseAreas(),
      ]);
      setExpertise(expertiseResult.items);
      setCatalog(areas.filter((a) => a.isActive));
    } catch (err) {
      if (err instanceof ApiClientError && err.statusCode === 401) {
        await logout();
        return;
      }
      setPageError('Failed to load expertise data. Please try again.');
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

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAreaId) return;

    const updated = [
      ...expertise,
      {
        id: '',
        expertiseAreaId: selectedAreaId,
        expertiseAreaSlug: catalog.find((a) => a.id === selectedAreaId)?.slug ?? '',
        expertiseAreaName: catalog.find((a) => a.id === selectedAreaId)?.name ?? '',
        level: selectedLevel,
        yearsExperience: yearsExp ? Number(yearsExp) : null,
        isPrimary,
      },
    ];

    const token = getAccessToken();
    if (!token) return;
    setSaving(true);
    setSaveError(null);
    try {
      const result = await setMyExpertExpertise(token, {
        items: updated.map((item) => ({
          expertiseAreaId: item.expertiseAreaId,
          level: item.level,
          yearsExperience: item.yearsExperience ?? undefined,
          isPrimary: item.isPrimary,
        })),
      });
      setExpertise(result.items);
      setShowForm(false);
      setSelectedAreaId('');
      setSelectedLevel('INTERMEDIATE');
      setYearsExp('');
      setIsPrimary(false);
    } catch (err) {
      if (err instanceof ApiClientError && err.statusCode === 401) {
        await logout();
        return;
      }
      setSaveError(err instanceof Error ? err.message : 'Failed to save expertise.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(areaId: string) {
    const token = getAccessToken();
    if (!token) return;
    setSaving(true);
    setSaveError(null);
    try {
      const filtered = expertise.filter((item) => item.expertiseAreaId !== areaId);
      const result = await setMyExpertExpertise(token, {
        items: filtered.map((item) => ({
          expertiseAreaId: item.expertiseAreaId,
          level: item.level,
          yearsExperience: item.yearsExperience ?? undefined,
          isPrimary: item.isPrimary,
        })),
      });
      setExpertise(result.items);
    } catch (err) {
      if (err instanceof ApiClientError && err.statusCode === 401) {
        await logout();
        return;
      }
      setSaveError(err instanceof Error ? err.message : 'Failed to delete expertise.');
    } finally {
      setSaving(false);
    }
  }

  if (authStatus === 'unknown' || authStatus === 'loading' || loading) {
    return <p style={{ color: '#94a3b8' }}>Loading...</p>;
  }

  const usedAreaIds = new Set(expertise.map((e) => e.expertiseAreaId));
  const availableAreas = catalog.filter((a) => !usedAreaIds.has(a.id));

  return (
    <div>
      <h1 style={{ color: '#f1f5f9', fontSize: '1.6rem', fontWeight: 700, margin: '0 0 0.35rem' }}>
        Expertise
      </h1>
      <p style={{ color: '#94a3b8', margin: '0 0 1.5rem' }}>Manage your areas of expertise.</p>

      {pageError && (
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
          {pageError}
          <button
            onClick={() => void load()}
            style={{
              marginLeft: '0.5rem',
              background: 'none',
              border: 'none',
              color: '#fca5a5',
              textDecoration: 'underline',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      )}

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

      <div
        style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}
      >
        {expertise.map((item) => {
          const colors = LEVEL_COLORS[item.level] || LEVEL_COLORS.INTERMEDIATE;
          return (
            <div
              key={item.expertiseAreaId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.85rem 1rem',
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '0.75rem',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}
                >
                  <span style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '0.95rem' }}>
                    {item.expertiseAreaName}
                  </span>
                  {item.isPrimary && (
                    <span
                      style={{
                        padding: '0.15rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: 'rgba(37,99,235,0.2)',
                        color: '#93c5fd',
                      }}
                    >
                      Primary
                    </span>
                  )}
                </div>
                <div
                  style={{ display: 'flex', gap: '0.75rem', marginTop: '0.3rem', flexWrap: 'wrap' }}
                >
                  <span
                    style={{
                      padding: '0.15rem 0.5rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      background: colors.bg,
                      color: colors.text,
                    }}
                  >
                    {LEVEL_LABELS[item.level]}
                  </span>
                  {item.yearsExperience != null && (
                    <span style={{ color: '#94a3b8', fontSize: '0.83rem' }}>
                      {item.yearsExperience} yr{item.yearsExperience !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDelete(item.expertiseAreaId)}
                disabled={saving}
                style={{
                  padding: '0.4rem 0.75rem',
                  background: 'transparent',
                  color: '#fca5a5',
                  border: '1px solid rgba(239,68,68,0.4)',
                  borderRadius: '0.375rem',
                  fontSize: '0.83rem',
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                Remove
              </button>
            </div>
          );
        })}
      </div>

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          disabled={availableAreas.length === 0}
          style={{
            padding: '0.6rem 1.2rem',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '0.5rem',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: availableAreas.length === 0 ? 'not-allowed' : 'pointer',
            opacity: availableAreas.length === 0 ? 0.5 : 1,
          }}
        >
          Add Expertise
        </button>
      )}

      {showForm && (
        <form
          onSubmit={handleAdd}
          style={{
            marginTop: '1rem',
            padding: '1.25rem',
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
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
              value={selectedAreaId}
              onChange={(e) => setSelectedAreaId(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.6rem 0.75rem',
                background: '#0f172a',
                color: '#e2e8f0',
                border: '1px solid #334155',
                borderRadius: '0.375rem',
                fontSize: '0.9rem',
              }}
            >
              <option value="">Select area...</option>
              {availableAreas.map((area) => (
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
              Level
            </label>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value as ExpertExpertiseLevel)}
              style={{
                width: '100%',
                padding: '0.6rem 0.75rem',
                background: '#0f172a',
                color: '#e2e8f0',
                border: '1px solid #334155',
                borderRadius: '0.375rem',
                fontSize: '0.9rem',
              }}
            >
              {EXPERT_EXPERTISE_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {LEVEL_LABELS[level]}
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
              Years of Experience
            </label>
            <input
              type="number"
              min={1}
              max={60}
              value={yearsExp}
              onChange={(e) => setYearsExp(e.target.value)}
              placeholder="Optional"
              style={{
                width: '100%',
                padding: '0.6rem 0.75rem',
                background: '#0f172a',
                color: '#e2e8f0',
                border: '1px solid #334155',
                borderRadius: '0.375rem',
                fontSize: '0.9rem',
              }}
            />
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#cbd5e1',
              fontSize: '0.9rem',
            }}
          >
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              style={{ accentColor: '#2563eb' }}
            />
            Mark as primary expertise
          </label>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="submit"
              disabled={saving || !selectedAreaId}
              style={{
                padding: '0.6rem 1.2rem',
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: saving || !selectedAreaId ? 'not-allowed' : 'pointer',
                opacity: saving || !selectedAreaId ? 0.5 : 1,
              }}
            >
              {saving ? 'Saving...' : 'Add'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              style={{
                padding: '0.6rem 1.2rem',
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
      )}
    </div>
  );
}
