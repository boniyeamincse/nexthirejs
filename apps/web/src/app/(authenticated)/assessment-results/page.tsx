'use client';

import { useCallback, useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../providers/auth-context';
import { listMyAssessmentResults } from '../../../lib/api-client';
import type { AssessmentResultHistoryResponse, AssessmentAttemptHistoryItem } from '@nexthire/types';

function AssessmentResultsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getAccessToken, logout, status: authStatus } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AssessmentResultHistoryResponse | null>(null);

  const currentPage = useMemo(() => {
    const p = searchParams.get('page');
    return p ? Math.max(1, parseInt(p, 10)) : 1;
  }, [searchParams]);

  const currentSearch = searchParams.get('search') ?? '';
  const currentResultStatus = searchParams.get('resultStatus') ?? '';
  const currentFinalizationReason = searchParams.get('finalizationReason') ?? '';
  const currentAssessmentType = searchParams.get('assessmentType') ?? '';
  const currentDifficulty = searchParams.get('difficulty') ?? '';
  const currentDateFrom = searchParams.get('dateFrom') ?? '';
  const currentDateTo = searchParams.get('dateTo') ?? '';

  const buildQueryString = useCallback(
    (overrides: Record<string, string | undefined>) => {
      const params = new URLSearchParams();
      const page = overrides.page ?? String(currentPage);
      if (page !== '1') params.set('page', page);
      const search = overrides.search ?? currentSearch;
      if (search) params.set('search', search);
      const rs = overrides.resultStatus ?? currentResultStatus;
      if (rs) params.set('resultStatus', rs);
      const fr = overrides.finalizationReason ?? currentFinalizationReason;
      if (fr) params.set('finalizationReason', fr);
      const at = overrides.assessmentType ?? currentAssessmentType;
      if (at) params.set('assessmentType', at);
      const df = overrides.difficulty ?? currentDifficulty;
      if (df) params.set('difficulty', df);
      const dFrom = overrides.dateFrom ?? currentDateFrom;
      if (dFrom) params.set('dateFrom', dFrom);
      const dTo = overrides.dateTo ?? currentDateTo;
      if (dTo) params.set('dateTo', dTo);
      return params.toString();
    },
    [currentPage, currentSearch, currentResultStatus, currentFinalizationReason, currentAssessmentType, currentDifficulty, currentDateFrom, currentDateTo],
  );

  const updateQuery = useCallback(
    (overrides: Record<string, string | undefined>) => {
      router.push(`/assessment-results?${buildQueryString(overrides)}`);
    },
    [router, buildQueryString],
  );

  const fetchData = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      await logout();
      router.push('/login');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await listMyAssessmentResults(token, buildQueryString({}));
      setData(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load results';
      if (message.includes('401') || message.includes('Unauthorized')) {
        await logout();
        router.push('/login');
        return;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, logout, router, buildQueryString]);

  useEffect(() => {
    if (authStatus === 'authenticated') {
      void fetchData();
    } else if (authStatus === 'unauthenticated') {
      setLoading(false);
    }
  }, [authStatus, fetchData]);

  if (authStatus === 'unknown' || authStatus === 'loading') {
    return <div className="p-8 text-center text-gray-400">Loading authentication...</div>;
  }

  if (authStatus === 'unauthenticated') {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-400 mb-4">Please log in to view your assessment results.</p>
        <Link href="/login" className="text-blue-400 hover:underline">Log in</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-1/3" />
          <div className="h-4 bg-gray-700 rounded w-2/3" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-700 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto p-6 text-center">
        <p className="text-red-400 mb-4" role="alert">{error}</p>
        <button onClick={fetchData} className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700">
          Retry
        </button>
      </div>
    );
  }

  const hasActiveFilters = currentSearch || currentResultStatus || currentFinalizationReason ||
    currentAssessmentType || currentDifficulty || currentDateFrom || currentDateTo;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Assessment Results</h1>
      <p className="text-gray-400 mb-6">Review your completed assessment attempts and detailed results.</p>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <form
          onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); updateQuery({ search: fd.get('search') as string, page: '1' }); }}
          className="flex gap-2"
        >
          <input
            name="search"
            type="search"
            defaultValue={currentSearch}
            placeholder="Search by title..."
            maxLength={100}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm w-48"
            aria-label="Search results"
          />
          <button type="submit" className="px-3 py-2 bg-gray-700 rounded text-sm hover:bg-gray-600">Search</button>
        </form>

        {data?.filters.resultStatuses.length && (
          <select
            value={currentResultStatus}
            onChange={(e) => updateQuery({ resultStatus: e.target.value || undefined, page: '1' })}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm"
            aria-label="Filter by result status"
          >
            <option value="">All Results</option>
            {data.filters.resultStatuses.map((s) => (
              <option key={s} value={s}>{s === 'PASSED' ? 'Passed' : 'Failed'}</option>
            ))}
          </select>
        )}

        {data?.filters.finalizationReasons.length && (
          <select
            value={currentFinalizationReason}
            onChange={(e) => updateQuery({ finalizationReason: e.target.value || undefined, page: '1' })}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm"
            aria-label="Filter by finalization reason"
          >
            <option value="">All Reasons</option>
            {data.filters.finalizationReasons.map((r) => (
              <option key={r} value={r}>{r === 'CANDIDATE_SUBMITTED' ? 'Submitted' : 'Deadline'}</option>
            ))}
          </select>
        )}

        {data?.filters.assessmentTypes.length && (
          <select
            value={currentAssessmentType}
            onChange={(e) => updateQuery({ assessmentType: e.target.value || undefined, page: '1' })}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm"
            aria-label="Filter by assessment type"
          >
            <option value="">All Types</option>
            {data.filters.assessmentTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        )}

        {data?.filters.difficulties.length && (
          <select
            value={currentDifficulty}
            onChange={(e) => updateQuery({ difficulty: e.target.value || undefined, page: '1' })}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm"
            aria-label="Filter by difficulty"
          >
            <option value="">All Difficulties</option>
            {data.filters.difficulties.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        )}

        <input
          type="date"
          value={currentDateFrom}
          onChange={(e) => updateQuery({ dateFrom: e.target.value || undefined, page: '1' })}
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm"
          aria-label="From date"
        />
        <input
          type="date"
          value={currentDateTo}
          onChange={(e) => updateQuery({ dateTo: e.target.value || undefined, page: '1' })}
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm"
          aria-label="To date"
        />

        {hasActiveFilters && (
          <button
            onClick={() => router.push('/assessment-results')}
            className="px-3 py-2 bg-gray-700 rounded text-sm hover:bg-gray-600"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Results List */}
      {data && data.items.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-2">No assessment results found</p>
          <p>Complete an assessment and submit it to see your results here.</p>
        </div>
      ) : (
        <div className="space-y-4" role="list" aria-label="Assessment results">
          {data?.items.map((item: AssessmentAttemptHistoryItem) => (
            <div key={item.attemptId} className="bg-gray-800 rounded-lg p-4 border border-gray-700" role="listitem">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-lg">{item.assessment.title}</h3>
                  <p className="text-sm text-gray-400">
                    {item.assessment.type} &middot; {item.assessment.difficulty}
                    {item.assessment.categoryName && <> &middot; {item.assessment.categoryName}</>}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-xl font-bold ${item.result.status === 'PASSED' ? 'text-green-400' : 'text-red-400'}`}>
                    {item.result.percentage.toFixed(0)}%
                  </p>
                  <p className="text-sm text-gray-400">{item.result.status === 'PASSED' ? 'Passed' : 'Failed'}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-400 mb-3">
                <span>Score: {item.result.scoreEarned}/{item.result.scorePossible}</span>
                <span>Correct: <span className="text-green-400">{item.result.correctCount}</span></span>
                <span>Incorrect: <span className="text-red-400">{item.result.incorrectCount}</span></span>
                <span>Unanswered: <span className="text-yellow-400">{item.result.unansweredCount}</span></span>
                <span>Submitted: {new Date(item.submittedAt).toLocaleDateString()}</span>
                <span>Reason: {item.finalizationReason === 'CANDIDATE_SUBMITTED' ? 'Submitted' : 'Deadline'}</span>
              </div>

              <Link
                href={`/assessment-results/${item.attemptId}`}
                className="inline-block px-4 py-1.5 bg-blue-600 rounded text-sm hover:bg-blue-700"
              >
                View Result
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <nav className="flex justify-center gap-2 mt-8" aria-label="Pagination">
          {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => updateQuery({ page: String(page) })}
              className={`px-3 py-1.5 rounded text-sm ${page === currentPage ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}

export default function AssessmentResultsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading...</div>}>
      <AssessmentResultsPageInner />
    </Suspense>
  );
}
