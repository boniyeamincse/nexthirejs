import React, { useState } from 'react';
import type { EducationRecordResult } from '@nexthire/types';
import { EducationLevel } from '@nexthire/types';
import type { CreateEducationRecordInput, UpdateEducationRecordInput } from '@nexthire/validation';
import styles from '@/app/(auth)/auth.module.css';

interface EducationFormProps {
  initialData?: EducationRecordResult | null;
  onSave: (data: CreateEducationRecordInput | UpdateEducationRecordInput) => Promise<void>;
  onCancel: () => void;
}

export function EducationForm({ initialData, onSave, onCancel }: EducationFormProps) {
  const [formData, setFormData] = useState<CreateEducationRecordInput>({
    educationLevel: initialData?.educationLevel || EducationLevel.BACHELOR,
    institutionName: initialData?.institutionName || '',
    qualification: initialData?.qualification || '',
    fieldOfStudy: initialData?.fieldOfStudy || '',
    startDate: initialData ? initialData.startDate.split('T')[0] || '' : '',
    endDate: initialData && initialData.endDate ? initialData.endDate.split('T')[0] || '' : '',
    currentlyStudying: initialData?.currentlyStudying || false,
    grade: initialData?.grade || '',
    description: initialData?.description || '',
  });

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    let finalValue: string | boolean = value;

    if (type === 'checkbox') {
      finalValue = (e.target as HTMLInputElement).checked;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: finalValue === '' ? null : finalValue,
    }));

    if (name === 'currentlyStudying' && finalValue === true) {
      setFormData((prev) => ({ ...prev, endDate: null }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');

    try {
      const payload: Record<string, string | boolean | undefined> = { ...formData } as Record<
        string,
        string | boolean | undefined
      >;

      // Clean up empty strings to null or undefined as required by validation
      if (!payload.fieldOfStudy) payload.fieldOfStudy = undefined;
      if (!payload.grade) payload.grade = undefined;
      if (!payload.description) payload.description = undefined;

      // For API it might want full ISO dates, but YYYY-MM-DD should be parsed well by Zod.
      if (payload.startDate) {
        payload.startDate = new Date(payload.startDate as string).toISOString();
      }
      if (payload.endDate && !payload.currentlyStudying) {
        payload.endDate = new Date(payload.endDate as string).toISOString();
      } else {
        payload.endDate = undefined;
      }

      await onSave(payload as CreateEducationRecordInput & UpdateEducationRecordInput);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save education record');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={styles.form}
      style={{
        background: 'rgba(30, 41, 59, 0.7)',
        padding: '2rem',
        borderRadius: '1rem',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <h3 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '1.5rem', marginTop: 0 }}>
        {initialData ? 'Edit Education' : 'Add Education'}
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Education Level *</label>
          <select
            name="educationLevel"
            required
            className={styles.input}
            value={formData.educationLevel}
            onChange={handleChange}
            style={{ appearance: 'auto' }}
          >
            {Object.values(EducationLevel).map((level) => (
              <option key={level} value={level}>
                {level.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Institution Name *</label>
          <input
            name="institutionName"
            type="text"
            required
            className={styles.input}
            value={formData.institutionName || ''}
            onChange={handleChange}
            placeholder="e.g. University of Example"
            maxLength={200}
          />
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1.5rem',
          marginTop: '1.5rem',
        }}
      >
        <div className={styles.formGroup}>
          <label className={styles.label}>Qualification/Degree *</label>
          <input
            name="qualification"
            type="text"
            required
            className={styles.input}
            value={formData.qualification || ''}
            onChange={handleChange}
            placeholder="e.g. BSc Computer Science"
            maxLength={150}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Field of Study</label>
          <input
            name="fieldOfStudy"
            type="text"
            className={styles.input}
            value={formData.fieldOfStudy || ''}
            onChange={handleChange}
            placeholder="e.g. Software Engineering"
            maxLength={150}
          />
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1.5rem',
          marginTop: '1.5rem',
        }}
      >
        <div className={styles.formGroup}>
          <label className={styles.label}>Start Date *</label>
          <input
            name="startDate"
            type="date"
            required
            className={styles.input}
            value={formData.startDate || ''}
            onChange={handleChange}
            max={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>End Date {!formData.currentlyStudying && '*'}</label>
          <input
            name="endDate"
            type="date"
            required={!formData.currentlyStudying}
            disabled={formData.currentlyStudying}
            className={styles.input}
            value={formData.endDate || ''}
            onChange={handleChange}
            style={{ opacity: formData.currentlyStudying ? 0.5 : 1 }}
          />
        </div>
      </div>

      <div className={styles.formGroup} style={{ marginTop: '1rem' }}>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#cbd5e1',
            cursor: 'pointer',
          }}
        >
          <input
            name="currentlyStudying"
            type="checkbox"
            checked={formData.currentlyStudying}
            onChange={handleChange}
            style={{ width: '1.25rem', height: '1.25rem', accentColor: '#6366f1' }}
          />
          I am currently studying here
        </label>
      </div>

      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginTop: '1.5rem' }}
      >
        <div className={styles.formGroup}>
          <label className={styles.label}>Grade / GPA</label>
          <input
            name="grade"
            type="text"
            className={styles.input}
            value={formData.grade || ''}
            onChange={handleChange}
            placeholder="e.g. 3.8/4.0 or First Class"
            maxLength={100}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Description</label>
          <textarea
            name="description"
            className={styles.input}
            value={formData.description || ''}
            onChange={handleChange}
            placeholder="Additional details about your studies, achievements, or coursework..."
            style={{ minHeight: '100px', resize: 'vertical' }}
            maxLength={1000}
          />
        </div>
      </div>

      {errorMsg && (
        <div className={styles.errorContainer} style={{ marginTop: '1.5rem' }}>
          <p className={styles.errorText}>{errorMsg}</p>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'transparent',
            color: '#cbd5e1',
            border: '1px solid #475569',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className={styles.submitButton}
          style={{ width: 'auto', margin: 0 }}
        >
          {saving ? 'Saving...' : 'Save Education'}
        </button>
      </div>
    </form>
  );
}
