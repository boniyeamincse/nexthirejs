import type { CandidateSkillResult } from '@nexthire/types';

interface SkillListProps {
  records: CandidateSkillResult[];
  onEdit: (record: CandidateSkillResult) => void;
  onDelete: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

export function SkillList({ records, onEdit, onDelete, onMoveUp, onMoveDown }: SkillListProps) {
  if (records.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
        <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No skills added yet</p>
        <p style={{ fontSize: '0.9rem' }}>Add your first skill to showcase your expertise.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {records.map((record, index) => (
        <div
          key={record.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1rem',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '0.5rem',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.25rem',
              }}
            >
              <span style={{ fontWeight: 600, color: '#f8fafc' }}>{record.name}</span>
              <span
                style={{
                  padding: '0.15rem 0.5rem',
                  borderRadius: '0.25rem',
                  fontSize: '0.75rem',
                  background: 'rgba(99, 102, 241, 0.2)',
                  color: '#a5b4fc',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                }}
              >
                {record.level}
              </span>
            </div>
            {record.yearsOfExperience !== null && (
              <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                {record.yearsOfExperience} {record.yearsOfExperience === 1 ? 'year' : 'years'} of
                experience
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button
              onClick={() => onMoveUp(index)}
              disabled={index === 0}
              style={{
                padding: '0.4rem 0.6rem',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '0.25rem',
                color: '#cbd5e1',
                cursor: index === 0 ? 'not-allowed' : 'pointer',
                opacity: index === 0 ? 0.5 : 1,
                fontSize: '0.8rem',
              }}
              aria-label="Move up"
            >
              ↑
            </button>
            <button
              onClick={() => onMoveDown(index)}
              disabled={index === records.length - 1}
              style={{
                padding: '0.4rem 0.6rem',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '0.25rem',
                color: '#cbd5e1',
                cursor: index === records.length - 1 ? 'not-allowed' : 'pointer',
                opacity: index === records.length - 1 ? 0.5 : 1,
                fontSize: '0.8rem',
              }}
              aria-label="Move down"
            >
              ↓
            </button>
            <button
              onClick={() => onEdit(record)}
              style={{
                padding: '0.4rem 0.6rem',
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                borderRadius: '0.25rem',
                color: '#a5b4fc',
                cursor: 'pointer',
                fontSize: '0.8rem',
              }}
              aria-label={`Edit ${record.name}`}
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(record.id)}
              style={{
                padding: '0.4rem 0.6rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '0.25rem',
                color: '#fca5a5',
                cursor: 'pointer',
                fontSize: '0.8rem',
              }}
              aria-label={`Delete ${record.name}`}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
