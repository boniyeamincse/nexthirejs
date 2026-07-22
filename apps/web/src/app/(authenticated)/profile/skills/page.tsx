'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/providers/auth-context';
import {
  listMySkillRecords,
  createSkillRecord,
  updateSkillRecord,
  deleteSkillRecord,
  reorderSkillRecords,
} from '@/lib/api-client';
import type { CandidateProfileCompletion, CandidateSkillResult } from '@nexthire/types';
import type { CreateCandidateSkillInput, UpdateCandidateSkillInput } from '@nexthire/validation';
import styles from '@/app/(auth)/auth.module.css';
import { SkillList } from '@/features/candidate-profile/skills/SkillList';
import { SkillForm } from '@/features/candidate-profile/skills/SkillForm';

export default function SkillsPage() {
  const { getAccessToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<CandidateSkillResult[]>([]);
  const [completion, setCompletion] = useState<CandidateProfileCompletion | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CandidateSkillResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchRecords = useCallback(
    async (signal?: AbortSignal) => {
      const token = getAccessToken();
      if (!token) return;

      try {
        const data = await listMySkillRecords(token);
        if (!signal?.aborted) {
          setRecords(data.records);
          setCompletion(data.completion);
          setErrorMsg('');
        }
      } catch (err: unknown) {
        if (!signal?.aborted) {
          setErrorMsg(err instanceof Error ? err.message : 'Failed to load skills');
        }
      }
    },
    [getAccessToken],
  );

  useEffect(() => {
    const abortController = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchRecords(abortController.signal).finally(() => {
      if (!abortController.signal.aborted) {
        setLoading(false);
      }
    });
    return () => abortController.abort();
  }, [fetchRecords]);

  const handleAdd = useCallback(() => {
    setEditingRecord(null);
    setIsFormOpen(true);
    setErrorMsg('');
  }, []);

  const handleEdit = useCallback((record: CandidateSkillResult) => {
    setEditingRecord(record);
    setIsFormOpen(true);
    setErrorMsg('');
  }, []);

  const handleCancel = useCallback(() => {
    setIsFormOpen(false);
    setEditingRecord(null);
  }, []);

  const handleSave = useCallback(
    async (data: CreateCandidateSkillInput | UpdateCandidateSkillInput) => {
      const token = getAccessToken();
      if (!token) throw new Error('Not authenticated');

      if (editingRecord) {
        const result = await updateSkillRecord(
          token,
          editingRecord.id,
          data as UpdateCandidateSkillInput,
        );
        setRecords((prev) => prev.map((r) => (r.id === result.record.id ? result.record : r)));
        setCompletion(result.completion);
      } else {
        await createSkillRecord(token, data as CreateCandidateSkillInput);
        void fetchRecords();
      }

      setIsFormOpen(false);
      setEditingRecord(null);
    },
    [getAccessToken, editingRecord],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      const token = getAccessToken();
      if (!token) return;

      try {
        await deleteSkillRecord(token, id);
        setRecords((prev) => prev.filter((r) => r.id !== id));
        // Reload to get updated completion
        await fetchRecords();
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : 'Failed to delete skill');
      }
    },
    [getAccessToken, fetchRecords],
  );

  const handleReorder = useCallback(
    async (startIndex: number, endIndex: number) => {
      const token = getAccessToken();
      if (!token) return;

      const newRecords = Array.from(records);
      const [removed] = newRecords.splice(startIndex, 1);
      if (!removed) return;
      newRecords.splice(endIndex, 0, removed);

      // Optimistic UI update
      setRecords(newRecords);

      try {
        const orderedIds = newRecords.map((r) => r.id);
        await reorderSkillRecords(token, { orderedIds });
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : 'Failed to reorder skills');
        void fetchRecords();
      }
    },
    [getAccessToken, records, fetchRecords],
  );

  if (loading && records.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.background}></div>
        <div className={styles.glassCard} style={{ textAlign: 'center', padding: '4rem' }}>
          <p className={styles.subtitle}>Loading skills...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={styles.container}
      style={{ minHeight: 'calc(100vh - 72px)', padding: '2rem 1rem' }}
    >
      <div className={styles.background}></div>
      <div className={styles.glassCard} style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div
          className={styles.header}
          style={{
            marginBottom: '2rem',
            textAlign: 'left',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <a
              href="/profile"
              style={{
                display: 'inline-block',
                marginBottom: '0.5rem',
                color: '#a5b4fc',
                textDecoration: 'none',
                fontSize: '0.9rem',
              }}
            >
              ← Back to Basic Profile
            </a>
            <h1 className={styles.title} style={{ fontSize: '2rem' }}>
              Skills
            </h1>
            <p className={styles.subtitle}>Showcase your professional skills and expertise.</p>
          </div>

          {!isFormOpen && (
            <button
              onClick={handleAdd}
              style={{
                padding: '0.5rem 1rem',
                background: '#6366f1',
                color: '#fff',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              + Add Skill
            </button>
          )}
        </div>

        {!isFormOpen && completion && (
          <div
            style={{
              marginBottom: '2rem',
              padding: '1.5rem',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '0.75rem',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.75rem',
              }}
            >
              <h3 style={{ color: '#f8fafc', fontWeight: 600, margin: 0 }}>Profile Completion</h3>
              <span style={{ color: '#a5b4fc', fontWeight: 700, fontSize: '1.25rem' }}>
                {completion.percentage}%
              </span>
            </div>
            <div
              style={{
                width: '100%',
                height: '8px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${completion.percentage}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #6366f1, #a5b4fc)',
                  transition: 'width 0.5s ease',
                }}
              ></div>
            </div>
          </div>
        )}

        {errorMsg && !isFormOpen && (
          <div className={styles.errorContainer} style={{ marginBottom: '2rem' }}>
            <p className={styles.errorText}>{errorMsg}</p>
          </div>
        )}

        {isFormOpen ? (
          <SkillForm initialData={editingRecord} onSave={handleSave} onCancel={handleCancel} />
        ) : (
          <SkillList
            records={records}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onMoveUp={(index) => handleReorder(index, index - 1)}
            onMoveDown={(index) => handleReorder(index, index + 1)}
          />
        )}
      </div>
    </div>
  );
}
