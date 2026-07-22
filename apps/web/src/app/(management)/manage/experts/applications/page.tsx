'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-context';
import { ApiClientError, listExpertApplications, listSupportedCountries } from '@/lib/api-client';
import type {
  PaginatedExpertApplicationResult,
  ExpertApplicationListQuery,
  ExpertApplicationStatusValue,
  Country,
} from '@nexthire/types';
import { EXPERT_APPLICATION_STATUSES } from '@nexthire/constants';
import { StatusBadge } from '@/features/experts/components/StatusBadge';
import {
  canReviewExpertApplications,
  formatDate,
} from '@/features/experts/lib/expert-presentation';

const PAGE_SIZE = 20;

const inputStyle: React.CSSProperties = {
  padding: '0.45rem 0.6rem',
  background: '#0f172a',
  border: '1px solid #334155',
  borderRadius: '0.45rem',
  color: '#f1f5f9',
  fontSize: '0.85rem',
};

export default function ExpertApplicationsQueuePage() {
  const { getAccessToken, logout, status: authStatus, user } = useAuth();

  const [filters, setFilters] = useState<ExpertApplicationListQuery>({
    page: 1,
    pageSize: PAGE_SIZE,
  });
  const [result, setResult] = useState<PaginatedExpertApplicationResult | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const canReview = canReviewExpertApplications(user?.roleCodes);

  const load = useCallback(
    async (query: ExpertApplicationListQuery) => {
      const token = getAccessToken();
      if (!token) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      setPermissionDenied(false);
      try {
        const data = await listExpertApplications(token, query);
        setResult(data);
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
        setError('We could not load applications. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [getAccessToken, logout],
  );

  useEffect(() => {
    if (authStatus !== 'authenticated') {
      if (authStatus === 'unauthenticated') setLoading(false);
      return;
    }
    const token = getAccessToken();
    if (token) {
      void listSupportedCountries(token)
        .then((r) => setCountries(r.countries))
        .catch(() => setCountries([]));
    }
    void load(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus]);

  const applyFilters = (next: Partial<ExpertApplicationListQuery>) => {
    const merged: ExpertApplicationListQuery = { ...filters, ...next, page: next.page ?? 1 };
    setFilters(merged);
    void load(merged);
  };

  if (authStatus === 'unknown' || authStatus === 'loading') {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <p style={{ color: '#94a3b8' }}>Loading…</p>
      </div>
    );
  }

  if (permissionDenied || (authStatus === 'authenticated' && !canReview && !result)) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <h1 style={{ color: '#f1f5f9', fontSize: '1.6rem', fontWeight: 700 }}>
          Expert applications
        </h1>
        <p role="alert" style={{ color: '#fca5a5', marginTop: '1rem' }}>
          You do not have permission to review expert applications.
        </p>
      </div>
    );
  }

  const items = result?.data ?? [];
  const pagination = result?.pagination;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 style={{ color: '#f1f5f9', fontSize: '1.6rem', fontWeight: 700, margin: '0 0 0.35rem' }}>
        Expert applications
      </h1>
      <p style={{ color: '#94a3b8', margin: '0 0 1.25rem' }}>
        Review and decide on expert verification applications.
      </p>

      {/* Filters */}
      <form
        aria-label="Filter applications"
        onSubmit={(e) => {
          e.preventDefault();
          applyFilters({});
        }}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          alignItems: 'flex-end',
          marginBottom: '1.25rem',
        }}
      >
        <div>
          <label
            htmlFor="filter-search"
            style={{
              display: 'block',
              color: '#94a3b8',
              fontSize: '0.75rem',
              marginBottom: '0.25rem',
            }}
          >
            Search
          </label>
          <input
            id="filter-search"
            type="search"
            value={filters.search ?? ''}
            onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
            placeholder="Title or applicant"
            style={inputStyle}
          />
        </div>
        <div>
          <label
            htmlFor="filter-status"
            style={{
              display: 'block',
              color: '#94a3b8',
              fontSize: '0.75rem',
              marginBottom: '0.25rem',
            }}
          >
            Status
          </label>
          <select
            id="filter-status"
            value={filters.status ?? ''}
            onChange={(e) =>
              applyFilters({
                status: (e.target.value || undefined) as ExpertApplicationStatusValue | undefined,
              })
            }
            style={inputStyle}
          >
            <option value="">All statuses</option>
            {EXPERT_APPLICATION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="filter-country"
            style={{
              display: 'block',
              color: '#94a3b8',
              fontSize: '0.75rem',
              marginBottom: '0.25rem',
            }}
          >
            Country
          </label>
          <select
            id="filter-country"
            value={filters.country ?? ''}
            onChange={(e) => applyFilters({ country: e.target.value || undefined })}
            style={inputStyle}
          >
            <option value="">All countries</option>
            {countries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="filter-from"
            style={{
              display: 'block',
              color: '#94a3b8',
              fontSize: '0.75rem',
              marginBottom: '0.25rem',
            }}
          >
            Submitted from
          </label>
          <input
            id="filter-from"
            type="date"
            value={filters.submittedFrom ?? ''}
            onChange={(e) => applyFilters({ submittedFrom: e.target.value || undefined })}
            style={inputStyle}
          />
        </div>
        <div>
          <label
            htmlFor="filter-to"
            style={{
              display: 'block',
              color: '#94a3b8',
              fontSize: '0.75rem',
              marginBottom: '0.25rem',
            }}
          >
            Submitted to
          </label>
          <input
            id="filter-to"
            type="date"
            value={filters.submittedTo ?? ''}
            onChange={(e) => applyFilters({ submittedTo: e.target.value || undefined })}
            style={inputStyle}
          />
        </div>
        <button
          type="submit"
          style={{
            ...inputStyle,
            background: '#2563eb',
            border: '1px solid #2563eb',
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Apply
        </button>
      </form>

      {error && (
        <div
          role="alert"
          style={{
            margin: '1rem 0',
            padding: '0.75rem 0.9rem',
            borderRadius: '0.6rem',
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.4)',
            color: '#fca5a5',
          }}
        >
          {error}{' '}
          <button
            onClick={() => void load(filters)}
            style={{
              marginLeft: '0.5rem',
              textDecoration: 'underline',
              background: 'none',
              border: 'none',
              color: '#fca5a5',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <p style={{ color: '#94a3b8' }}>Loading applications…</p>
      ) : items.length === 0 ? (
        <p style={{ color: '#94a3b8', padding: '2rem 0', textAlign: 'center' }}>
          No applications match the current filters.
        </p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '760px' }}>
            <caption style={{ position: 'absolute', left: '-9999px' }}>
              Expert applications, sortable by submission date
            </caption>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155' }}>
                <th scope="col" style={thStyle}>
                  Professional title
                </th>
                <th scope="col" style={thStyle}>
                  Experience
                </th>
                <th scope="col" style={thStyle}>
                  Country
                </th>
                <th scope="col" style={thStyle}>
                  Submitted
                </th>
                <th scope="col" style={thStyle}>
                  Documents
                </th>
                <th scope="col" style={thStyle}>
                  Status
                </th>
                <th scope="col" style={thStyle}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={tdStyle}>
                    <span style={{ color: '#f1f5f9', fontWeight: 600 }}>
                      {item.profile.professionalTitle}
                    </span>
                  </td>
                  <td style={tdStyle}>{item.profile.yearsOfExperience} yrs</td>
                  <td style={tdStyle}>{item.profile.countryId}</td>
                  <td style={tdStyle}>{formatDate(item.submittedAt)}</td>
                  <td style={tdStyle}>{item.documentCount}</td>
                  <td style={tdStyle}>
                    <StatusBadge status={item.status} />
                  </td>
                  <td style={tdStyle}>
                    <Link
                      href={`/manage/experts/applications/${item.id}`}
                      style={{ color: '#93c5fd', textDecoration: 'underline' }}
                    >
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <nav
          aria-label="Pagination"
          style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.25rem' }}
        >
          <button
            type="button"
            disabled={pagination.page <= 1}
            onClick={() => applyFilters({ page: pagination.page - 1 })}
            style={{
              ...inputStyle,
              cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer',
              opacity: pagination.page <= 1 ? 0.5 : 1,
            }}
          >
            Previous
          </button>
          <span style={{ color: '#94a3b8', fontSize: '0.85rem' }} aria-current="page">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </span>
          <button
            type="button"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => applyFilters({ page: pagination.page + 1 })}
            style={{
              ...inputStyle,
              cursor: pagination.page >= pagination.totalPages ? 'not-allowed' : 'pointer',
              opacity: pagination.page >= pagination.totalPages ? 0.5 : 1,
            }}
          >
            Next
          </button>
        </nav>
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '0.6rem 0.75rem',
  color: '#94a3b8',
  fontSize: '0.72rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  fontWeight: 600,
};

const tdStyle: React.CSSProperties = {
  padding: '0.75rem',
  color: '#cbd5e1',
  fontSize: '0.88rem',
};
