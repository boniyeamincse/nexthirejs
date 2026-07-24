'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-context';
import { ApiClientError, listCompanyApplications } from '@/lib/api-client';
import type { CompanyVerificationStatusValue } from '@nexthire/types';
import { COMPANY_VERIFICATION_STATUSES } from '@nexthire/constants';

interface Row {
  id: string;
  companyId: string;
  status: CompanyVerificationStatusValue;
  submittedAt?: string | null;
  documentCount: number;
  company: { name: string; industry: string | null; headquartersCountryId: string };
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under review',
  CHANGES_REQUESTED: 'Changes requested',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
};

export default function CompanyApplicationsQueuePage() {
  const { getAccessToken, logout, status: authStatus } = useAuth();

  const [rows, setRows] = useState<Row[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setPageError(null);
    try {
      const result = await listCompanyApplications(token, {
        page,
        pageSize: 20,
        status: (statusFilter || undefined) as CompanyVerificationStatusValue | undefined,
      });
      setRows(result.data);
      setTotalPages(result.pagination.totalPages);
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.statusCode === 401) {
          await logout();
          return;
        }
        if (err.statusCode === 403) {
          setPermissionDenied(true);
          return;
        }
      }
      setPageError('Failed to load applications. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, logout, page, statusFilter]);

  useEffect(() => {
    if (authStatus === 'authenticated') {
      void load();
    } else if (authStatus === 'unauthenticated') {
      setLoading(false);
    }
  }, [authStatus, load]);

  if (authStatus === 'unknown' || authStatus === 'loading' || loading) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <p style={{ color: '#94a3b8' }}>Loading...</p>
      </div>
    );
  }

  if (permissionDenied) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <p role="alert" style={{ color: '#fca5a5' }}>
          You do not have permission to review company applications.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 style={{ color: '#f1f5f9', fontSize: '1.6rem', fontWeight: 700, margin: '0 0 1rem' }}>
        Company Applications
      </h1>

      {pageError && (
        <p role="alert" style={{ color: '#fca5a5', marginBottom: '1rem' }}>
          {pageError}
        </p>
      )}

      <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {['', ...COMPANY_VERIFICATION_STATUSES].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => {
              setPage(1);
              setStatusFilter(s);
            }}
            style={{
              padding: '0.35rem 0.8rem',
              borderRadius: '9999px',
              fontSize: '0.83rem',
              fontWeight: 600,
              border: `1px solid ${statusFilter === s ? '#2563eb' : '#334155'}`,
              background: statusFilter === s ? '#2563eb' : '#1e293b',
              color: statusFilter === s ? '#fff' : '#cbd5e1',
              cursor: 'pointer',
            }}
          >
            {s ? (STATUS_LABELS[s] ?? s) : 'All'}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <p style={{ color: '#64748b' }}>No applications found.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {rows.map((row) => (
            <Link
              key={row.id}
              href={`/manage/companies/applications/${row.id}`}
              style={{
                display: 'block',
                padding: '0.85rem 1rem',
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '0.6rem',
                textDecoration: 'none',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '0.95rem' }}>
                  {row.company.name}
                </span>
                <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
                  {STATUS_LABELS[row.status] ?? row.status}
                </span>
              </div>
              <p style={{ margin: '0.3rem 0 0', color: '#64748b', fontSize: '0.8rem' }}>
                {row.company.industry ?? 'Unspecified industry'} · {row.documentCount} document
                {row.documentCount === 1 ? '' : 's'}
                {row.submittedAt
                  ? ` · submitted ${new Date(row.submittedAt).toLocaleDateString()}`
                  : ''}
              </p>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', alignItems: 'center' }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            style={{ padding: '0.3rem 0.7rem', cursor: page <= 1 ? 'not-allowed' : 'pointer' }}
          >
            Prev
          </button>
          <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            style={{
              padding: '0.3rem 0.7rem',
              cursor: page >= totalPages ? 'not-allowed' : 'pointer',
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
