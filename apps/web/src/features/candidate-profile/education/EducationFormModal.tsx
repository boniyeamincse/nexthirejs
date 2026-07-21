import React, { useEffect, useRef } from 'react';
import type { EducationRecordResult } from '@nexthire/types';
import type { CreateEducationRecordInput, UpdateEducationRecordInput } from '@nexthire/validation';
import { EducationForm } from './EducationForm';

interface EducationFormModalProps {
  isOpen: boolean;
  initialData?: EducationRecordResult | null;
  onSave: (data: CreateEducationRecordInput | UpdateEducationRecordInput) => Promise<void>;
  onCancel: () => void;
}

export function EducationFormModal({ isOpen, initialData, onSave, onCancel }: EducationFormModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  // Handle backdrop click to close
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClick = (e: MouseEvent) => {
      if (e.target === dialog) {
        onCancel();
      }
    };

    dialog.addEventListener('click', handleClick);
    return () => dialog.removeEventListener('click', handleClick);
  }, [onCancel]);

  // Handle Escape key
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      onCancel();
    };

    dialog.addEventListener('cancel', handleCancel);
    return () => dialog.removeEventListener('cancel', handleCancel);
  }, [onCancel]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="education-form-modal-title"
      style={{
        background: 'transparent',
        border: 'none',
        padding: 0,
        maxWidth: '700px',
        width: '90vw',
        position: 'fixed',
        inset: 0,
      }}
    >
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '1rem',
          padding: '0.5rem',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
        }}
      >
        <EducationForm initialData={initialData} onSave={onSave} onCancel={onCancel} />
      </div>
    </dialog>
  );
}

