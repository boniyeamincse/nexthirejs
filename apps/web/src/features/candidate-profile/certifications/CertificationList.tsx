import type { CandidateCertificationResult } from '@nexthire/types';

interface CertificationListProps {
  records: CandidateCertificationResult[];
  onEdit: (record: CandidateCertificationResult) => void;
  onDelete: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

export function CertificationList({
  records,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: CertificationListProps) {
  if (records.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
        <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No certifications added yet</p>
        <p style={{ fontSize: '0.9rem' }}>
          Add your professional certifications to boost your profile.
        </p>
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
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
              {record.issuer} &bull; Issued {new Date(record.issueDate).toLocaleDateString()}
              {!record.doesNotExpire &&
                record.expiryDate &&
                ` - Expires ${new Date(record.expiryDate).toLocaleDateString()}`}
              {record.doesNotExpire && ' - No Expiry'}
            </p>
            {record.credentialId && (
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                ID: {record.credentialId}
              </p>
            )}
            {record.credentialUrl && (
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                <a
                  href={record.credentialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#a5b4fc', textDecoration: 'none' }}
                >
                  View Credential
                </a>
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
