import { useMemo, useState } from 'react';
import { EXPERT_LIMITS } from '@nexthire/constants';
import type { ExpertProfileInput, ExpertProfileResult } from '@nexthire/types';
import type { Country } from '@nexthire/types';
import {
  validateExpertProfile,
  hasErrors,
  type ExpertProfileFieldErrors,
} from '../lib/expert-profile-validation';
import { LanguageTagInput } from './LanguageTagInput';

interface ExpertProfileFormProps {
  initialProfile?: ExpertProfileResult | null;
  countries: Country[];
  onSave: (input: ExpertProfileInput) => Promise<void>;
  saving: boolean;
  serverError?: string | null;
  serverFieldErrors?: ExpertProfileFieldErrors;
  disabled?: boolean;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.55rem 0.75rem',
  background: '#0f172a',
  border: '1px solid #334155',
  borderRadius: '0.5rem',
  color: '#f1f5f9',
  fontSize: '0.9rem',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  color: '#e4e4e7',
  marginBottom: '0.35rem',
  fontWeight: 500,
  fontSize: '0.9rem',
};

function toInput(profile?: ExpertProfileResult | null): ExpertProfileInput {
  return {
    professionalTitle: profile?.professionalTitle ?? '',
    professionalSummary: profile?.professionalSummary ?? '',
    yearsOfExperience: profile?.yearsOfExperience ?? 1,
    currentCompany: profile?.currentCompany ?? '',
    currentPosition: profile?.currentPosition ?? '',
    highestEducation: profile?.highestEducation ?? '',
    linkedinUrl: profile?.linkedinUrl ?? '',
    portfolioUrl: profile?.portfolioUrl ?? '',
    personalWebsiteUrl: profile?.personalWebsiteUrl ?? '',
    interviewLanguages: profile?.interviewLanguages ?? [],
    countryId: profile?.countryId ?? '',
    city: profile?.city ?? '',
  };
}

function Field({
  id,
  label,
  error,
  children,
  hint,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: (describedBy: string | undefined) => React.ReactNode;
}) {
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint ? `${id}-hint` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;
  return (
    <div style={{ marginBottom: '1.1rem' }}>
      <label htmlFor={id} style={labelStyle}>
        {label}
      </label>
      {children(describedBy)}
      {hint && (
        <p id={hintId} style={{ margin: '0.3rem 0 0', color: '#64748b', fontSize: '0.75rem' }}>
          {hint}
        </p>
      )}
      {error && (
        <p
          id={errorId}
          role="alert"
          style={{ margin: '0.3rem 0 0', color: '#fca5a5', fontSize: '0.8rem' }}
        >
          {error}
        </p>
      )}
    </div>
  );
}

export function ExpertProfileForm({
  initialProfile,
  countries,
  onSave,
  saving,
  serverError,
  serverFieldErrors,
  disabled,
}: ExpertProfileFormProps) {
  const [form, setForm] = useState<ExpertProfileInput>(() => toInput(initialProfile));
  const [clientErrors, setClientErrors] = useState<ExpertProfileFieldErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const errors = useMemo<ExpertProfileFieldErrors>(
    () => ({ ...clientErrors, ...(serverFieldErrors ?? {}) }),
    [clientErrors, serverFieldErrors],
  );

  const update = <K extends keyof ExpertProfileInput>(key: K, value: ExpertProfileInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const normalized: ExpertProfileInput = {
      ...form,
      professionalTitle: form.professionalTitle.trim(),
      professionalSummary: form.professionalSummary.trim(),
      currentCompany: form.currentCompany?.trim() || null,
      currentPosition: form.currentPosition?.trim() || null,
      highestEducation: form.highestEducation?.trim() || null,
      linkedinUrl: form.linkedinUrl?.trim() || null,
      portfolioUrl: form.portfolioUrl?.trim() || null,
      personalWebsiteUrl: form.personalWebsiteUrl?.trim() || null,
      city: form.city?.trim() || null,
    };
    const validation = validateExpertProfile(normalized);
    setClientErrors(validation);
    if (hasErrors(validation)) {
      return;
    }
    await onSave(normalized);
  };

  const summaryLength = form.professionalSummary.trim().length;

  return (
    <form onSubmit={handleSubmit} noValidate aria-busy={saving}>
      {serverError && (
        <div
          role="alert"
          style={{
            marginBottom: '1rem',
            padding: '0.75rem 0.9rem',
            borderRadius: '0.6rem',
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.4)',
            color: '#fca5a5',
            fontSize: '0.9rem',
          }}
        >
          {serverError}
        </div>
      )}

      {submitted && hasErrors(errors) && (
        <div
          role="alert"
          style={{
            marginBottom: '1rem',
            padding: '0.75rem 0.9rem',
            borderRadius: '0.6rem',
            background: 'rgba(245,158,11,0.1)',
            border: '1px solid rgba(245,158,11,0.35)',
            color: '#fcd34d',
            fontSize: '0.85rem',
          }}
        >
          Please fix the highlighted fields before saving.
        </div>
      )}

      <Field
        id="professionalTitle"
        label="Professional title"
        error={errors.professionalTitle}
        hint={`${EXPERT_LIMITS.MIN_PROFESSIONAL_TITLE}–${EXPERT_LIMITS.MAX_PROFESSIONAL_TITLE} characters`}
      >
        {(describedBy) => (
          <input
            id="professionalTitle"
            type="text"
            value={form.professionalTitle}
            onChange={(e) => update('professionalTitle', e.target.value)}
            disabled={disabled}
            aria-invalid={errors.professionalTitle ? true : undefined}
            aria-describedby={describedBy}
            style={inputStyle}
          />
        )}
      </Field>

      <Field
        id="professionalSummary"
        label="Professional summary"
        error={errors.professionalSummary}
        hint={`${summaryLength} / ${EXPERT_LIMITS.MAX_PROFESSIONAL_SUMMARY} characters (minimum ${EXPERT_LIMITS.MIN_PROFESSIONAL_SUMMARY})`}
      >
        {(describedBy) => (
          <textarea
            id="professionalSummary"
            value={form.professionalSummary}
            onChange={(e) => update('professionalSummary', e.target.value)}
            disabled={disabled}
            rows={6}
            aria-invalid={errors.professionalSummary ? true : undefined}
            aria-describedby={describedBy}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        )}
      </Field>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
        }}
      >
        <Field id="yearsOfExperience" label="Years of experience" error={errors.yearsOfExperience}>
          {(describedBy) => (
            <input
              id="yearsOfExperience"
              type="number"
              min={EXPERT_LIMITS.MIN_YEARS_EXPERIENCE}
              max={EXPERT_LIMITS.MAX_YEARS_EXPERIENCE}
              value={form.yearsOfExperience}
              onChange={(e) => update('yearsOfExperience', Number(e.target.value))}
              disabled={disabled}
              aria-invalid={errors.yearsOfExperience ? true : undefined}
              aria-describedby={describedBy}
              style={inputStyle}
            />
          )}
        </Field>

        <Field
          id="highestEducation"
          label="Highest education (optional)"
          error={errors.highestEducation}
        >
          {(describedBy) => (
            <input
              id="highestEducation"
              type="text"
              value={form.highestEducation ?? ''}
              onChange={(e) => update('highestEducation', e.target.value)}
              disabled={disabled}
              aria-invalid={errors.highestEducation ? true : undefined}
              aria-describedby={describedBy}
              style={inputStyle}
            />
          )}
        </Field>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
        }}
      >
        <Field id="currentCompany" label="Current company (optional)" error={errors.currentCompany}>
          {(describedBy) => (
            <input
              id="currentCompany"
              type="text"
              value={form.currentCompany ?? ''}
              onChange={(e) => update('currentCompany', e.target.value)}
              disabled={disabled}
              aria-describedby={describedBy}
              style={inputStyle}
            />
          )}
        </Field>

        <Field
          id="currentPosition"
          label="Current position (optional)"
          error={errors.currentPosition}
        >
          {(describedBy) => (
            <input
              id="currentPosition"
              type="text"
              value={form.currentPosition ?? ''}
              onChange={(e) => update('currentPosition', e.target.value)}
              disabled={disabled}
              aria-describedby={describedBy}
              style={inputStyle}
            />
          )}
        </Field>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
        }}
      >
        <Field id="countryId" label="Country" error={errors.countryId}>
          {(describedBy) => (
            <select
              id="countryId"
              value={form.countryId}
              onChange={(e) => update('countryId', e.target.value)}
              disabled={disabled}
              aria-invalid={errors.countryId ? true : undefined}
              aria-describedby={describedBy}
              style={inputStyle}
            >
              <option value="">Select a country…</option>
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field id="city" label="City (optional)" error={errors.city}>
          {(describedBy) => (
            <input
              id="city"
              type="text"
              value={form.city ?? ''}
              onChange={(e) => update('city', e.target.value)}
              disabled={disabled}
              aria-describedby={describedBy}
              style={inputStyle}
            />
          )}
        </Field>
      </div>

      <Field id="linkedinUrl" label="LinkedIn URL (optional)" error={errors.linkedinUrl}>
        {(describedBy) => (
          <input
            id="linkedinUrl"
            type="url"
            inputMode="url"
            value={form.linkedinUrl ?? ''}
            onChange={(e) => update('linkedinUrl', e.target.value)}
            disabled={disabled}
            placeholder="https://www.linkedin.com/in/you"
            aria-invalid={errors.linkedinUrl ? true : undefined}
            aria-describedby={describedBy}
            style={inputStyle}
          />
        )}
      </Field>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
        }}
      >
        <Field id="portfolioUrl" label="Portfolio URL (optional)" error={errors.portfolioUrl}>
          {(describedBy) => (
            <input
              id="portfolioUrl"
              type="url"
              inputMode="url"
              value={form.portfolioUrl ?? ''}
              onChange={(e) => update('portfolioUrl', e.target.value)}
              disabled={disabled}
              placeholder="https://"
              aria-invalid={errors.portfolioUrl ? true : undefined}
              aria-describedby={describedBy}
              style={inputStyle}
            />
          )}
        </Field>

        <Field
          id="personalWebsiteUrl"
          label="Personal website (optional)"
          error={errors.personalWebsiteUrl}
        >
          {(describedBy) => (
            <input
              id="personalWebsiteUrl"
              type="url"
              inputMode="url"
              value={form.personalWebsiteUrl ?? ''}
              onChange={(e) => update('personalWebsiteUrl', e.target.value)}
              disabled={disabled}
              placeholder="https://"
              aria-invalid={errors.personalWebsiteUrl ? true : undefined}
              aria-describedby={describedBy}
              style={inputStyle}
            />
          )}
        </Field>
      </div>

      <div style={{ marginBottom: '1.1rem' }}>
        <LanguageTagInput
          values={form.interviewLanguages}
          onChange={(values) => update('interviewLanguages', values)}
          error={errors.interviewLanguages}
          describedById={errors.interviewLanguages ? 'interviewLanguages-error' : undefined}
        />
        {errors.interviewLanguages && (
          <p
            id="interviewLanguages-error"
            role="alert"
            style={{ margin: '0.3rem 0 0', color: '#fca5a5', fontSize: '0.8rem' }}
          >
            {errors.interviewLanguages}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={saving || disabled}
        style={{
          padding: '0.6rem 1.4rem',
          background: saving || disabled ? '#334155' : '#2563eb',
          color: '#fff',
          border: 'none',
          borderRadius: '0.5rem',
          fontWeight: 600,
          cursor: saving || disabled ? 'not-allowed' : 'pointer',
        }}
      >
        {saving ? 'Saving…' : 'Save profile'}
      </button>
    </form>
  );
}
