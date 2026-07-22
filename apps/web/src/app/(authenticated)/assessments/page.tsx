'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/providers/auth-context';
import { listAssessments, ApiClientError } from '@/lib/api-client';
import type { AssessmentCatalogItem, PaginatedAssessmentCatalogResult } from '@nexthire/types';

function AssessmentsPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { getAccessToken, logout, status: authStatus } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<PaginatedAssessmentCatalogResult | null>(null);

  const currentPage = useMemo(() => {
    const p = searchParams.get('page');
    return p ? Math.max(1, parseInt(p, 10) || 1) : 1;
  }, [searchParams]);

  const currentSearch = searchParams.get('search') ?? '';
  const currentCategory = searchParams.get('category') ?? '';
  const currentType = searchParams.get('type') ?? '';
  const currentDifficulty = searchParams.get('difficulty') ?? '';
  const currentAvailability = searchParams.get('availability') ?? '';

  const fetchCatalog = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      await logout();
      router.push('/login');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (currentPage > 1) params.set('page', String(currentPage));
      if (currentSearch) params.set('search', currentSearch);
      if (currentCategory) params.set('category', currentCategory);
      if (currentType) params.set('type', currentType);
      if (currentDifficulty) params.set('difficulty', currentDifficulty);
      if (currentAvailability) params.set('availability', currentAvailability);

      const result = await listAssessments(token, params.toString());
      setCatalog(result);
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.statusCode === 401) {
          await logout();
          router.push('/login');
          return;
        }
        setError(err.message);
      } else {
        setError('Failed to load assessments. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, logout, router, currentPage, currentSearch, currentCategory, currentType, currentDifficulty, currentAvailability]);

  useEffect(() => {
    if (authStatus === 'authenticated') {
      void fetchCatalog();
    } else if (authStatus === 'unauthenticated') {
      setLoading(false);
    }
  }, [authStatus, fetchCatalog]);

  function updateQuery(params: Record<string, string>) {
    const sp = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(params)) {
      if (value) sp.set(key, value);
      else sp.delete(key);
    }
    if (params.page === undefined || params.page === '1') sp.delete('page');
    if (params.search === undefined && !sp.get('search')) sp.delete('page');
    sp.delete('page');
    const qs = sp.toString();
    router.push(`/assessments${qs ? `?${qs}` : ''}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const fd = new FormData(form);
    updateQuery({ search: (fd.get('search') as string)?.trim() ?? '' });
  }

  function clearFilters() {
    router.push('/assessments');
  }

  if (authStatus === 'unknown' || authStatus === 'loading') {
    return (
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '2rem', color: '#94a3b8' }}>
        Loading...
      </div>
    );
  }

  if (authStatus === 'unauthenticated') {
    return (
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '2rem', color: '#94a3b8' }}>
        Please log in to view assessments.
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', color: '#f1f5f9' }}>
        Assessment Catalog
      </h1>
      <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
        Browse available assessments to evaluate and certify your skills.
      </p>

      <form onSubmit={handleSearch} style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
        <label htmlFor="search" style={{ position: 'absolute', left: '-9999px' }}>Search assessments</label>
        <input
          id="search"
          name="search"
          type="search"
          defaultValue={currentSearch}
          placeholder="Search assessments..."
          aria-label="Search assessments"
          style={{
            flex: 1,
            padding: '0.625rem 0.875rem',
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '0.5rem',
            color: '#f1f5f9',
            fontSize: '0.95rem',
          }}
        />
        <button
          type="submit"
          style={{
            padding: '0.625rem 1.25rem',
            background: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Search
        </button>
      </form>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <select
          aria-label="Filter by category"
          value={currentCategory}
          onChange={(e) => updateQuery({ category: e.target.value })}
          style={{
            padding: '0.5rem 0.75rem',
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '0.375rem',
            color: '#f1f5f9',
          }}
        >
          <option value="">All Categories</option>
          {catalog?.filters.categories.map((cat) => (
            <option key={cat.slug} value={cat.slug}>{cat.name}</option>
          ))}
        </select>

        <select
          aria-label="Filter by type"
          value={currentType}
          onChange={(e) => updateQuery({ type: e.target.value })}
          style={{
            padding: '0.5rem 0.75rem',
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '0.375rem',
            color: '#f1f5f9',
          }}
        >
          <option value="">All Types</option>
          {catalog?.filters.types.map((t) => (
            <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
          ))}
        </select>

        <select
          aria-label="Filter by difficulty"
          value={currentDifficulty}
          onChange={(e) => updateQuery({ difficulty: e.target.value })}
          style={{
            padding: '0.5rem 0.75rem',
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '0.375rem',
            color: '#f1f5f9',
          }}
        >
          <option value="">All Difficulties</option>
          {catalog?.filters.difficulties.map((d) => (
            <option key={d} value={d}>{d.charAt(0) + d.slice(1).toLowerCase()}</option>
          ))}
        </select>

        <select
          aria-label="Filter by availability"
          value={currentAvailability}
          onChange={(e) => updateQuery({ availability: e.target.value })}
          style={{
            padding: '0.5rem 0.75rem',
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '0.375rem',
            color: '#f1f5f9',
          }}
        >
          <option value="">All Availability</option>
          {catalog?.filters.availability.map((a) => (
            <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
          ))}
        </select>

        {(currentSearch || currentCategory || currentType || currentDifficulty || currentAvailability) && (
          <button
            onClick={clearFilters}
            style={{
              padding: '0.5rem 1rem',
              background: 'transparent',
              border: '1px solid #64748b',
              borderRadius: '0.375rem',
              color: '#94a3b8',
              cursor: 'pointer',
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {loading && (
        <div style={{ color: '#94a3b8', textAlign: 'center', padding: '3rem' }} role="status">
          <p>Loading assessments...</p>
        </div>
      )}

      {error && !loading && (
        <div
          role="alert"
          style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#fca5a5',
            padding: '1rem',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
          }}
        >
          <p>{error}</p>
          <button
            onClick={fetchCatalog}
            style={{
              marginTop: '0.5rem',
              padding: '0.375rem 0.75rem',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && catalog && catalog.items.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No assessments found</p>
          <p>Try adjusting your search or filters.</p>
        </div>
      )}

      {!loading && !error && catalog && catalog.items.length > 0 && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem',
            }}
            role="list"
            aria-label="Assessment catalog"
          >
            {catalog.items.map((item) => (
              <AssessmentCard key={item.id} item={item} />
            ))}
          </div>

          {catalog.pagination.totalPages > 1 && (
            <nav aria-label="Pagination" style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
              {Array.from({ length: catalog.pagination.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => updateQuery({ page: String(p) })}
                  aria-current={p === currentPage ? 'page' : undefined}
                  style={{
                    padding: '0.5rem 0.875rem',
                    background: p === currentPage ? '#2563eb' : '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '0.375rem',
                    color: p === currentPage ? 'white' : '#94a3b8',
                    cursor: 'pointer',
                    fontWeight: p === currentPage ? 700 : 400,
                  }}
                >
                  {p}
                </button>
              ))}
            </nav>
          )}
        </>
      )}
    </div>
  );
}

function AssessmentCard({ item }: { item: AssessmentCatalogItem }) {
  const availabilityColor = item.availability === 'AVAILABLE' ? '#22c55e' : item.availability === 'COMING_SOON' ? '#f59e0b' : '#64748b';

  return (
    <a
      href={`/assessments/${item.id}`}
      role="listitem"
      style={{
        display: 'block',
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '0.75rem',
        padding: '1.25rem',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'border-color 0.15s',
        cursor: 'pointer',
      }}
      onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#475569'; }}
      onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#334155'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
        <span style={{
          fontSize: '0.75rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: '#64748b',
        }}>
          {item.category.name}
        </span>
        <span style={{
          fontSize: '0.7rem',
          fontWeight: 600,
          padding: '0.175rem 0.5rem',
          borderRadius: '9999px',
          background: `${availabilityColor}20`,
          color: availabilityColor,
        }}>
          {item.availability === 'AVAILABLE' ? 'Available' : item.availability === 'COMING_SOON' ? 'Coming Soon' : 'Unavailable'}
        </span>
      </div>

      <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: '0 0 0.375rem', color: '#f1f5f9' }}>
        {item.title}
      </h3>
      <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0 0 0.75rem', lineHeight: 1.4 }}>
        {item.shortDescription}
      </p>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <Badge>{item.type.replace(/_/g, ' ')}</Badge>
        <Badge>{item.difficulty.charAt(0) + item.difficulty.slice(1).toLowerCase()}</Badge>
        <Badge>{item.estimatedDurationMinutes} min</Badge>
        {item.questionCount > 0 && <Badge>{item.questionCount} questions</Badge>}
      </div>
    </a>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      fontSize: '0.75rem',
      padding: '0.175rem 0.5rem',
      background: '#334155',
      borderRadius: '0.25rem',
      color: '#cbd5e1',
    }}>
      {children}
    </span>
  );
}

import { Suspense } from 'react';

export default function AssessmentsPage() {
  return (
    <Suspense fallback={<div style={{ maxWidth: 960, margin: '0 auto', padding: '2rem', color: '#94a3b8' }}>Loading...</div>}>
      <AssessmentsPageInner />
    </Suspense>
  );
}
