'use client';
/* eslint-disable react-hooks/set-state-in-effect, @typescript-eslint/no-explicit-any */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type {
  CandidateProfileCompletion,
  CandidateAchievementResult,
  CandidateProfessionalLinkResult,
} from '@nexthire/types';
import type {
  CreateCandidateAchievementInput,
  UpdateCandidateAchievementInput,
} from '@nexthire/validation';
import type {
  CreateCandidateProfessionalLinkInput,
  UpdateCandidateProfessionalLinkInput,
} from '@nexthire/validation';
import { AchievementList } from '@/features/candidate-profile/achievements/AchievementList';
import { ProfessionalLinkList } from '@/features/candidate-profile/professional-links/ProfessionalLinkList';
import {
  listMyAchievementRecords,
  createAchievementRecord,
  updateAchievementRecord,
  deleteAchievementRecord,
  reorderAchievementRecords,
  listMyProfessionalLinkRecords,
  createProfessionalLinkRecord,
  updateProfessionalLinkRecord,
  deleteProfessionalLinkRecord,
  reorderProfessionalLinkRecords,
} from '@/lib/api-client';

interface CompletionBarProps {
  completion: CandidateProfileCompletion | null;
}

function CompletionBar({ completion }: CompletionBarProps) {
  if (!completion) return null;
  return (
    <div
      style={{
        marginBottom: '2rem',
        padding: '1rem',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '0.5rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Profile Completion</span>
        <span style={{ color: '#818cf8', fontSize: '0.85rem', fontWeight: 600 }}>
          {completion.percentage}%
        </span>
      </div>
      <div
        style={{
          width: '100%',
          height: '6px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '3px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${completion.percentage}%`,
            height: '100%',
            background: '#6366f1',
            borderRadius: '3px',
            transition: 'width 0.3s',
          }}
        />
      </div>
    </div>
  );
}

function getAccessToken(): string | null {
  try {
    const raw = localStorage.getItem('session');
    if (!raw) return null;
    const session = JSON.parse(raw);
    return session?.accessToken || null;
  } catch {
    return null;
  }
}

export default function AchievementsPage() {
  const router = useRouter();
  const [completion, setCompletion] = useState<CandidateProfileCompletion | null>(null);
  const [achievements, setAchievements] = useState<CandidateAchievementResult[]>([]);
  const [links, setLinks] = useState<CandidateProfessionalLinkResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [achievementFormOpen, setAchievementFormOpen] = useState(false);
  const [achievementEditingIndex, setAchievementEditingIndex] = useState<number | null>(null);
  const [achievementSaving, setAchievementSaving] = useState(false);
  const [achievementError, setAchievementError] = useState<string | null>(null);

  const [linkFormOpen, setLinkFormOpen] = useState(false);
  const [linkEditingIndex, setLinkEditingIndex] = useState<number | null>(null);
  const [linkSaving, setLinkSaving] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkDuplicateWarning, setLinkDuplicateWarning] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      router.push('/login');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [achResult, linkResult] = await Promise.all([
        listMyAchievementRecords(token),
        listMyProfessionalLinkRecords(token),
      ]);
      setAchievements(achResult.records);
      setLinks(linkResult.records);
      setCompletion(achResult.completion);
    } catch (err: any) {
      setError(err?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleSaveAchievement = async (
    data: CreateCandidateAchievementInput | UpdateCandidateAchievementInput,
  ) => {
    const token = getAccessToken();
    if (!token) return;

    setAchievementSaving(true);
    setAchievementError(null);
    try {
      if ('title' in data && 'issuer' in data && achievementEditingIndex !== null) {
        const record = achievements[achievementEditingIndex];
        if (!record) return;
        const result = await updateAchievementRecord(
          token,
          record.id,
          data as UpdateCandidateAchievementInput,
        );
        const updated = [...achievements];
        updated[achievementEditingIndex] = result.record;
        setAchievements(updated);
        setAchievementEditingIndex(null);
        if (result.completion) setCompletion(result.completion);
      } else {
        const result = await createAchievementRecord(
          token,
          data as CreateCandidateAchievementInput,
        );
        setAchievements([...achievements, result.record]);
        setAchievementFormOpen(false);
        if (result.completion) setCompletion(result.completion);
      }
    } catch (err: any) {
      setAchievementError(err?.message || 'Failed to save achievement');
    } finally {
      setAchievementSaving(false);
    }
  };

  const handleDeleteAchievement = async (id: string) => {
    const token = getAccessToken();
    if (!token) return;
    if (!window.confirm('Are you sure you want to delete this achievement?')) return;

    try {
      await deleteAchievementRecord(token, id);
      setAchievements(achievements.filter((a) => a.id !== id));
    } catch (err: any) {
      setAchievementError(err?.message || 'Failed to delete achievement');
    }
  };

  const handleReorderAchievements = async (fromIndex: number, toIndex: number) => {
    const token = getAccessToken();
    if (!token) return;

    const updated = [...achievements];
    const removed = updated.splice(fromIndex, 1);
    if (removed.length === 0) return;
    updated.splice(toIndex, 0, removed[0]!);
    setAchievements(updated);

    try {
      await reorderAchievementRecords(token, { orderedIds: updated.map((r) => r.id) });
    } catch (err: any) {
      setAchievementError(err?.message || 'Failed to reorder achievements');
    }
  };

  const handleSaveLink = async (
    data: CreateCandidateProfessionalLinkInput | UpdateCandidateProfessionalLinkInput,
  ) => {
    const token = getAccessToken();
    if (!token) return;

    setLinkSaving(true);
    setLinkError(null);
    setLinkDuplicateWarning(null);
    try {
      if ('type' in data && 'url' in data && linkEditingIndex !== null) {
        const record = links[linkEditingIndex];
        if (!record) return;
        const result = await updateProfessionalLinkRecord(
          token,
          record.id,
          data as UpdateCandidateProfessionalLinkInput,
        );
        const updated = [...links];
        updated[linkEditingIndex] = result.record;
        setLinks(updated);
        setLinkEditingIndex(null);
        if (result.completion) setCompletion(result.completion);
      } else {
        const result = await createProfessionalLinkRecord(
          token,
          data as CreateCandidateProfessionalLinkInput,
        );
        setLinks([...links, result.record]);
        setLinkFormOpen(false);
        if (result.completion) setCompletion(result.completion);
      }
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('DUPLICATE') || msg.includes('409')) {
        setLinkDuplicateWarning('A link with this URL already exists.');
      } else {
        setLinkError(msg || 'Failed to save link');
      }
    } finally {
      setLinkSaving(false);
    }
  };

  const handleDeleteLink = async (id: string) => {
    const token = getAccessToken();
    if (!token) return;
    if (!window.confirm('Are you sure you want to delete this link?')) return;

    try {
      await deleteProfessionalLinkRecord(token, id);
      setLinks(links.filter((l) => l.id !== id));
    } catch (err: any) {
      setLinkError(err?.message || 'Failed to delete link');
    }
  };

  const handleReorderLinks = async (fromIndex: number, toIndex: number) => {
    const token = getAccessToken();
    if (!token) return;

    const updated = [...links];
    const removed = updated.splice(fromIndex, 1);
    if (removed.length === 0) return;
    updated.splice(toIndex, 0, removed[0]!);
    setLinks(updated);

    try {
      await reorderProfessionalLinkRecords(token, { orderedIds: updated.map((r) => r.id) });
    } catch (err: any) {
      setLinkError(err?.message || 'Failed to reorder links');
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ color: '#94a3b8', textAlign: 'center', padding: '4rem 0' }}>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ color: '#ef4444', textAlign: 'center', padding: '4rem 0' }}>{error}</div>
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={fetchAll}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#6366f1',
              color: '#fff',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
        Achievements &amp; Professional Links
      </h1>
      <p style={{ color: '#94a3b8', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Showcase your accomplishments and connect your professional profiles.
      </p>

      <CompletionBar completion={completion} />

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '1rem' }}>Achievements</h2>
        <AchievementList
          records={achievements}
          onSave={handleSaveAchievement}
          onDelete={handleDeleteAchievement}
          onMoveUp={(i) => handleReorderAchievements(i, i - 1)}
          onMoveDown={(i) => handleReorderAchievements(i, i + 1)}
          editingIndex={achievementEditingIndex}
          setEditingIndex={setAchievementEditingIndex}
          showForm={achievementFormOpen}
          setShowForm={setAchievementFormOpen}
          saving={achievementSaving}
          errorMsg={achievementError}
        />
      </section>

      <section>
        <h2 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '1rem' }}>
          Professional Links
        </h2>
        <ProfessionalLinkList
          records={links}
          onSave={handleSaveLink}
          onDelete={handleDeleteLink}
          onMoveUp={(i) => handleReorderLinks(i, i - 1)}
          onMoveDown={(i) => handleReorderLinks(i, i + 1)}
          editingIndex={linkEditingIndex}
          setEditingIndex={setLinkEditingIndex}
          showForm={linkFormOpen}
          setShowForm={setLinkFormOpen}
          saving={linkSaving}
          errorMsg={linkError}
          duplicateWarning={linkDuplicateWarning}
        />
      </section>
    </div>
  );
}
