'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-context';
import {
  getCv,
  updateCv,
  getCvReadiness,
  getAllCvSections,
  updateCvSectionContent,
  importCvSectionFromProfile,
  getCvExportPreviewHtml,
  requestCvExport,
  listCvExports,
  getCvExport,
  downloadCvExportBlob,
  ApiClientError,
} from '@/lib/api-client';
import type {
  CvResult,
  CvReadinessResult,
  CvSectionContentResult,
  CvExportResult,
  CvSectionType,
} from '@/lib/api-client';

interface CvEditorProps {
  cvId: string;
}

const IMPORTABLE_SECTIONS: {
  type: CvSectionType;
  label: string;
  itemLabel: (n: number) => string;
}[] = [
  { type: 'education', label: 'Education', itemLabel: (n) => `${n} entr${n === 1 ? 'y' : 'ies'}` },
  {
    type: 'work_experience',
    label: 'Work Experience',
    itemLabel: (n) => `${n} entr${n === 1 ? 'y' : 'ies'}`,
  },
  { type: 'skills', label: 'Skills', itemLabel: (n) => `${n} skill${n === 1 ? '' : 's'}` },
  { type: 'projects', label: 'Projects', itemLabel: (n) => `${n} project${n === 1 ? '' : 's'}` },
  {
    type: 'certifications',
    label: 'Certifications',
    itemLabel: (n) => `${n} certification${n === 1 ? '' : 's'}`,
  },
  { type: 'languages', label: 'Languages', itemLabel: (n) => `${n} language${n === 1 ? '' : 's'}` },
  {
    type: 'achievements',
    label: 'Achievements',
    itemLabel: (n) => `${n} achievement${n === 1 ? '' : 's'}`,
  },
];

const sectionCardStyle: React.CSSProperties = {
  padding: '1.1rem 1.25rem',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '0.75rem',
  marginBottom: '0.9rem',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  color: '#94a3b8',
  fontSize: '0.85rem',
  marginBottom: '0.35rem',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.55rem 0.7rem',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: '0.5rem',
  color: '#e2e8f0',
  fontSize: '0.9rem',
};

const textAreaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: '7rem',
  resize: 'vertical',
  fontFamily: 'inherit',
};

const primaryButtonStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  background: 'rgba(99, 102, 241, 0.85)',
  color: '#fff',
  border: 'none',
  borderRadius: '0.5rem',
  fontWeight: 600,
  cursor: 'pointer',
  fontSize: '0.85rem',
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: '0.45rem 0.9rem',
  background: 'rgba(255,255,255,0.06)',
  color: '#e2e8f0',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: '0.5rem',
  fontWeight: 500,
  cursor: 'pointer',
  fontSize: '0.82rem',
};

const sectionHeadingStyle: React.CSSProperties = {
  color: '#e2e8f0',
  fontSize: '1rem',
  fontWeight: 600,
  marginBottom: '0.75rem',
};

function contentItemCount(content: Record<string, unknown> | undefined): number {
  if (!content) return 0;
  const items = content.items;
  return Array.isArray(items) ? items.length : 0;
}

const STATUS_LABEL: Record<CvExportResult['status'], string> = {
  PENDING: 'Queued',
  GENERATING: 'Generating…',
  READY: 'Ready',
  FAILED: 'Failed',
};

export function CvEditor({ cvId }: CvEditorProps) {
  const { getAccessToken, logout } = useAuth();
  const router = useRouter();

  const [cv, setCv] = useState<CvResult | null>(null);
  const [readiness, setReadiness] = useState<CvReadinessResult | null>(null);
  const [sections, setSections] = useState<Map<string, CvSectionContentResult>>(new Map());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [detailsSaving, setDetailsSaving] = useState(false);
  const [detailsSaved, setDetailsSaved] = useState(false);

  const [summary, setSummary] = useState('');
  const [summarySaving, setSummarySaving] = useState(false);
  const [summarySaved, setSummarySaved] = useState(false);

  const [importingType, setImportingType] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const [exports, setExports] = useState<CvExportResult[]>([]);
  const [exportPending, setExportPending] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }
    setLoadError(null);
    try {
      const [cvData, readinessData, sectionsData, exportsData] = await Promise.all([
        getCv(token, cvId),
        getCvReadiness(token, cvId),
        getAllCvSections(token, cvId),
        listCvExports(token, cvId),
      ]);
      setCv(cvData);
      setTitle(cvData.title);
      setReadiness(readinessData);
      const map = new Map(sectionsData.map((s) => [s.sectionType, s]));
      setSections(map);
      setSummary((map.get('professional_summary')?.content?.summary as string) || '');
      setExports(exportsData);
    } catch (err) {
      if (err instanceof ApiClientError && err.statusCode === 401) {
        await logout();
        router.push('/login');
        return;
      }
      if (err instanceof ApiClientError && err.statusCode === 404) {
        setLoadError('This CV does not exist or you do not have access to it.');
      } else {
        setLoadError('Unable to load this CV right now. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [cvId, getAccessToken, logout, router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function refreshReadiness() {
    const token = getAccessToken();
    if (!token) return;
    try {
      const r = await getCvReadiness(token, cvId);
      setReadiness(r);
    } catch {
      // best-effort refresh
    }
  }

  async function handleSaveDetails(e: FormEvent) {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) return;
    setDetailsSaving(true);
    setDetailsSaved(false);
    try {
      const updated = await updateCv(token, cvId, { title: title.trim() });
      setCv(updated);
      setDetailsSaved(true);
    } catch {
      // surfaced via generic reload-on-failure pattern; keep silent per-field for now
    } finally {
      setDetailsSaving(false);
    }
  }

  async function handleTemplateChange(template: string) {
    const token = getAccessToken();
    if (!token || !cv) return;
    const updated = await updateCv(token, cvId, { template });
    setCv(updated);
  }

  async function handleVisibilityChange(visibility: string) {
    const token = getAccessToken();
    if (!token || !cv) return;
    const updated = await updateCv(token, cvId, { visibility });
    setCv(updated);
  }

  async function handleSaveSummary(e: FormEvent) {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) return;
    setSummarySaving(true);
    setSummarySaved(false);
    try {
      const result = await updateCvSectionContent(token, cvId, 'professional_summary', {
        summary: summary.trim(),
      });
      setSections((prev) => new Map(prev).set('professional_summary', result));
      setSummarySaved(true);
      await refreshReadiness();
    } catch {
      // keep prior state
    } finally {
      setSummarySaving(false);
    }
  }

  async function handleImport(type: CvSectionType) {
    const token = getAccessToken();
    if (!token) return;
    setImportError(null);
    setImportingType(type);
    try {
      const result = await importCvSectionFromProfile(token, cvId, type);
      setSections((prev) => new Map(prev).set(type, result));
      await refreshReadiness();
    } catch {
      setImportError('Unable to import from your profile right now. Please try again.');
    } finally {
      setImportingType(null);
    }
  }

  async function handleTogglePreview() {
    if (showPreview) {
      setShowPreview(false);
      return;
    }
    const token = getAccessToken();
    if (!token) return;
    try {
      const html = await getCvExportPreviewHtml(token, cvId);
      setPreviewHtml(html);
      setShowPreview(true);
    } catch {
      setExportError('Unable to load the preview right now.');
    }
  }

  async function handleRequestExport() {
    const token = getAccessToken();
    if (!token) return;
    setExportError(null);
    setExportPending(true);
    try {
      const record = await requestCvExport(token, cvId);
      setExports((prev) => [record, ...prev]);
      await pollExport(record.id);
    } catch (err) {
      if (err instanceof ApiClientError && err.statusCode === 400) {
        setExportError('Add a professional summary before generating a PDF.');
      } else if (err instanceof ApiClientError && err.statusCode === 409) {
        setExportError('An export is already in progress for this CV.');
      } else {
        setExportError('Unable to start the export. Please try again.');
      }
    } finally {
      setExportPending(false);
    }
  }

  async function pollExport(exportId: string) {
    const token = getAccessToken();
    if (!token) return;
    const deadline = Date.now() + 20000;
    let status: CvExportResult['status'] = 'PENDING';
    while (status !== 'READY' && status !== 'FAILED' && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 700));
      try {
        const record = await getCvExport(token, cvId, exportId);
        status = record.status;
        setExports((prev) => prev.map((e) => (e.id === exportId ? record : e)));
      } catch {
        break;
      }
    }
  }

  async function handleDownload(exportId: string) {
    const token = getAccessToken();
    if (!token) return;
    setDownloadingId(exportId);
    setExportError(null);
    try {
      const blob = await downloadCvExportBlob(token, cvId, exportId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${cv?.title || 'cv'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setExportError('Unable to download this file. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '2rem 1.5rem' }} aria-busy="true">
        <p style={{ color: '#94a3b8' }}>Loading CV…</p>
      </div>
    );
  }

  if (loadError || !cv) {
    return (
      <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div role="alert" style={{ color: '#fca5a5', marginBottom: '1rem' }}>
          {loadError ?? 'This CV is unavailable.'}
        </div>
        <Link href="/cv" style={secondaryButtonStyle}>
          Back to my CVs
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ marginBottom: '1rem' }}>
        <Link href="/cv" style={{ color: '#818cf8', fontSize: '0.85rem', textDecoration: 'none' }}>
          ← Back to my CVs
        </Link>
      </div>

      <h1 style={{ color: '#e2e8f0', fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.5rem' }}>
        {cv.title}
      </h1>

      <section style={sectionCardStyle} aria-labelledby="cv-details-heading">
        <h2 id="cv-details-heading" style={sectionHeadingStyle}>
          Details
        </h2>
        <form onSubmit={handleSaveDetails} noValidate>
          <div style={{ marginBottom: '0.9rem' }}>
            <label htmlFor="cv-title-input" style={labelStyle}>
              Title
            </label>
            <input
              id="cv-title-input"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setDetailsSaved(false);
              }}
              style={inputStyle}
              maxLength={200}
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(11rem, 1fr))',
              gap: '0.9rem',
              marginBottom: '0.9rem',
            }}
          >
            <div>
              <label htmlFor="cv-template" style={labelStyle}>
                Template
              </label>
              <select
                id="cv-template"
                value={cv.template}
                onChange={(e) => void handleTemplateChange(e.target.value)}
                style={inputStyle}
              >
                <option value="ATS_OPTIMIZED">ATS Optimized</option>
                <option value="MODERN">Modern</option>
                <option value="CLASSIC">Classic</option>
                <option value="MINIMAL">Minimal</option>
              </select>
            </div>
            <div>
              <label htmlFor="cv-visibility" style={labelStyle}>
                Visibility
              </label>
              <select
                id="cv-visibility"
                value={cv.visibility}
                onChange={(e) => void handleVisibilityChange(e.target.value)}
                style={inputStyle}
              >
                <option value="PRIVATE">Private</option>
                <option value="UNLISTED">Unlisted</option>
                <option value="PUBLIC">Public</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button type="submit" style={primaryButtonStyle} disabled={detailsSaving}>
              {detailsSaving ? 'Saving…' : 'Save title'}
            </button>
            {detailsSaved && (
              <span style={{ color: '#86efac', fontSize: '0.82rem' }} role="status">
                Saved
              </span>
            )}
          </div>
        </form>
      </section>

      {readiness && (
        <div
          role={readiness.ready ? 'status' : 'alert'}
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '0.5rem',
            marginBottom: '0.9rem',
            fontSize: '0.85rem',
            background: readiness.ready ? 'rgba(34, 197, 94, 0.1)' : 'rgba(234, 179, 8, 0.1)',
            border: readiness.ready
              ? '1px solid rgba(34, 197, 94, 0.3)'
              : '1px solid rgba(234, 179, 8, 0.3)',
            color: readiness.ready ? '#86efac' : '#fde68a',
          }}
        >
          {readiness.ready
            ? `Ready to export · ${readiness.completionScore}% complete`
            : `Add a professional summary to enable PDF export · ${readiness.completionScore}% complete`}
        </div>
      )}

      <section style={sectionCardStyle} aria-labelledby="cv-summary-heading">
        <h2 id="cv-summary-heading" style={sectionHeadingStyle}>
          Professional Summary
        </h2>
        <form onSubmit={handleSaveSummary} noValidate>
          <label htmlFor="cv-summary" style={labelStyle}>
            A short summary shown at the top of your CV
          </label>
          <textarea
            id="cv-summary"
            value={summary}
            onChange={(e) => {
              setSummary(e.target.value);
              setSummarySaved(false);
            }}
            style={textAreaStyle}
            maxLength={2000}
          />
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.6rem' }}
          >
            <button type="submit" style={primaryButtonStyle} disabled={summarySaving}>
              {summarySaving ? 'Saving…' : 'Save summary'}
            </button>
            {summarySaved && (
              <span style={{ color: '#86efac', fontSize: '0.82rem' }} role="status">
                Saved
              </span>
            )}
          </div>
        </form>
      </section>

      <section style={sectionCardStyle} aria-labelledby="cv-import-heading">
        <h2 id="cv-import-heading" style={sectionHeadingStyle}>
          Import from your profile
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.83rem', marginBottom: '0.9rem' }}>
          Snapshot verified entries from your profile into this CV. Later profile edits won&apos;t
          change this CV until you import again.
        </p>

        {importError && (
          <div
            role="alert"
            style={{ color: '#fca5a5', fontSize: '0.83rem', marginBottom: '0.75rem' }}
          >
            {importError}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {IMPORTABLE_SECTIONS.map((section) => {
            const content = sections.get(section.type)?.content;
            const count = contentItemCount(content);
            return (
              <div
                key={section.type}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.65rem 0.85rem',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '0.5rem',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <div>
                  <div style={{ color: '#e2e8f0', fontSize: '0.88rem', fontWeight: 500 }}>
                    {section.label}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.78rem' }}>
                    {count > 0 ? section.itemLabel(count) : 'Not imported yet'}
                  </div>
                </div>
                <button
                  type="button"
                  style={secondaryButtonStyle}
                  disabled={importingType === section.type}
                  onClick={() => void handleImport(section.type)}
                >
                  {importingType === section.type
                    ? 'Importing…'
                    : count > 0
                      ? 'Re-import'
                      : 'Import from profile'}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <section style={sectionCardStyle} aria-labelledby="cv-export-heading">
        <h2 id="cv-export-heading" style={sectionHeadingStyle}>
          Preview and Export
        </h2>

        {exportError && (
          <div
            role="alert"
            style={{ color: '#fca5a5', fontSize: '0.83rem', marginBottom: '0.75rem' }}
          >
            {exportError}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            style={secondaryButtonStyle}
            onClick={() => void handleTogglePreview()}
          >
            {showPreview ? 'Hide preview' : 'Show preview'}
          </button>
          <button
            type="button"
            style={primaryButtonStyle}
            disabled={exportPending || !readiness?.ready}
            onClick={() => void handleRequestExport()}
          >
            {exportPending ? 'Generating…' : 'Generate PDF'}
          </button>
        </div>

        {showPreview && previewHtml && (
          <iframe
            title="CV preview"
            srcDoc={previewHtml}
            sandbox=""
            style={{
              width: '100%',
              height: '32rem',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '0.5rem',
              background: '#fff',
              marginBottom: '1rem',
            }}
          />
        )}

        <h3 style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.6rem' }}>
          Export history
        </h3>
        {exports.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: '0.83rem' }}>No exports yet.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {exports.map((exp) => (
              <li
                key={exp.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.6rem 0.75rem',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '0.5rem',
                  marginBottom: '0.5rem',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <div>
                  <span
                    style={{
                      color:
                        exp.status === 'READY'
                          ? '#86efac'
                          : exp.status === 'FAILED'
                            ? '#fca5a5'
                            : '#fde68a',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                    }}
                  >
                    {STATUS_LABEL[exp.status]}
                  </span>
                  <span style={{ color: '#64748b', fontSize: '0.78rem', marginLeft: '0.5rem' }}>
                    {new Date(exp.requestedAt).toLocaleString()}
                  </span>
                </div>
                {exp.status === 'READY' && (
                  <button
                    type="button"
                    style={secondaryButtonStyle}
                    disabled={downloadingId === exp.id}
                    onClick={() => void handleDownload(exp.id)}
                  >
                    {downloadingId === exp.id ? 'Downloading…' : 'Download'}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
