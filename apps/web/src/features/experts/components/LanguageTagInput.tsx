import { useState } from 'react';
import { EXPERT_LIMITS } from '@nexthire/constants';

interface LanguageTagInputProps {
  values: string[];
  onChange: (values: string[]) => void;
  error?: string;
  describedById?: string;
}

const FIELD_ID = 'expert-language-input';

/**
 * Accessible, keyboard-only tag input for interview languages.
 * No drag-and-drop; add with Enter/comma, remove with a labelled button.
 */
export function LanguageTagInput({
  values,
  onChange,
  error,
  describedById,
}: LanguageTagInputProps) {
  const [draft, setDraft] = useState('');

  const addLanguage = () => {
    const next = draft.trim();
    if (!next) return;
    const exists = values.some((v) => v.toLowerCase() === next.toLowerCase());
    if (exists) {
      setDraft('');
      return;
    }
    if (values.length >= EXPERT_LIMITS.MAX_INTERVIEW_LANGUAGES) return;
    onChange([...values, next]);
    setDraft('');
  };

  const removeLanguage = (value: string) => {
    onChange(values.filter((v) => v !== value));
  };

  return (
    <div>
      <label
        htmlFor={FIELD_ID}
        style={{ display: 'block', color: '#e4e4e7', marginBottom: '0.35rem', fontWeight: 500 }}
      >
        Interview languages
      </label>

      {values.length > 0 && (
        <ul
          aria-label="Selected interview languages"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            listStyle: 'none',
            margin: '0 0 0.5rem',
            padding: 0,
          }}
        >
          {values.map((value) => (
            <li key={value}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.25rem 0.6rem',
                  background: '#334155',
                  borderRadius: '9999px',
                  color: '#e4e4e7',
                  fontSize: '0.85rem',
                }}
              >
                {value}
                <button
                  type="button"
                  onClick={() => removeLanguage(value)}
                  aria-label={`Remove ${value}`}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#cbd5e1',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    lineHeight: 1,
                    padding: 0,
                  }}
                >
                  ×
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          id={FIELD_ID}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              addLanguage();
            }
          }}
          placeholder="e.g. English"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedById}
          style={{
            flex: 1,
            padding: '0.55rem 0.75rem',
            background: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '0.5rem',
            color: '#f1f5f9',
          }}
        />
        <button
          type="button"
          onClick={addLanguage}
          style={{
            padding: '0.55rem 1rem',
            background: '#334155',
            border: '1px solid #475569',
            borderRadius: '0.5rem',
            color: '#f1f5f9',
            cursor: 'pointer',
          }}
        >
          Add
        </button>
      </div>
      <p style={{ margin: '0.3rem 0 0', color: '#64748b', fontSize: '0.75rem' }}>
        Add up to {EXPERT_LIMITS.MAX_INTERVIEW_LANGUAGES} languages you can interview in.
      </p>
    </div>
  );
}
