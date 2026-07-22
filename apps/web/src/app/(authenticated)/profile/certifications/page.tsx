'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/providers/auth-context';
import {
  listMyCertificationRecords,
  createCertificationRecord,
  updateCertificationRecord,
  deleteCertificationRecord,
  reorderCertificationRecords,
  listMyTrainingRecords,
  createTrainingRecord,
  updateTrainingRecord,
  deleteTrainingRecord,
  reorderTrainingRecords,
} from '@/lib/api-client';
import type {
  CandidateProfileCompletion,
  CandidateCertificationResult,
  CandidateTrainingResult,
} from '@nexthire/types';
import type {
  CreateCandidateCertificationInput,
  UpdateCandidateCertificationInput,
} from '@nexthire/validation';
import type {
  CreateCandidateTrainingInput,
  UpdateCandidateTrainingInput,
} from '@nexthire/validation';
import styles from '@/app/(auth)/auth.module.css';
import { CertificationList } from '@/features/candidate-profile/certifications/CertificationList';
import { CertificationForm } from '@/features/candidate-profile/certifications/CertificationForm';
import { TrainingList } from '@/features/candidate-profile/training/TrainingList';
import { TrainingForm } from '@/features/candidate-profile/training/TrainingForm';

export default function CertificationsPage() {
  const { getAccessToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [certRecords, setCertRecords] = useState<CandidateCertificationResult[]>([]);
  const [trainRecords, setTrainRecords] = useState<CandidateTrainingResult[]>([]);
  const [completion, setCompletion] = useState<CandidateProfileCompletion | null>(null);

  const [certFormOpen, setCertFormOpen] = useState(false);
  const [editingCert, setEditingCert] = useState<CandidateCertificationResult | null>(null);
  const [trainFormOpen, setTrainFormOpen] = useState(false);
  const [editingTrain, setEditingTrain] = useState<CandidateTrainingResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchRecords = useCallback(
    async (signal?: AbortSignal) => {
      const token = getAccessToken();
      if (!token) return;

      try {
        const [certData, trainData] = await Promise.all([
          listMyCertificationRecords(token),
          listMyTrainingRecords(token),
        ]);
        if (!signal?.aborted) {
          setCertRecords(certData.records);
          setTrainRecords(trainData.records);
          setCompletion(certData.completion);
          setErrorMsg('');
        }
      } catch (err: unknown) {
        if (!signal?.aborted) {
          setErrorMsg(err instanceof Error ? err.message : 'Failed to load records');
        }
      }
    },
    [getAccessToken],
  );

  useEffect(() => {
    const abortController = new AbortController();
    void fetchRecords(abortController.signal).finally(() => {
      if (!abortController.signal.aborted) {
        setLoading(false);
      }
    });
    return () => abortController.abort();
  }, [fetchRecords]);

  const handleAddCert = useCallback(() => {
    setEditingCert(null);
    setCertFormOpen(true);
    setErrorMsg('');
  }, []);

  const handleEditCert = useCallback((record: CandidateCertificationResult) => {
    setEditingCert(record);
    setCertFormOpen(true);
    setErrorMsg('');
  }, []);

  const handleCancelCert = useCallback(() => {
    setCertFormOpen(false);
    setEditingCert(null);
  }, []);

  const handleSaveCert = useCallback(
    async (data: CreateCandidateCertificationInput | UpdateCandidateCertificationInput) => {
      const token = getAccessToken();
      if (!token) throw new Error('Not authenticated');

      if (editingCert) {
        const result = await updateCertificationRecord(
          token,
          editingCert.id,
          data as UpdateCandidateCertificationInput,
        );
        setCertRecords((prev) => prev.map((r) => (r.id === result.record.id ? result.record : r)));
        setCompletion(result.completion);
      } else {
        await createCertificationRecord(token, data as CreateCandidateCertificationInput);
        void fetchRecords();
      }

      setCertFormOpen(false);
      setEditingCert(null);
    },
    [getAccessToken, editingCert, fetchRecords],
  );

  const handleDeleteCert = useCallback(
    async (id: string) => {
      const token = getAccessToken();
      if (!token) return;

      try {
        await deleteCertificationRecord(token, id);
        setCertRecords((prev) => prev.filter((r) => r.id !== id));
        await fetchRecords();
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : 'Failed to delete certification');
      }
    },
    [getAccessToken, fetchRecords],
  );

  const handleReorderCert = useCallback(
    async (startIndex: number, endIndex: number) => {
      const token = getAccessToken();
      if (!token) return;

      const newRecords = Array.from(certRecords);
      const [removed] = newRecords.splice(startIndex, 1);
      if (!removed) return;
      newRecords.splice(endIndex, 0, removed);

      setCertRecords(newRecords);

      try {
        const orderedIds = newRecords.map((r) => r.id);
        await reorderCertificationRecords(token, { orderedIds });
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : 'Failed to reorder certifications');
        void fetchRecords();
      }
    },
    [getAccessToken, certRecords, fetchRecords],
  );

  const handleAddTrain = useCallback(() => {
    setEditingTrain(null);
    setTrainFormOpen(true);
    setErrorMsg('');
  }, []);

  const handleEditTrain = useCallback((record: CandidateTrainingResult) => {
    setEditingTrain(record);
    setTrainFormOpen(true);
    setErrorMsg('');
  }, []);

  const handleCancelTrain = useCallback(() => {
    setTrainFormOpen(false);
    setEditingTrain(null);
  }, []);

  const handleSaveTrain = useCallback(
    async (data: CreateCandidateTrainingInput | UpdateCandidateTrainingInput) => {
      const token = getAccessToken();
      if (!token) throw new Error('Not authenticated');

      if (editingTrain) {
        const result = await updateTrainingRecord(
          token,
          editingTrain.id,
          data as UpdateCandidateTrainingInput,
        );
        setTrainRecords((prev) => prev.map((r) => (r.id === result.record.id ? result.record : r)));
        setCompletion(result.completion);
      } else {
        await createTrainingRecord(token, data as CreateCandidateTrainingInput);
        void fetchRecords();
      }

      setTrainFormOpen(false);
      setEditingTrain(null);
    },
    [getAccessToken, editingTrain, fetchRecords],
  );

  const handleDeleteTrain = useCallback(
    async (id: string) => {
      const token = getAccessToken();
      if (!token) return;

      try {
        await deleteTrainingRecord(token, id);
        setTrainRecords((prev) => prev.filter((r) => r.id !== id));
        await fetchRecords();
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : 'Failed to delete training');
      }
    },
    [getAccessToken, fetchRecords],
  );

  const handleReorderTrain = useCallback(
    async (startIndex: number, endIndex: number) => {
      const token = getAccessToken();
      if (!token) return;

      const newRecords = Array.from(trainRecords);
      const [removed] = newRecords.splice(startIndex, 1);
      if (!removed) return;
      newRecords.splice(endIndex, 0, removed);

      setTrainRecords(newRecords);

      try {
        const orderedIds = newRecords.map((r) => r.id);
        await reorderTrainingRecords(token, { orderedIds });
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : 'Failed to reorder training');
        void fetchRecords();
      }
    },
    [getAccessToken, trainRecords, fetchRecords],
  );

  if (loading && certRecords.length === 0 && trainRecords.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.background}></div>
        <div className={styles.glassCard} style={{ textAlign: 'center', padding: '4rem' }}>
          <p className={styles.subtitle}>Loading certifications and training...</p>
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
              Certifications &amp; Training
            </h1>
            <p className={styles.subtitle}>
              Manage your professional certifications and training records.
            </p>
          </div>
        </div>

        {completion && (
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

        {errorMsg && (
          <div className={styles.errorContainer} style={{ marginBottom: '2rem' }}>
            <p className={styles.errorText}>{errorMsg}</p>
          </div>
        )}

        {/* Certifications Section */}
        <div style={{ marginBottom: '3rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
            }}
          >
            <h2 style={{ color: '#f8fafc', fontSize: '1.5rem', margin: 0 }}>Certifications</h2>
            {!certFormOpen && (
              <button
                onClick={handleAddCert}
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
                + Add Certification
              </button>
            )}
          </div>

          {certFormOpen ? (
            <CertificationForm
              initialData={editingCert}
              onSave={handleSaveCert}
              onCancel={handleCancelCert}
            />
          ) : (
            <CertificationList
              records={certRecords}
              onEdit={handleEditCert}
              onDelete={handleDeleteCert}
              onMoveUp={(index) => handleReorderCert(index, index - 1)}
              onMoveDown={(index) => handleReorderCert(index, index + 1)}
            />
          )}
        </div>

        {/* Training Section */}
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
            }}
          >
            <h2 style={{ color: '#f8fafc', fontSize: '1.5rem', margin: 0 }}>Training</h2>
            {!trainFormOpen && (
              <button
                onClick={handleAddTrain}
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
                + Add Training
              </button>
            )}
          </div>

          {trainFormOpen ? (
            <TrainingForm
              initialData={editingTrain}
              onSave={handleSaveTrain}
              onCancel={handleCancelTrain}
            />
          ) : (
            <TrainingList
              records={trainRecords}
              onEdit={handleEditTrain}
              onDelete={handleDeleteTrain}
              onMoveUp={(index) => handleReorderTrain(index, index - 1)}
              onMoveDown={(index) => handleReorderTrain(index, index + 1)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
