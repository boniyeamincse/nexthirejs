import { useState } from 'react';
import type { CreateCandidateLanguageInput, UpdateCandidateLanguageInput } from '@nexthire/validation';
import type { CandidateLanguageResult } from '@nexthire/types';

interface LanguageFormProps {
  initialData?: CandidateLanguageResult | null;
  onSave: (data: CreateCandidateLanguageInput | UpdateCandidateLanguageInput) => void;
  onCancel: () => void;
}

const PROFICIENCY_LEVELS = [
  { value: 'BASIC', label: 'Basic' },
  { value: 'CONVERSATIONAL', label: 'Conversational' },
  { value: 'PROFESSIONAL', label: 'Professional' },
  { value: 'FLUENT', label: 'Fluent' },
  { value: 'NATIVE', label: 'Native' },
];

export function LanguageForm({ initialData, onSave, onCancel }: LanguageFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [speaking, setSpeaking] = useState(initialData?.speaking || 'BASIC');
  const [reading, setReading] = useState(initialData?.reading || 'BASIC');
  const [writing, setWriting] = useState(initialData?.writing || 'BASIC');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Language name is required');
      return;
    }

    const data: CreateCandidateLanguageInput | UpdateCandidateLanguageInput = {
      name: name.trim(),
      speaking: speaking as CreateCandidateLanguageInput['speaking'],
      reading: reading as CreateCandidateLanguageInput['reading'],
      writing: writing as CreateCandidateLanguageInput['writing'],
    };

    onSave(data);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '0.5rem' }}>
        {initialData ? 'Edit Language' : 'Add New Language'}
      </h3>

      {errorMsg && (
        <div style={{
          padding: '0.75rem',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '0.5rem',
          color: '#fca5a5',
          fontSize: '0.9rem',
        }}>
          {errorMsg}
        </div>
      )}

      <div>
        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontSize: '0.9rem' }}>
          Language Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. English, Spanish, Mandarin"
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontSize: '0.9rem' }}>
            Speaking *
          </label>
          <select
            value={speaking}
            onChange={(e) => setSpeaking(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '0.5rem',
              color: '#f8fafc',
              fontSize: '0.95rem',
              appearance: 'auto',
            }}
          >
            {PROFICIENCY_LEVELS.map((lvl) => (
              <option key={lvl.value} value={lvl.value}>{lvl.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontSize: '0.9rem' }}>
            Reading *
          </label>
          <select
            value={reading}
            onChange={(e) => setReading(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '0.5rem',
              color: '#f8fafc',
              fontSize: '0.95rem',
              appearance: 'auto',
            }}
          >
            {PROFICIENCY_LEVELS.map((lvl) => (
              <option key={lvl.value} value={lvl.value}>{lvl.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontSize: '0.9rem' }}>
            Writing *
          </label>
          <select
            value={writing}
            onChange={(e) => setWriting(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '0.5rem',
              color: '#f8fafc',
              fontSize: '0.95rem',
              appearance: 'auto',
            }}
          >
            {PROFICIENCY_LEVELS.map((lvl) => (
              <option key={lvl.value} value={lvl.value}>{lvl.label}</option>
            ))}
          </select>
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
          {initialData ? 'Update Language' : 'Add Language'}
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
