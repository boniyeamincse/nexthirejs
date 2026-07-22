import { useState } from 'react';
import type { CandidateTrainingResult } from '@nexthire/types';
import type {
  CreateCandidateTrainingInput,
  UpdateCandidateTrainingInput,
} from '@nexthire/validation';

interface TrainingFormProps {
  initialData?: CandidateTrainingResult | null;
  onSave: (data: CreateCandidateTrainingInput | UpdateCandidateTrainingInput) => void;
  onCancel: () => void;
}

export function TrainingForm({ initialData, onSave, onCancel }: TrainingFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [provider, setProvider] = useState(initialData?.provider || '');
  const [completionDate, setCompletionDate] = useState(
    initialData ? initialData.completionDate.split('T')[0] || '' : '',
  );
  const [durationHours, setDurationHours] = useState<string>(
    initialData?.durationHours !== null && initialData?.durationHours !== undefined
      ? String(initialData.durationHours)
      : '',
  );
  const [description, setDescription] = useState(initialData?.description || '');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('Training title is required');
      return;
    }
    if (!provider.trim()) {
      setErrorMsg('Provider is required');
      return;
    }
    if (!completionDate) {
      setErrorMsg('Completion date is required');
      return;
    }

    const data: Record<string, unknown> = {
      title: title.trim(),
      provider: provider.trim(),
      completionDate: new Date(completionDate).toISOString(),
    };

    if (durationHours !== '') {
      data.durationHours = Number(durationHours);
    } else {
      data.durationHours = null;
    }

    if (description.trim()) {
      data.description = description.trim();
    } else {
      data.description = null;
    }

    onSave(data as CreateCandidateTrainingInput | UpdateCandidateTrainingInput);
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
    >
      <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '0.5rem' }}>
        {initialData ? 'Edit Training' : 'Add New Training'}
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
            Training Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Advanced TypeScript"
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
            Provider *
          </label>
          <input
            type="text"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            placeholder="e.g. Udemy, Coursera"
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
            Completion Date *
          </label>
          <input
            type="date"
            value={completionDate}
            onChange={(e) => setCompletionDate(e.target.value)}
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
            Duration Hours (optional)
          </label>
          <input
            type="number"
            min="0.5"
            max="10000"
            step="0.1"
            value={durationHours}
            onChange={(e) => setDurationHours(e.target.value)}
            placeholder="e.g. 40"
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
      </div>

      <div>
        <label
          style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontSize: '0.9rem' }}
        >
          Description (optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what you learned in this training..."
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
          maxLength={1000}
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
          {initialData ? 'Update Training' : 'Add Training'}
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
