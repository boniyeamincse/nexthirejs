import React, { useState } from 'react';
import type { WorkExperienceRecordResult } from '@nexthire/types';
import { EmploymentType } from '@nexthire/types';
import type {
  CreateWorkExperienceRecordInput,
  UpdateWorkExperienceRecordInput,
} from '@nexthire/validation';
import styles from '@/app/(auth)/auth.module.css';

interface WorkExperienceFormProps {
  initialData?: WorkExperienceRecordResult | null;
  onSave: (
    data: CreateWorkExperienceRecordInput | UpdateWorkExperienceRecordInput,
  ) => Promise<void>;
  onCancel: () => void;
}

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: 'Full Time',
  PART_TIME: 'Part Time',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
  FREELANCE: 'Freelance',
};

export function WorkExperienceForm({ initialData, onSave, onCancel }: WorkExperienceFormProps) {
  const [formData, setFormData] = useState({
    companyName: initialData?.companyName || '',
    jobTitle: initialData?.jobTitle || '',
    employmentType: initialData?.employmentType || EmploymentType.FULL_TIME,
    location: initialData?.location || '',
    isRemote: initialData?.isRemote || false,
    startDate: initialData ? initialData.startDate.split('T')[0] || '' : '',
    endDate: initialData?.endDate ? initialData.endDate.split('T')[0] || '' : '',
    currentlyWorking: initialData?.currentlyWorking || false,
    responsibilities: initialData?.responsibilities || '',
    achievements: initialData?.achievements || '',
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
    setFormData((prev) => ({ ...prev, [name]: finalValue }));
    if (name === 'currentlyWorking' && finalValue === true) {
      setFormData((prev) => ({ ...prev, endDate: '', currentlyWorking: true }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');

    try {
      const payload: Record<string, string | boolean | undefined> = {
        companyName: formData.companyName,
        jobTitle: formData.jobTitle,
        employmentType: formData.employmentType,
        isRemote: formData.isRemote,
        currentlyWorking: formData.currentlyWorking,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
      };

      if (formData.location) payload.location = formData.location;
      if (formData.responsibilities) payload.responsibilities = formData.responsibilities;
      if (formData.achievements) payload.achievements = formData.achievements;

      if (!formData.currentlyWorking && formData.endDate) {
        payload.endDate = new Date(formData.endDate).toISOString();
      }

      await onSave(payload as CreateWorkExperienceRecordInput & UpdateWorkExperienceRecordInput);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save work experience record');
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
        {initialData ? 'Edit Work Experience' : 'Add Work Experience'}
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Company Name *</label>
          <input
            name="companyName"
            type="text"
            required
            className={styles.input}
            value={formData.companyName}
            onChange={handleChange}
            placeholder="e.g. Acme Corporation"
            maxLength={200}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Job Title *</label>
          <input
            name="jobTitle"
            type="text"
            required
            className={styles.input}
            value={formData.jobTitle}
            onChange={handleChange}
            placeholder="e.g. Senior Software Engineer"
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
          <label className={styles.label}>Employment Type *</label>
          <select
            name="employmentType"
            required
            className={styles.input}
            value={formData.employmentType}
            onChange={handleChange}
            style={{ appearance: 'auto' }}
          >
            {Object.values(EmploymentType).map((type) => (
              <option key={type} value={type}>
                {EMPLOYMENT_TYPE_LABELS[type] || type}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Location</label>
          <input
            name="location"
            type="text"
            className={styles.input}
            value={formData.location}
            onChange={handleChange}
            placeholder="e.g. Dhaka, Bangladesh"
            maxLength={150}
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
            name="isRemote"
            type="checkbox"
            checked={formData.isRemote}
            onChange={handleChange}
            style={{ width: '1.25rem', height: '1.25rem', accentColor: '#6366f1' }}
          />
          Remote position
        </label>
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
            value={formData.startDate}
            onChange={handleChange}
            max={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>End Date {!formData.currentlyWorking && '*'}</label>
          <input
            name="endDate"
            type="date"
            required={!formData.currentlyWorking}
            disabled={formData.currentlyWorking}
            className={styles.input}
            value={formData.endDate}
            onChange={handleChange}
            style={{ opacity: formData.currentlyWorking ? 0.5 : 1 }}
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
            name="currentlyWorking"
            type="checkbox"
            checked={formData.currentlyWorking}
            onChange={handleChange}
            style={{ width: '1.25rem', height: '1.25rem', accentColor: '#6366f1' }}
          />
          I currently work here
        </label>
      </div>

      <div className={styles.formGroup} style={{ marginTop: '1.5rem' }}>
        <label className={styles.label}>Responsibilities</label>
        <textarea
          name="responsibilities"
          className={styles.input}
          value={formData.responsibilities}
          onChange={handleChange}
          placeholder="Key responsibilities in this role..."
          style={{ minHeight: '100px', resize: 'vertical' }}
          maxLength={2000}
        />
      </div>

      <div className={styles.formGroup} style={{ marginTop: '1.5rem' }}>
        <label className={styles.label}>Achievements</label>
        <textarea
          name="achievements"
          className={styles.input}
          value={formData.achievements}
          onChange={handleChange}
          placeholder="Notable achievements or accomplishments..."
          style={{ minHeight: '100px', resize: 'vertical' }}
          maxLength={2000}
        />
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
          {saving ? 'Saving...' : 'Save Experience'}
        </button>
      </div>
    </form>
  );
}
