import React from 'react';
import type { WorkExperienceRecordResult } from '@nexthire/types';

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: 'Full Time',
  PART_TIME: 'Part Time',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
  FREELANCE: 'Freelance',
};

interface WorkExperienceListProps {
  records: WorkExperienceRecordResult[];
  onEdit: (record: WorkExperienceRecordResult) => void;
  onDelete: (id: string) => Promise<void>;
  onMoveUp: (index: number) => Promise<void>;
  onMoveDown: (index: number) => Promise<void>;
}

export function WorkExperienceList({ records, onEdit, onDelete, onMoveUp, onMoveDown }: WorkExperienceListProps) {
  if (!records || records.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '3rem',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '1rem',
          border: '1px dashed rgba(255,255,255,0.1)',
        }}
      >
        <p style={{ color: '#94a3b8', margin: 0 }}>No work experience records added yet.</p>
        <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.5rem' }}>
          Add your work history to improve your profile completion.
        </p>
      </div>
    );
  }

  const formatMonthYear = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {records.map((record, index) => (
        <div
          key={record.id}
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
            <h4 style={{ margin: '0 0 0.25rem 0', color: '#f8fafc', fontSize: '1.1rem', fontWeight: 600 }}>
              {record.jobTitle}
            </h4>
            <p style={{ margin: '0 0 0.25rem 0', color: '#cbd5e1', fontWeight: 500 }}>
              {record.companyName}
              {record.location && ` · ${record.location}`}
              {record.isRemote && ' · Remote'}
            </p>
            <p style={{ margin: '0 0 0.75rem 0', color: '#94a3b8', fontSize: '0.85rem' }}>
              {EMPLOYMENT_TYPE_LABELS[record.employmentType] || record.employmentType} ·{' '}
              {formatMonthYear(record.startDate)} –{' '}
              {record.currentlyWorking ? 'Present' : record.endDate ? formatMonthYear(record.endDate) : ''}
            </p>

            {record.responsibilities && (
              <div style={{ marginBottom: '0.75rem' }}>
                <p style={{ margin: '0 0 0.25rem 0', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Responsibilities
                </p>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                  {record.responsibilities}
                </p>
              </div>
            )}

            {record.achievements && (
              <div>
                <p style={{ margin: '0 0 0.25rem 0', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Achievements
                </p>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                  {record.achievements}
                </p>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => onEdit(record)}
                style={{ background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)', padding: '0.35rem 0.75rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                Edit
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this work experience record?')) {
                    onDelete(record.id);
                  }
                }}
                style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)', padding: '0.35rem 0.75rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                Delete
              </button>
            </div>

            {records.length > 1 && (
              <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  onClick={() => onMoveUp(index)}
                  disabled={index === 0}
                  title="Move Up"
                  style={{ background: 'transparent', border: 'none', color: index === 0 ? '#334155' : '#94a3b8', cursor: index === 0 ? 'default' : 'pointer', padding: '0.25rem', fontSize: '1.1rem' }}
                >
                  ↑
                </button>
                <button
                  onClick={() => onMoveDown(index)}
                  disabled={index === records.length - 1}
                  title="Move Down"
                  style={{ background: 'transparent', border: 'none', color: index === records.length - 1 ? '#334155' : '#94a3b8', cursor: index === records.length - 1 ? 'default' : 'pointer', padding: '0.25rem', fontSize: '1.1rem' }}
                >
                  ↓
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
