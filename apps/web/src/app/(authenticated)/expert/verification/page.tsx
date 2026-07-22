'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ApiClientError,
  uploadExpertVerificationDocument,
  removeExpertVerificationDocument,
  submitMyExpertApplication,
  type UploadExpertVerificationDocumentInput,
} from '@/lib/api-client';
import { useExpertApplicant } from '@/features/experts/hooks/useExpertApplicant';
import { VerificationDocumentsManager } from '@/features/experts/components/VerificationDocumentsManager';
import { ReadinessSummary } from '@/features/experts/components/ReadinessSummary';
import { ExpertNav } from '@/features/experts/components/ExpertNav';
import { StatusBadge } from '@/features/experts/components/StatusBadge';
import { isApplicationEditable } from '@/features/experts/lib/expert-presentation';

export default function ExpertVerificationPage() {
  const { authStatus, loading, error, application, documents, readiness, refetch, getAccessToken } =
    useExpertApplicant();

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const editable = application ? isApplicationEditable(application.status) : false;

  const handleUpload = async (input: UploadExpertVerificationDocumentInput) => {
    const token = getAccessToken();
    if (!token) return;
    await uploadExpertVerificationDocument(token, input);
    await refetch();
  };

  const handleRemove = async (documentId: string) => {
    const token = getAccessToken();
    if (!token) return;
    await removeExpertVerificationDocument(token, documentId);
    await refetch();
  };

  const handleSubmit = async () => {
    const token = getAccessToken();
    if (!token) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await submitMyExpertApplication(token);
      setSubmitted(true);
      await refetch();
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (
          err.errors?.some((e) => e.code === 'MFA_REQUIRED_BY_POLICY') ||
          err.statusCode === 403
        ) {
          setSubmitError(
            'Two-factor authentication (MFA) is required before you can submit. Enable MFA in account security, then try again.',
          );
        } else {
          setSubmitError(err.message);
        }
      } else {
        setSubmitError('We could not submit your application. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (authStatus === 'unknown' || authStatus === 'loading' || loading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <p style={{ color: '#94a3b8' }}>Loading verification…</p>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <h1 style={{ color: '#f1f5f9', fontSize: '1.6rem', fontWeight: 700 }}>
          Verification documents
        </h1>
        <p style={{ color: '#94a3b8', margin: '0.75rem 0 1.25rem' }}>
          You need to start an expert application before uploading documents.
        </p>
        <Link href="/become-an-expert" style={{ color: '#93c5fd', textDecoration: 'underline' }}>
          Start your application
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 style={{ color: '#f1f5f9', fontSize: '1.6rem', fontWeight: 700, margin: '0 0 0.35rem' }}>
        Verification documents
      </h1>
      <p style={{ color: '#94a3b8', margin: '0 0 1.25rem' }}>
        Upload the documents we need to verify your identity and profession.
      </p>

      <ExpertNav active="verification" />

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', margin: '1rem 0' }}>
        <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Application status:</span>
        <StatusBadge status={application.status} />
      </div>

      {error && (
        <div
          role="alert"
          style={{
            margin: '1rem 0',
            padding: '0.75rem 0.9rem',
            borderRadius: '0.6rem',
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.4)',
            color: '#fca5a5',
          }}
        >
          {error}{' '}
          <button
            onClick={() => void refetch()}
            style={{
              marginLeft: '0.5rem',
              textDecoration: 'underline',
              background: 'none',
              border: 'none',
              color: '#fca5a5',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      )}

      <div style={{ margin: '1.25rem 0' }}>
        <VerificationDocumentsManager
          documents={documents}
          editable={editable}
          onUpload={handleUpload}
          onRemove={handleRemove}
        />
      </div>

      {readiness && (
        <div style={{ margin: '1.5rem 0' }}>
          <ReadinessSummary readiness={readiness} />
        </div>
      )}

      {submitted && (
        <p role="status" style={{ margin: '1rem 0', color: '#86efac', fontSize: '0.95rem' }}>
          ✓ Application submitted. You can track progress on the{' '}
          <Link
            href="/expert/application-status"
            style={{ color: '#93c5fd', textDecoration: 'underline' }}
          >
            status page
          </Link>
          .
        </p>
      )}

      {submitError && (
        <p role="alert" style={{ margin: '1rem 0', color: '#fca5a5', fontSize: '0.9rem' }}>
          {submitError}
        </p>
      )}

      {editable && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !(readiness?.ready ?? false)}
          aria-describedby="submit-help"
          style={{
            marginTop: '0.5rem',
            padding: '0.7rem 1.6rem',
            background: submitting || !(readiness?.ready ?? false) ? '#334155' : '#15803d',
            color: '#fff',
            border: 'none',
            borderRadius: '0.5rem',
            fontWeight: 600,
            fontSize: '1rem',
            cursor: submitting || !(readiness?.ready ?? false) ? 'not-allowed' : 'pointer',
          }}
        >
          {submitting ? 'Submitting…' : 'Submit application'}
        </button>
      )}
      {editable && !(readiness?.ready ?? false) && (
        <p id="submit-help" style={{ marginTop: '0.5rem', color: '#94a3b8', fontSize: '0.82rem' }}>
          Complete every checklist item above to enable submission.
        </p>
      )}
    </div>
  );
}
