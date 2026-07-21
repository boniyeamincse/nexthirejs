import type { CandidateProfessionalLinkResult } from '@nexthire/types';
import { ProfessionalLinkType } from '@nexthire/types';
import { ProfessionalLinkForm } from './ProfessionalLinkForm';
import type { CreateCandidateProfessionalLinkInput, UpdateCandidateProfessionalLinkInput } from '@nexthire/validation';

interface ProfessionalLinkListProps {
  records: CandidateProfessionalLinkResult[];
  onSave: (data: CreateCandidateProfessionalLinkInput | UpdateCandidateProfessionalLinkInput) => void;
  onDelete: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  editingIndex: number | null;
  setEditingIndex: (index: number | null) => void;
  showForm: boolean;
  setShowForm: (show: boolean) => void;
  saving: boolean;
  errorMsg: string | null;
  duplicateWarning: string | null;
}

const LINK_TYPE_LABELS: Record<ProfessionalLinkType, string> = {
  [ProfessionalLinkType.LINKEDIN]: 'LinkedIn',
  [ProfessionalLinkType.GITHUB]: 'GitHub',
  [ProfessionalLinkType.PORTFOLIO]: 'Portfolio',
  [ProfessionalLinkType.PERSONAL_WEBSITE]: 'Personal Website',
  [ProfessionalLinkType.BEHANCE]: 'Behance',
  [ProfessionalLinkType.DRIBBBLE]: 'Dribbble',
  [ProfessionalLinkType.STACK_OVERFLOW]: 'Stack Overflow',
  [ProfessionalLinkType.MEDIUM]: 'Medium',
  [ProfessionalLinkType.YOUTUBE]: 'YouTube',
  [ProfessionalLinkType.OTHER]: 'Other',
};

export function ProfessionalLinkList({
  records, onSave, onDelete, onMoveUp, onMoveDown,
  editingIndex, setEditingIndex, showForm, setShowForm,
  saving, errorMsg, duplicateWarning,
}: ProfessionalLinkListProps) {
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

      {duplicateWarning && (
        <div style={{
          padding: '0.75rem',
          marginBottom: '1rem',
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '0.5rem',
          color: '#fbbf24',
          fontSize: '0.9rem',
        }}>
          {duplicateWarning}
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
          Add Link
        </button>
      )}

      {showForm && (
        <div style={{ marginBottom: '1.5rem' }}>
          <ProfessionalLinkForm onSave={onSave} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {records.length === 0 && !showForm ? (
        <div style={{ color: '#94a3b8', padding: '2rem', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '0.5rem' }}>
          No professional links yet. Add your LinkedIn, GitHub, portfolio, or other links.
        </div>
      ) : (
        records.map((record, index) => (
          <div key={record.id}>
            {editingIndex === index ? (
              <div style={{ marginBottom: '1rem' }}>
                <ProfessionalLinkForm
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{
                        padding: '0.125rem 0.5rem',
                        background: 'rgba(99,102,241,0.15)',
                        color: '#818cf8',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                      }}>
                        {LINK_TYPE_LABELS[record.type]}
                      </span>
                      {record.label && (
                        <span style={{ color: '#fff', fontSize: '0.9rem' }}>{record.label}</span>
                      )}
                    </div>
                    <a
                      href={record.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#6366f1', fontSize: '0.85rem', wordBreak: 'break-all' }}
                    >
                      {record.url}
                    </a>
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
