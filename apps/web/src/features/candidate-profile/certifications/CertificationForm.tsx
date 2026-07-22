import { useState } from 'react';
import type { CandidateCertificationResult } from '@nexthire/types';
import type {
  CreateCandidateCertificationInput,
  UpdateCandidateCertificationInput,
} from '@nexthire/validation';

interface CertificationFormProps {
  initialData?: CandidateCertificationResult | null;
  onSave: (data: CreateCandidateCertificationInput | UpdateCandidateCertificationInput) => void;
  onCancel: () => void;
}

export function CertificationForm({ initialData, onSave, onCancel }: CertificationFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [issuer, setIssuer] = useState(initialData?.issuer || '');
  const [issueDate, setIssueDate] = useState(
    initialData ? initialData.issueDate.split('T')[0] || '' : '',
  );
  const [expiryDate, setExpiryDate] = useState(
    initialData && initialData.expiryDate ? initialData.expiryDate.split('T')[0] || '' : '',
  );
  const [doesNotExpire, setDoesNotExpire] = useState(initialData?.doesNotExpire || false);
  const [credentialId, setCredentialId] = useState(initialData?.credentialId || '');
  const [credentialUrl, setCredentialUrl] = useState(initialData?.credentialUrl || '');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Certification name is required');
      return;
    }
    if (!issuer.trim()) {
      setErrorMsg('Issuer is required');
      return;
    }
    if (!issueDate) {
      setErrorMsg('Issue date is required');
      return;
    }

    if (
      credentialUrl &&
      !credentialUrl.startsWith('http://') &&
      !credentialUrl.startsWith('https://')
    ) {
      setErrorMsg('Credential URL must start with http:// or https://');
      return;
    }

    const data: Record<string, unknown> = {
      name: name.trim(),
      issuer: issuer.trim(),
      issueDate: new Date(issueDate).toISOString(),
      doesNotExpire,
    };

    if (expiryDate && !doesNotExpire) {
      data.expiryDate = new Date(expiryDate).toISOString();
    } else {
      data.expiryDate = null;
    }

    if (credentialId.trim()) {
      data.credentialId = credentialId.trim();
    } else {
      data.credentialId = null;
    }

    if (credentialUrl.trim()) {
      data.credentialUrl = credentialUrl.trim();
    } else {
      data.credentialUrl = null;
    }

    onSave(data as CreateCandidateCertificationInput | UpdateCandidateCertificationInput);
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
    >
      <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '0.5rem' }}>
        {initialData ? 'Edit Certification' : 'Add New Certification'}
      </h3>

      {errorMsg && (
        <div
          style={{
            padding: '0.75rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '0.5rem',
            color: '#fca5a5',
            fontSize: '0.9rem',
          }}
        >
          {errorMsg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label
            style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#cbd5e1',
              fontSize: '0.9rem',
            }}
          >
            Certification Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. AWS Solutions Architect"
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '0.5rem',
              color: '#f8fafc',
              fontSize: '0.95rem',
            }}
            maxLength={200}
          />
        </div>

        <div>
          <label
            style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#cbd5e1',
              fontSize: '0.9rem',
            }}
          >
            Issuer *
          </label>
          <input
            type="text"
            value={issuer}
            onChange={(e) => setIssuer(e.target.value)}
            placeholder="e.g. Amazon Web Services"
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '0.5rem',
              color: '#f8fafc',
              fontSize: '0.95rem',
            }}
            maxLength={200}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label
            style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#cbd5e1',
              fontSize: '0.9rem',
            }}
          >
            Issue Date *
          </label>
          <input
            type="date"
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '0.5rem',
              color: '#f8fafc',
              fontSize: '0.95rem',
            }}
          />
        </div>

        <div>
          <label
            style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#cbd5e1',
              fontSize: '0.9rem',
            }}
          >
            Expiry Date {!doesNotExpire && '*'}
          </label>
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            disabled={doesNotExpire}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '0.5rem',
              color: '#f8fafc',
              fontSize: '0.95rem',
              opacity: doesNotExpire ? 0.5 : 1,
            }}
          />
        </div>
      </div>

      <div>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#cbd5e1',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={doesNotExpire}
            onChange={(e) => {
              setDoesNotExpire(e.target.checked);
              if (e.target.checked) setExpiryDate('');
            }}
            style={{ width: '1.25rem', height: '1.25rem', accentColor: '#6366f1' }}
          />
          This certification does not expire
        </label>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label
            style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#cbd5e1',
              fontSize: '0.9rem',
            }}
          >
            Credential ID (optional)
          </label>
          <input
            type="text"
            value={credentialId}
            onChange={(e) => setCredentialId(e.target.value)}
            placeholder="e.g. AWS-12345"
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '0.5rem',
              color: '#f8fafc',
              fontSize: '0.95rem',
            }}
            maxLength={150}
          />
        </div>

        <div>
          <label
            style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#cbd5e1',
              fontSize: '0.9rem',
            }}
          >
            Credential URL (optional)
          </label>
          <input
            type="url"
            value={credentialUrl}
            onChange={(e) => setCredentialUrl(e.target.value)}
            placeholder="https://verify.example.com/cred"
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '0.5rem',
              color: '#f8fafc',
              fontSize: '0.95rem',
            }}
            maxLength={500}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <button
          type="submit"
          style={{
            flex: 1,
            padding: '0.75rem',
            background: '#6366f1',
            color: '#fff',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: '0.95rem',
          }}
        >
          {initialData ? 'Update Certification' : 'Add Certification'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            flex: 1,
            padding: '0.75rem',
            background: 'rgba(255,255,255,0.05)',
            color: '#cbd5e1',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: '0.95rem',
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
