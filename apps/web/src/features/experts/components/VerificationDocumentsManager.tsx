import { useRef, useState } from 'react';
import {
  EXPERT_LIMITS,
  EXPERT_ALLOWED_MIME_TYPES,
  EXPERT_ALLOWED_EXTENSIONS,
} from '@nexthire/constants';
import type {
  ExpertVerificationDocumentResult,
  ExpertVerificationDocumentTypeValue,
} from '@nexthire/types';
import type { UploadExpertVerificationDocumentInput } from '@/lib/api-client';
import {
  DOCUMENT_TYPE_PRESENTATION,
  PROFESSIONAL_PROOF_TYPES,
  formatBytes,
  formatDateTime,
} from '../lib/expert-presentation';

interface VerificationDocumentsManagerProps {
  documents: ExpertVerificationDocumentResult[];
  editable: boolean;
  onUpload: (input: UploadExpertVerificationDocumentInput) => Promise<void>;
  onRemove: (documentId: string) => Promise<void>;
}

const DOCUMENT_TYPES = Object.keys(
  DOCUMENT_TYPE_PRESENTATION,
) as ExpertVerificationDocumentTypeValue[];

function validateFile(file: File): string | null {
  const lowerName = file.name.toLowerCase();
  const hasAllowedExtension = EXPERT_ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
  const hasAllowedMime = (EXPERT_ALLOWED_MIME_TYPES as readonly string[]).includes(file.type);

  if (!hasAllowedExtension || (file.type && !hasAllowedMime)) {
    return 'Unsupported file type. Upload a PDF, JPEG, or PNG file.';
  }
  if (file.size > EXPERT_LIMITS.MAX_DOCUMENT_SIZE_BYTES) {
    return `File is too large. Maximum size is ${EXPERT_LIMITS.MAX_DOCUMENT_SIZE_MB} MB.`;
  }
  if (file.size === 0) {
    return 'File appears to be empty.';
  }
  return null;
}

function activeDocuments(documents: ExpertVerificationDocumentResult[]) {
  return documents.filter((doc) => !doc.removedAt);
}

export function VerificationDocumentsManager({
  documents,
  editable,
  onUpload,
  onRemove,
}: VerificationDocumentsManagerProps) {
  const [selectedType, setSelectedType] =
    useState<ExpertVerificationDocumentTypeValue>('GOVERNMENT_ID');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const active = activeDocuments(documents);
  const totalActive = active.length;

  const hasGovernmentId = active.some((doc) => doc.type === 'GOVERNMENT_ID');
  const hasProfessionalProof = active.some((doc) => PROFESSIONAL_PROOF_TYPES.includes(doc.type));

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setUploadError(validationError);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (totalActive >= EXPERT_LIMITS.MAX_DOCUMENTS) {
      setUploadError(`You can upload at most ${EXPERT_LIMITS.MAX_DOCUMENTS} documents.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploading(true);
    setAnnouncement(`Uploading ${file.name}…`);
    try {
      await onUpload({ type: selectedType, file });
      setAnnouncement(`${file.name} uploaded successfully.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed. Please try again.';
      setUploadError(message);
      setAnnouncement('Upload failed.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = async (documentId: string, fileName: string) => {
    setRemovingId(documentId);
    setAnnouncement(`Removing ${fileName}…`);
    try {
      await onRemove(documentId);
      setAnnouncement(`${fileName} removed.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove document.';
      setUploadError(message);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div>
      <p aria-live="polite" role="status" style={{ position: 'absolute', left: '-9999px' }}>
        {announcement}
      </p>

      {/* Semantic requirement checklist */}
      <section aria-label="Required documents checklist" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: '0 0 0.5rem', color: '#f1f5f9', fontSize: '1.05rem' }}>
          Required documents
        </h2>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          <li style={{ display: 'flex', gap: '0.6rem', padding: '0.4rem 0', color: '#e4e4e7' }}>
            <span
              aria-hidden="true"
              style={{ color: hasGovernmentId ? '#22c55e' : '#f59e0b', fontWeight: 700 }}
            >
              {hasGovernmentId ? '✓' : '○'}
            </span>
            <span>
              <span
                style={{
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginRight: '0.4rem',
                  color: hasGovernmentId ? '#22c55e' : '#f59e0b',
                }}
              >
                {hasGovernmentId ? 'Provided' : 'Required'}
              </span>
              One government-issued ID
            </span>
          </li>
          <li style={{ display: 'flex', gap: '0.6rem', padding: '0.4rem 0', color: '#e4e4e7' }}>
            <span
              aria-hidden="true"
              style={{ color: hasProfessionalProof ? '#22c55e' : '#f59e0b', fontWeight: 700 }}
            >
              {hasProfessionalProof ? '✓' : '○'}
            </span>
            <span>
              <span
                style={{
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginRight: '0.4rem',
                  color: hasProfessionalProof ? '#22c55e' : '#f59e0b',
                }}
              >
                {hasProfessionalProof ? 'Provided' : 'Required'}
              </span>
              One proof of profession (employment, professional certificate, or education)
            </span>
          </li>
        </ul>
      </section>

      {/* Privacy notice */}
      <p
        role="note"
        style={{
          margin: '0 0 1.25rem',
          padding: '0.75rem 0.9rem',
          borderRadius: '0.6rem',
          background: 'rgba(59,130,246,0.1)',
          border: '1px solid rgba(59,130,246,0.3)',
          color: '#bfdbfe',
          fontSize: '0.83rem',
        }}
      >
        Your documents are stored privately and are only accessible to authorised reviewers for a
        few minutes at a time. They are never shown publicly.
      </p>

      {/* Uploader */}
      {editable ? (
        <section
          aria-label="Upload a document"
          style={{
            marginBottom: '1.5rem',
            padding: '1.1rem',
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '0.75rem',
          }}
        >
          <div style={{ marginBottom: '0.85rem' }}>
            <label
              htmlFor="documentType"
              style={{
                display: 'block',
                color: '#e4e4e7',
                marginBottom: '0.35rem',
                fontWeight: 500,
                fontSize: '0.9rem',
              }}
            >
              Document type
            </label>
            <select
              id="documentType"
              value={selectedType}
              onChange={(e) =>
                setSelectedType(e.target.value as ExpertVerificationDocumentTypeValue)
              }
              disabled={uploading}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '0.5rem',
                color: '#f1f5f9',
              }}
            >
              {DOCUMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {DOCUMENT_TYPE_PRESENTATION[type].label}
                </option>
              ))}
            </select>
            <p
              id="documentType-hint"
              style={{ margin: '0.3rem 0 0', color: '#64748b', fontSize: '0.78rem' }}
            >
              {DOCUMENT_TYPE_PRESENTATION[selectedType].description}
            </p>
          </div>

          <label
            htmlFor="documentFile"
            style={{
              display: 'block',
              color: '#e4e4e7',
              marginBottom: '0.35rem',
              fontWeight: 500,
              fontSize: '0.9rem',
            }}
          >
            Choose a file (PDF, JPEG, or PNG, up to {EXPERT_LIMITS.MAX_DOCUMENT_SIZE_MB} MB)
          </label>
          <input
            ref={fileInputRef}
            id="documentFile"
            type="file"
            accept={EXPERT_ALLOWED_EXTENSIONS.join(',')}
            onChange={handleFileChange}
            disabled={uploading || totalActive >= EXPERT_LIMITS.MAX_DOCUMENTS}
            aria-describedby="documentType-hint documentFile-status"
            style={{ color: '#cbd5e1', fontSize: '0.85rem' }}
          />
          <p
            id="documentFile-status"
            style={{ margin: '0.5rem 0 0', color: '#94a3b8', fontSize: '0.8rem' }}
          >
            {uploading
              ? 'Uploading…'
              : `${totalActive} of ${EXPERT_LIMITS.MAX_DOCUMENTS} documents used.`}
          </p>

          {uploadError && (
            <p role="alert" style={{ margin: '0.5rem 0 0', color: '#fca5a5', fontSize: '0.85rem' }}>
              {uploadError}
            </p>
          )}
        </section>
      ) : (
        <p style={{ marginBottom: '1.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>
          Documents cannot be changed while your application is being reviewed.
        </p>
      )}

      {/* Uploaded documents list */}
      <section aria-label="Uploaded documents">
        <h2 style={{ margin: '0 0 0.6rem', color: '#f1f5f9', fontSize: '1.05rem' }}>
          Uploaded documents ({totalActive})
        </h2>

        {totalActive === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No documents uploaded yet.</p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {active.map((doc) => (
              <li
                key={doc.id}
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  padding: '0.85rem 1rem',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '0.6rem',
                  marginBottom: '0.6rem',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, color: '#f1f5f9', fontWeight: 600, fontSize: '0.9rem' }}>
                    {DOCUMENT_TYPE_PRESENTATION[doc.type].label}
                  </p>
                  <p
                    style={{
                      margin: '0.15rem 0 0',
                      color: '#94a3b8',
                      fontSize: '0.8rem',
                      wordBreak: 'break-all',
                    }}
                  >
                    {doc.originalFileName} · {formatBytes(doc.sizeBytes)} ·{' '}
                    {formatDateTime(doc.uploadedAt)}
                  </p>
                </div>
                {editable && (
                  <button
                    type="button"
                    onClick={() => handleRemove(doc.id, doc.originalFileName)}
                    disabled={removingId === doc.id}
                    aria-label={`Remove ${DOCUMENT_TYPE_PRESENTATION[doc.type].label}: ${doc.originalFileName}`}
                    style={{
                      padding: '0.4rem 0.85rem',
                      background: 'transparent',
                      border: '1px solid rgba(239,68,68,0.5)',
                      borderRadius: '0.45rem',
                      color: '#fca5a5',
                      fontSize: '0.82rem',
                      cursor: removingId === doc.id ? 'wait' : 'pointer',
                    }}
                  >
                    {removingId === doc.id ? 'Removing…' : 'Remove'}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
