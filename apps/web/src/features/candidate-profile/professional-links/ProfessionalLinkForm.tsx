import { useState } from 'react';
import type { CandidateProfessionalLinkResult } from '@nexthire/types';
import { ProfessionalLinkType } from '@nexthire/types';
import type {
  CreateCandidateProfessionalLinkInput,
  UpdateCandidateProfessionalLinkInput,
} from '@nexthire/validation';

interface ProfessionalLinkFormProps {
  initialData?: CandidateProfessionalLinkResult | null;
  onSave: (
    data: CreateCandidateProfessionalLinkInput | UpdateCandidateProfessionalLinkInput,
  ) => void;
  onCancel: () => void;
}

const LINK_TYPES = [
  { value: ProfessionalLinkType.LINKEDIN, label: 'LinkedIn' },
  { value: ProfessionalLinkType.GITHUB, label: 'GitHub' },
  { value: ProfessionalLinkType.PORTFOLIO, label: 'Portfolio' },
  { value: ProfessionalLinkType.PERSONAL_WEBSITE, label: 'Personal Website' },
  { value: ProfessionalLinkType.BEHANCE, label: 'Behance' },
  { value: ProfessionalLinkType.DRIBBBLE, label: 'Dribbble' },
  { value: ProfessionalLinkType.STACK_OVERFLOW, label: 'Stack Overflow' },
  { value: ProfessionalLinkType.MEDIUM, label: 'Medium' },
  { value: ProfessionalLinkType.YOUTUBE, label: 'YouTube' },
  { value: ProfessionalLinkType.OTHER, label: 'Other' },
];

export function ProfessionalLinkForm({ initialData, onSave, onCancel }: ProfessionalLinkFormProps) {
  const [type, setType] = useState<ProfessionalLinkType>(
    initialData?.type || ProfessionalLinkType.LINKEDIN,
  );
  const [label, setLabel] = useState(initialData?.label || '');
  const [url, setUrl] = useState(initialData?.url || '');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!url.trim()) {
      setErrorMsg('URL is required');
      return;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setErrorMsg('URL must start with http:// or https://');
      return;
    }

    const data: Record<string, unknown> = {
      type,
      url: url.trim(),
    };

    if (label.trim()) {
      data.label = label.trim();
    } else {
      data.label = null;
    }

    onSave(data as CreateCandidateProfessionalLinkInput | UpdateCandidateProfessionalLinkInput);
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
    >
      <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '0.5rem' }}>
        {initialData ? 'Edit Professional Link' : 'Add New Professional Link'}
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
            Link Type *
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ProfessionalLinkType)}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '0.5rem',
              color: '#f8fafc',
              fontSize: '0.95rem',
            }}
          >
            {LINK_TYPES.map((lt) => (
              <option
                key={lt.value}
                value={lt.value}
                style={{ background: '#1e293b', color: '#f8fafc' }}
              >
                {lt.label}
              </option>
            ))}
          </select>
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
            Label
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. My Portfolio"
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '0.5rem',
              color: '#f8fafc',
              fontSize: '0.95rem',
            }}
            maxLength={100}
          />
        </div>
      </div>

      <div>
        <label
          style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontSize: '0.9rem' }}
        >
          URL *
        </label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://"
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
          {initialData ? 'Update Link' : 'Add Link'}
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
