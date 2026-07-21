import type { CandidateAchievementResult } from '@nexthire/types';
import { AchievementForm } from './AchievementForm';
import type { CreateCandidateAchievementInput, UpdateCandidateAchievementInput } from '@nexthire/validation';

interface AchievementListProps {
  records: CandidateAchievementResult[];
  onSave: (data: CreateCandidateAchievementInput | UpdateCandidateAchievementInput) => void;
  onDelete: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  editingIndex: number | null;
  setEditingIndex: (index: number | null) => void;
  showForm: boolean;
  setShowForm: (show: boolean) => void;
  saving: boolean;
  errorMsg: string | null;
}

export function AchievementList({
  records, onSave, onDelete, onMoveUp, onMoveDown,
  editingIndex, setEditingIndex, showForm, setShowForm,
  saving, errorMsg,
}: AchievementListProps) {
  if (saving) {
    return <div style={{ color: '#94a3b8', padding: '2rem', textAlign: 'center' }}>Saving...</div>;
  }

  return (
    <div>
      {errorMsg && (
        <div style={{
          padding: '0.75rem',
          marginBottom: '1rem',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '0.5rem',
          color: '#fca5a5',
          fontSize: '0.9rem',
        }}>
          {errorMsg}
        </div>
      )}

      {!showForm && !editingIndex && (
        <button
          onClick={() => setShowForm(true)}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#6366f1',
            color: '#fff',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: '0.95rem',
            marginBottom: '1rem',
          }}
        >
          Add Achievement
        </button>
      )}

      {showForm && (
        <div style={{ marginBottom: '1.5rem' }}>
          <AchievementForm onSave={onSave} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {records.length === 0 && !showForm ? (
        <div style={{ color: '#94a3b8', padding: '2rem', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '0.5rem' }}>
          No achievements yet. Add your first achievement to showcase your accomplishments.
        </div>
      ) : (
        records.map((record, index) => (
          <div key={record.id}>
            {editingIndex === index ? (
              <div style={{ marginBottom: '1rem' }}>
                <AchievementForm
                  initialData={record}
                  onSave={onSave}
                  onCancel={() => setEditingIndex(null)}
                />
              </div>
            ) : (
              <div style={{
                padding: '1rem',
                marginBottom: '0.75rem',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '0.5rem',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ color: '#fff', margin: '0 0 0.25rem', fontSize: '1rem' }}>{record.title}</h4>
                    {record.issuer && (
                      <p style={{ color: '#94a3b8', margin: '0 0 0.25rem', fontSize: '0.85rem' }}>{record.issuer}</p>
                    )}
                    {record.achievedAt && (
                      <p style={{ color: '#64748b', margin: '0 0 0.25rem', fontSize: '0.8rem' }}>
                        {new Date(record.achievedAt).toLocaleDateString()}
                      </p>
                    )}
                    {record.description && (
                      <p style={{ color: '#cbd5e1', margin: '0.25rem 0', fontSize: '0.85rem' }}>{record.description}</p>
                    )}
                    {record.referenceUrl && (
                      <a
                        href={record.referenceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#6366f1', fontSize: '0.85rem', display: 'inline-block', marginTop: '0.25rem' }}
                      >
                        View Reference
                      </a>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem', marginLeft: '1rem' }}>
                    <button
                      onClick={() => onMoveUp(index)}
                      disabled={index === 0}
                      aria-label="Move up"
                      style={{
                        padding: '0.25rem 0.5rem',
                        background: 'transparent',
                        color: index === 0 ? '#475569' : '#94a3b8',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '0.25rem',
                        cursor: index === 0 ? 'not-allowed' : 'pointer',
                        fontSize: '0.8rem',
                      }}
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => onMoveDown(index)}
                      disabled={index === records.length - 1}
                      aria-label="Move down"
                      style={{
                        padding: '0.25rem 0.5rem',
                        background: 'transparent',
                        color: index === records.length - 1 ? '#475569' : '#94a3b8',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '0.25rem',
                        cursor: index === records.length - 1 ? 'not-allowed' : 'pointer',
                        fontSize: '0.8rem',
                      }}
                    >
                      ▼
                    </button>
                    <button
                      onClick={() => setEditingIndex(index)}
                      aria-label="Edit"
                      style={{
                        padding: '0.25rem 0.5rem',
                        background: 'transparent',
                        color: '#94a3b8',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '0.25rem',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(record.id)}
                      aria-label="Delete"
                      style={{
                        padding: '0.25rem 0.5rem',
                        background: 'transparent',
                        color: '#ef4444',
                        border: '1px solid rgba(239,68,68,0.3)',
                        borderRadius: '0.25rem',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
