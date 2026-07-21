import React from 'react';
import type { EducationRecordResult } from '@nexthire/types';

interface EducationRecordCardProps {
  record: EducationRecordResult;
  onEdit: (record: EducationRecordResult) => void;
  onDelete: (id: string) => Promise<void>;
  onMoveUp: (index: number) => Promise<void>;
  onMoveDown: (index: number) => Promise<void>;
  index: number;
  totalRecords: number;
}

const formatMonthYear = (isoDate: string) => {
  const date = new Date(isoDate);
  return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
};

export function EducationRecordCard({
  record,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  index,
  totalRecords,
}: EducationRecordCardProps) {
  return (
    <div
      role="listitem"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '1rem',
        padding: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '1.5rem',
      }}
    >
      <div style={{ flex: 1 }}>
        <h4
          style={{
            margin: '0 0 0.5rem 0',
            color: '#f8fafc',
            fontSize: '1.1rem',
            fontWeight: 600,
          }}
        >
          {record.qualification}
          {record.fieldOfStudy && ` in ${record.fieldOfStudy}`}
        </h4>
        <p style={{ margin: '0 0 0.25rem 0', color: '#cbd5e1', fontWeight: 500 }}>
          {record.institutionName}
        </p>
        <p style={{ margin: '0 0 0.75rem 0', color: '#94a3b8', fontSize: '0.85rem' }}>
          {record.educationLevel.replace('_', ' ')} &bull;{' '}
          {formatMonthYear(record.startDate)} -{' '}
          {record.currentlyStudying
            ? 'Present'
            : record.endDate
              ? formatMonthYear(record.endDate)
              : ''}
        </p>

        {record.grade && (
          <p style={{ margin: '0 0 0.5rem 0', color: '#cbd5e1', fontSize: '0.9rem' }}>
            <span style={{ color: '#64748b' }}>Grade:</span> {record.grade}
          </p>
        )}

        {record.description && (
          <p
            style={{
              margin: 0,
              color: '#94a3b8',
              fontSize: '0.9rem',
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
            }}
          >
            {record.description}
          </p>
        )}
      </div>

      <div
        style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
        role="toolbar"
        aria-label={`Actions for ${record.qualification}`}
      >
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button
            onClick={() => onEdit(record)}
            aria-label={`Edit ${record.qualification}`}
            style={{
              background: 'rgba(99, 102, 241, 0.1)',
              color: '#a5b4fc',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              padding: '0.35rem 0.75rem',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
          >
            Edit
          </button>
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this education record?')) {
                onDelete(record.id);
              }
            }}
            aria-label={`Delete ${record.qualification}`}
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#fca5a5',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              padding: '0.35rem 0.75rem',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
          >
            Delete
          </button>
        </div>

        {totalRecords > 1 && (
          <div
            style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}
            role="group"
            aria-label="Reorder controls"
          >
            <button
              onClick={() => onMoveUp(index)}
              disabled={index === 0}
              aria-label={`Move ${record.qualification} up`}
              style={{
                background: 'transparent',
                border: 'none',
                color: index === 0 ? '#334155' : '#94a3b8',
                cursor: index === 0 ? 'default' : 'pointer',
                padding: '0.25rem',
                fontSize: '1rem',
              }}
              title="Move Up"
            >
              ↑
            </button>
            <button
              onClick={() => onMoveDown(index)}
              disabled={index === totalRecords - 1}
              aria-label={`Move ${record.qualification} down`}
              style={{
                background: 'transparent',
                border: 'none',
                color: index === totalRecords - 1 ? '#334155' : '#94a3b8',
                cursor: index === totalRecords - 1 ? 'default' : 'pointer',
                padding: '0.25rem',
                fontSize: '1rem',
              }}
              title="Move Down"
            >
              ↓
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

