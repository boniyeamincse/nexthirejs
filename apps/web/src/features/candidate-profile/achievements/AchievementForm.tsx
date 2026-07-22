import { useState } from 'react';
import type { CandidateAchievementResult } from '@nexthire/types';
import type {
  CreateCandidateAchievementInput,
  UpdateCandidateAchievementInput,
} from '@nexthire/validation';

interface AchievementFormProps {
  initialData?: CandidateAchievementResult | null;
  onSave: (data: CreateCandidateAchievementInput | UpdateCandidateAchievementInput) => void;
  onCancel: () => void;
}

export function AchievementForm({ initialData, onSave, onCancel }: AchievementFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [issuer, setIssuer] = useState(initialData?.issuer || '');
  const [achievedAt, setAchievedAt] = useState(
    initialData?.achievedAt ? initialData.achievedAt.split('T')[0] || '' : '',
  );
  const [description, setDescription] = useState(initialData?.description || '');
  const [referenceUrl, setReferenceUrl] = useState(initialData?.referenceUrl || '');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('Achievement title is required');
      return;
    }

    if (
      referenceUrl &&
      !referenceUrl.startsWith('http://') &&
      !referenceUrl.startsWith('https://')
    ) {
      setErrorMsg('Reference URL must start with http:// or https://');
      return;
    }

    const data: Record<string, unknown> = {
      title: title.trim(),
    };

    if (issuer.trim()) {
      data.issuer = issuer.trim();
    } else {
      data.issuer = null;
    }

    if (achievedAt) {
      data.achievedAt = new Date(achievedAt).toISOString();
    } else {
      data.achievedAt = null;
    }

    if (description.trim()) {
      data.description = description.trim();
    } else {
      data.description = null;
    }

    if (referenceUrl.trim()) {
      data.referenceUrl = referenceUrl.trim();
    } else {
      data.referenceUrl = null;
    }

    onSave(data as CreateCandidateAchievementInput | UpdateCandidateAchievementInput);
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
    >
      <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '0.5rem' }}>
        {initialData ? 'Edit Achievement' : 'Add New Achievement'}
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
            Achievement Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Employee of the Year"
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
            Issuer/Organization
          </label>
          <input
            type="text"
            value={issuer}
            onChange={(e) => setIssuer(e.target.value)}
            placeholder="e.g. Google, Inc."
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
            Achieved Date
          </label>
          <input
            type="date"
            value={achievedAt}
            onChange={(e) => setAchievedAt(e.target.value)}
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
            Reference URL
          </label>
          <input
            type="url"
            value={referenceUrl}
            onChange={(e) => setReferenceUrl(e.target.value)}
            placeholder="https://example.com/achievement"
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

      <div>
        <label
          style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontSize: '0.9rem' }}
        >
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe this achievement..."
          style={{
            width: '100%',
            padding: '0.75rem',
            minHeight: '80px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '0.5rem',
            color: '#f8fafc',
            fontSize: '0.95rem',
            resize: 'vertical',
          }}
          maxLength={1500}
        />
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
          {initialData ? 'Update Achievement' : 'Add Achievement'}
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
