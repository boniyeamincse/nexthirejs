import React from 'react';
import type { EducationRecordResult } from '@nexthire/types';
import { EducationRecordCard } from './EducationRecordCard';

interface EducationListProps {
  records: EducationRecordResult[];
  onEdit: (record: EducationRecordResult) => void;
  onDelete: (id: string) => Promise<void>;
  onMoveUp: (index: number) => Promise<void>;
  onMoveDown: (index: number) => Promise<void>;
}

export function EducationList({ records, onEdit, onDelete, onMoveUp, onMoveDown }: EducationListProps) {
  if (!records || records.length === 0) {
    return (
      <div
        role="status"
        style={{
          textAlign: 'center',
          padding: '3rem',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '1rem',
          border: '1px dashed rgba(255,255,255,0.1)',
        }}
      >
        <p style={{ color: '#94a3b8', margin: 0 }}>No education records added yet.</p>
        <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.5rem' }}>
          Add your educational background to improve your profile completion.
        </p>
      </div>
    );
  }

  return (
    <div role="list" aria-label="Education records" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {records.map((record, index) => (
        <EducationRecordCard
          key={record.id}
          record={record}
          onEdit={onEdit}
          onDelete={onDelete}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          index={index}
          totalRecords={records.length}
        />
      ))}
    </div>
  );
}
