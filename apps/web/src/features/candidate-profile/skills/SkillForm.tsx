import { useState } from 'react';
import type { CreateCandidateSkillInput, UpdateCandidateSkillInput } from '@nexthire/validation';
import type { CandidateSkillResult } from '@nexthire/types';

interface SkillFormProps {
  initialData?: CandidateSkillResult | null;
  onSave: (data: CreateCandidateSkillInput | UpdateCandidateSkillInput) => void;
  onCancel: () => void;
}

const SKILL_LEVELS = [
  { value: 'BEGINNER', label: 'Beginner' },
  { value: 'DEVELOPING', label: 'Developing' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'ADVANCED', label: 'Advanced' },
  { value: 'EXPERT', label: 'Expert' },
];

export function SkillForm({ initialData, onSave, onCancel }: SkillFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [level, setLevel] = useState(initialData?.level || 'BEGINNER');
  const [yearsOfExperience, setYearsOfExperience] = useState<string>(
    initialData?.yearsOfExperience !== null && initialData?.yearsOfExperience !== undefined
      ? String(initialData.yearsOfExperience)
      : ''
  );
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Skill name is required');
      return;
    }

    const data: CreateCandidateSkillInput | UpdateCandidateSkillInput = {
      name: name.trim(),
      level: level as CreateCandidateSkillInput['level'],
      yearsOfExperience: yearsOfExperience !== '' ? Number(yearsOfExperience) : null,
    };

    onSave(data);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '0.5rem' }}>
        {initialData ? 'Edit Skill' : 'Add New Skill'}
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
          Skill Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. React, Python, Project Management"
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
        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontSize: '0.9rem' }}>
          Proficiency Level *
        </label>
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
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
          {SKILL_LEVELS.map((lvl) => (
            <option key={lvl.value} value={lvl.value}>{lvl.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontSize: '0.9rem' }}>
          Years of Experience (optional)
        </label>
        <input
          type="number"
          min="0"
          max="60"
          value={yearsOfExperience}
          onChange={(e) => setYearsOfExperience(e.target.value)}
          placeholder="e.g. 3"
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
          {initialData ? 'Update Skill' : 'Add Skill'}
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
