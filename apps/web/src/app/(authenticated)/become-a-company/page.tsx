'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/providers/auth-context';
import {
  ApiClientError,
  getMyCompanyProfile,
  updateMyCompanyProfile,
  getMyCompanyApplication,
  createMyCompanyApplication,
  submitMyCompanyApplication,
  withdrawMyCompanyApplication,
  uploadCompanyVerificationDocument,
  removeCompanyVerificationDocument,
} from '@/lib/api-client';
import type {
  CompanyProfileResult,
  CompanyApplicationDetail,
  CompanyApplicationReadiness,
  CompanyVerificationDocumentResult,
  CompanyDocumentTypeValue,
} from '@nexthire/types';
import { COMPANY_SIZES, COMPANY_DOCUMENT_TYPES } from '@nexthire/constants';

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  BUSINESS_REGISTRATION: 'Business registration',
  TAX_CERTIFICATE: 'Tax certificate',
  AUTHORIZATION_LETTER: 'Authorization letter',
  OTHER_SUPPORTING_DOCUMENT: 'Other supporting document',
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under review',
  CHANGES_REQUESTED: 'Changes requested',
  APPROVED: 'Verified',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
};

const cardStyle: React.CSSProperties = {
  padding: '1.25rem',
  background: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '0.75rem',
  marginBottom: '1.25rem',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.7rem',
  background: '#0f172a',
  border: '1px solid #334155',
  borderRadius: '0.4rem',
  color: '#e2e8f0',
  fontSize: '0.88rem',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  color: '#cbd5e1',
  fontSize: '0.85rem',
  marginBottom: '0.3rem',
  marginTop: '0.75rem',
};

export default function BecomeACompanyPage() {
  const { getAccessToken, logout, status: authStatus } = useAuth();

  const [profile, setProfile] = useState<CompanyProfileResult | null>(null);
  const [application, setApplication] = useState<CompanyApplicationDetail | null>(null);
  const [readiness, setReadiness] = useState<CompanyApplicationReadiness | null>(null);
  const [documents, setDocuments] = useState<CompanyVerificationDocumentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    legalName: '',
    website: '',
    industry: '',
    companySize: '',
    headquartersCountryId: '',
    headquartersCity: '',
    description: '',
  });
  const [docType, setDocType] = useState<CompanyDocumentTypeValue>('BUSINESS_REGISTRATION');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setPageError(null);
    try {
      const [p, a] = await Promise.all([getMyCompanyProfile(token), getMyCompanyApplication(token)]);
      setProfile(p);
      if (p) {
        setForm({
          name: p.name,
          legalName: p.legalName ?? '',
          website: p.website ?? '',
          industry: p.industry ?? '',
          companySize: p.companySize ?? '',
          headquartersCountryId: p.headquartersCountryId,
          headquartersCity: p.headquartersCity ?? '',
          description: p.description,
        });
      }
      setApplication(a.application);
      setReadiness(a.readiness);
      setDocuments(a.documents);
    } catch (err) {
      if (err instanceof ApiClientError && err.statusCode === 401) {
        await logout();
        return;
      }
      setPageError('Failed to load your company details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, logout]);

  useEffect(() => {
    if (authStatus === 'authenticated') {
      void load();
    } else if (authStatus === 'unauthenticated') {
      setLoading(false);
    }
  }, [authStatus, load]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) return;
    setSaving(true);
    setActionError(null);
    try {
      await updateMyCompanyProfile(token, {
        name: form.name,
        legalName: form.legalName || undefined,
        website: form.website || undefined,
        industry: form.industry || undefined,
        companySize: form.companySize || undefined,
        headquartersCountryId: form.headquartersCountryId,
        headquartersCity: form.headquartersCity || undefined,
        description: form.description,
      });
      await load();
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  }

  async function handleStartApplication() {
    const token = getAccessToken();
    if (!token) return;
    setActionError(null);
    try {
      await createMyCompanyApplication(token);
      await load();
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : 'Failed to start verification.');
    }
  }

  async function handleUploadDocument() {
    const token = getAccessToken();
    if (!token || !docFile) return;
    setUploading(true);
    setActionError(null);
    try {
      await uploadCompanyVerificationDocument(token, { type: docType, file: docFile });
      setDocFile(null);
      await load();
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : 'Failed to upload document.');
    } finally {
      setUploading(false);
    }
  }

  async function handleRemoveDocument(documentId: string) {
    const token = getAccessToken();
    if (!token) return;
    setActionError(null);
    try {
      await removeCompanyVerificationDocument(token, documentId);
      await load();
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : 'Failed to remove document.');
    }
  }

  async function handleSubmit() {
    const token = getAccessToken();
    if (!token) return;
    setActionError(null);
    try {
      await submitMyCompanyApplication(token);
      await load();
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : 'Failed to submit application.');
    }
  }

  async function handleWithdraw() {
    const token = getAccessToken();
    if (!token) return;
    setActionError(null);
    try {
      await withdrawMyCompanyApplication(token);
      await load();
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : 'Failed to withdraw application.');
    }
  }

  if (authStatus === 'unknown' || authStatus === 'loading' || loading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <p style={{ color: '#94a3b8' }}>Loading...</p>
      </div>
    );
  }

  const canEditProfileAndDocs =
    !application || application.status === 'DRAFT' || application.status === 'CHANGES_REQUESTED';
  const canWithdraw =
    application &&
    ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUESTED'].includes(application.status);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 style={{ color: '#f1f5f9', fontSize: '1.8rem', fontWeight: 700, margin: '0 0 0.25rem' }}>
        Become a Company
      </h1>
      <p style={{ color: '#94a3b8', margin: '0 0 1.5rem' }}>
        Set up and verify your company profile to start hiring on NextHire.
      </p>

      {pageError && (
        <div role="alert" style={{ ...cardStyle, color: '#fca5a5' }}>
          {pageError}
        </div>
      )}
      {actionError && (
        <div role="alert" style={{ ...cardStyle, color: '#fca5a5' }}>
          {actionError}
        </div>
      )}

      {application && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, color: '#f1f5f9', fontSize: '1.1rem' }}>Verification status</h2>
            <span
              style={{
                padding: '0.2rem 0.65rem',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                fontWeight: 600,
                background:
                  application.status === 'APPROVED'
                    ? 'rgba(34,197,94,0.15)'
                    : application.status === 'REJECTED'
                      ? 'rgba(239,68,68,0.15)'
                      : 'rgba(245,158,11,0.15)',
                color:
                  application.status === 'APPROVED'
                    ? '#86efac'
                    : application.status === 'REJECTED'
                      ? '#fca5a5'
                      : '#fcd34d',
              }}
            >
              {STATUS_LABELS[application.status] ?? application.status}
            </span>
          </div>
          {application.status === 'CHANGES_REQUESTED' && application.reviewerNote && (
            <p style={{ margin: '0.75rem 0 0', color: '#fcd34d', fontSize: '0.85rem' }}>
              Reviewer note: {application.reviewerNote}
            </p>
          )}
          {application.status === 'REJECTED' && (
            <p style={{ margin: '0.75rem 0 0', color: '#fca5a5', fontSize: '0.85rem' }}>
              {application.decisionReasonCode}
              {application.reviewerNote ? ` — ${application.reviewerNote}` : ''}
            </p>
          )}
          {canWithdraw && (
            <button
              onClick={handleWithdraw}
              style={{
                marginTop: '0.75rem',
                padding: '0.4rem 0.9rem',
                background: 'rgba(239,68,68,0.15)',
                color: '#fca5a5',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '0.4rem',
                fontSize: '0.83rem',
                cursor: 'pointer',
              }}
            >
              Withdraw application
            </button>
          )}
        </div>
      )}

      <div style={cardStyle}>
        <h2 style={{ margin: '0 0 0.75rem', color: '#f1f5f9', fontSize: '1.1rem' }}>Company profile</h2>
        <form onSubmit={handleSaveProfile}>
          <fieldset disabled={!canEditProfileAndDocs} style={{ border: 'none', padding: 0, margin: 0 }}>
            <label style={labelStyle}>Company name</label>
            <input
              style={inputStyle}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
            <label style={labelStyle}>Legal name (optional)</label>
            <input
              style={inputStyle}
              value={form.legalName}
              onChange={(e) => setForm((f) => ({ ...f, legalName: e.target.value }))}
            />
            <label style={labelStyle}>Website (optional)</label>
            <input
              style={inputStyle}
              value={form.website}
              onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
              placeholder="https://example.com"
            />
            <label style={labelStyle}>Industry (optional)</label>
            <input
              style={inputStyle}
              value={form.industry}
              onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
            />
            <label style={labelStyle}>Company size (optional)</label>
            <select
              style={inputStyle}
              value={form.companySize}
              onChange={(e) => setForm((f) => ({ ...f, companySize: e.target.value }))}
            >
              <option value="">Select...</option>
              {COMPANY_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s} employees
                </option>
              ))}
            </select>
            <label style={labelStyle}>Headquarters country ID</label>
            <input
              style={inputStyle}
              value={form.headquartersCountryId}
              onChange={(e) => setForm((f) => ({ ...f, headquartersCountryId: e.target.value }))}
              placeholder="Country UUID"
              required
            />
            <label style={labelStyle}>Headquarters city (optional)</label>
            <input
              style={inputStyle}
              value={form.headquartersCity}
              onChange={(e) => setForm((f) => ({ ...f, headquartersCity: e.target.value }))}
            />
            <label style={labelStyle}>Description</label>
            <textarea
              style={{ ...inputStyle, resize: 'vertical' }}
              rows={4}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              required
            />
          </fieldset>
          {canEditProfileAndDocs && (
            <button
              type="submit"
              disabled={saving}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1.1rem',
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: '0.4rem',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'Saving...' : 'Save profile'}
            </button>
          )}
        </form>
      </div>

      {profile && !application && (
        <div style={cardStyle}>
          <p style={{ margin: '0 0 0.75rem', color: '#cbd5e1', fontSize: '0.9rem' }}>
            Your profile is ready. Start verification to unlock hiring on NextHire.
          </p>
          <button
            onClick={handleStartApplication}
            style={{
              padding: '0.5rem 1.1rem',
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '0.4rem',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
            }}
          >
            Start verification
          </button>
        </div>
      )}

      {application && canEditProfileAndDocs && (
        <div style={cardStyle}>
          <h2 style={{ margin: '0 0 0.75rem', color: '#f1f5f9', fontSize: '1.1rem' }}>
            Verification documents
          </h2>
          {documents.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0 0 0.75rem' }}>
              No documents uploaded yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.75rem' }}>
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  style={{
                    padding: '0.5rem 0.7rem',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '0.4rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.85rem',
                  }}
                >
                  <span style={{ color: '#e2e8f0' }}>
                    {DOCUMENT_TYPE_LABELS[doc.type] ?? doc.type} — {doc.originalFileName}
                  </span>
                  <button
                    onClick={() => handleRemoveDocument(doc.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#fca5a5',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as CompanyDocumentTypeValue)}
              style={{ ...inputStyle, width: 'auto' }}
            >
              {COMPANY_DOCUMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {DOCUMENT_TYPE_LABELS[t] ?? t}
                </option>
              ))}
            </select>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
              style={{ color: '#cbd5e1', fontSize: '0.83rem' }}
            />
            <button
              onClick={handleUploadDocument}
              disabled={!docFile || uploading}
              style={{
                padding: '0.4rem 0.9rem',
                background: '#334155',
                color: '#e2e8f0',
                border: 'none',
                borderRadius: '0.4rem',
                fontSize: '0.83rem',
                cursor: !docFile || uploading ? 'not-allowed' : 'pointer',
              }}
            >
              {uploading ? '...' : 'Upload'}
            </button>
          </div>

          {readiness && (
            <div style={{ marginTop: '1rem' }}>
              {readiness.ready ? (
                <button
                  onClick={handleSubmit}
                  style={{
                    padding: '0.5rem 1.1rem',
                    background: '#15803d',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '0.4rem',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                  }}
                >
                  Submit for review
                </button>
              ) : (
                <ul style={{ margin: 0, paddingLeft: '1.1rem', color: '#fcd34d', fontSize: '0.83rem' }}>
                  {readiness.blockers.map((b) => (
                    <li key={b.code}>{b.message}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
