'use client';

import { useCallback, useEffect, useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../../providers/auth-context';
import { getAssessmentLeaderboard, getCategoryLeaderboard } from '../../../../lib/api-client';
import type { AssessmentLeaderboardResponse, CategoryLeaderboardResponse } from '@nexthire/types';

function LeaderboardDetailPageInner() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getAccessToken, logout, status: authStatus } = useAuth();

  const [data, setData] = useState<
    AssessmentLeaderboardResponse | CategoryLeaderboardResponse | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const idOrSlug = params?.assessmentIdOrSlug as string;
  const isCategory = searchParams.get('type') === 'category';
  const currentPage = parseInt(searchParams.get('page') ?? '1', 10);

  const buildQueryString = useCallback((page: number) => {
    const params = new URLSearchParams();
    if (page > 1) params.set('page', String(page));
    return params.toString();
  }, []);

  const fetchData = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      await logout();
      router.push('/login');
      return;
    }
    if (!idOrSlug) return;
    setLoading(true);
    setError(null);
    try {
      const qs = buildQueryString(currentPage);
      const result = isCategory
        ? await getCategoryLeaderboard(token, idOrSlug, qs)
        : await getAssessmentLeaderboard(token, idOrSlug, qs);
      setData(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load leaderboard';
      if (message.includes('401')) {
        await logout();
        router.push('/login');
        return;
      }
      if (message.includes('404')) {
        setError('Leaderboard not found.');
        return;
      }
      if (message.includes('429')) {
        setError('Rate limited. Please wait.');
        return;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, logout, router, idOrSlug, isCategory, currentPage, buildQueryString]);

  useEffect(() => {
    if (authStatus === 'loading') return;
    if (authStatus === 'unauthenticated') {
      router.push('/login');
      return;
    }
    fetchData();
  }, [authStatus, fetchData, router]);

  if (authStatus === 'loading') {
    return <div className="p-6 text-center">Loading...</div>;
  }

  if (authStatus === 'unauthenticated') {
    return (
      <div className="p-6 text-center">
        <Link href="/login" className="text-blue-600 underline">
          Sign in to view leaderboards
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p className="font-semibold">Error</p>
          <p className="text-sm mt-1">{error}</p>
          <button
            onClick={fetchData}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/2 animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data) {
    return <div className="p-6 text-center text-gray-500">No data available.</div>;
  }

  const isAssessment = 'assessmentTitle' in data;
  const title = isAssessment
    ? data.assessmentTitle
    : (data as CategoryLeaderboardResponse).categoryName;
  const entries = data.entries;
  const pagination = data.pagination;
  const myRank = data.myRank;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/assessment-leaderboards" className="text-blue-600 hover:underline text-sm">
            &larr; All Leaderboards
          </Link>
          <h1 className="text-2xl font-bold mt-1">{title}</h1>
          {isAssessment && <p className="text-sm text-gray-500">Assessment Leaderboard</p>}
          {!isAssessment && <p className="text-sm text-gray-500">Category Leaderboard</p>}
        </div>
      </div>

      {/* My Rank */}
      {myRank && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">
            {myRank.eligible
              ? `Your Rank: #${myRank.rank}`
              : 'You are not ranked. Complete assessments and enable leaderboard participation.'}
            {!myRank.eligible &&
              !isAssessment &&
              entries.length > 0 &&
              ' (take assessments in this category)'}
          </p>
        </div>
      )}

      {/* Ranking Info */}
      <div className="bg-gray-50 border rounded-lg p-3 text-xs text-gray-600">
        {isAssessment
          ? 'Ranked by best attempt percentage. Ties broken by score earned, fewer unanswered, shorter duration, earlier submission.'
          : 'Ranked by average percentage across category assessments. Requires at least 1 completed assessment.'}
      </div>

      {/* Entries */}
      {entries.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-700">No ranked candidates yet.</p>
          <p className="text-yellow-600 text-sm mt-1">
            Candidates need to opt in and complete assessments to appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Leaderboard entries">
              <caption className="sr-only">Ranked candidate list</caption>
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4" scope="col">
                    Rank
                  </th>
                  <th className="text-left py-3 px-4" scope="col">
                    Candidate
                  </th>
                  {isAssessment && (
                    <>
                      <th className="text-right py-3 px-4" scope="col">
                        Score
                      </th>
                      <th className="text-right py-3 px-4" scope="col">
                        Unanswered
                      </th>
                      <th className="text-right py-3 px-4" scope="col">
                        Duration
                      </th>
                      <th className="text-right py-3 px-4" scope="col">
                        Submitted
                      </th>
                    </>
                  )}
                  {!isAssessment && (
                    <>
                      <th className="text-right py-3 px-4" scope="col">
                        Avg
                      </th>
                      <th className="text-right py-3 px-4" scope="col">
                        Best
                      </th>
                      <th className="text-right py-3 px-4" scope="col">
                        Completed
                      </th>
                      <th className="text-right py-3 px-4" scope="col">
                        Pass Rate
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr
                    key={entry.rank}
                    className={`border-b hover:bg-gray-50 ${entry.isCurrentCandidate ? 'bg-blue-50' : ''}`}
                  >
                    <td className="py-3 px-4 font-medium" aria-label={`Rank ${entry.rank}`}>
                      #{entry.rank}
                    </td>
                    <td className="py-3 px-4 flex items-center gap-2">
                      <span>{entry.displayName}</span>
                      {entry.isCurrentCandidate && (
                        <span className="text-xs text-blue-600">(you)</span>
                      )}
                    </td>
                    {isAssessment && 'percentage' in entry && (
                      <>
                        <td className="text-right py-3 px-4">{entry.percentage}%</td>
                        <td className="text-right py-3 px-4">{entry.unansweredCount}</td>
                        <td className="text-right py-3 px-4">
                          {Math.round(entry.durationSeconds / 60)}m
                        </td>
                        <td className="text-right py-3 px-4 text-gray-500">
                          {new Date(entry.submittedAt).toLocaleDateString()}
                        </td>
                      </>
                    )}
                    {!isAssessment && 'averagePercentage' in entry && (
                      <>
                        <td className="text-right py-3 px-4">{entry.averagePercentage}%</td>
                        <td className="text-right py-3 px-4">{entry.bestPercentage}%</td>
                        <td className="text-right py-3 px-4">{entry.completedAssessmentCount}</td>
                        <td className="text-right py-3 px-4">{entry.passRate}%</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 p-4 border-t">
              {currentPage > 1 && (
                <Link
                  href={`/assessment-leaderboards/${encodeURIComponent(idOrSlug)}?${buildQueryString(currentPage - 1)}${isCategory ? '&type=category' : ''}`}
                  className="px-3 py-1 border rounded text-sm hover:bg-gray-50"
                >
                  Previous
                </Link>
              )}
              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              {currentPage < pagination.totalPages && (
                <Link
                  href={`/assessment-leaderboards/${encodeURIComponent(idOrSlug)}?${buildQueryString(currentPage + 1)}${isCategory ? '&type=category' : ''}`}
                  className="px-3 py-1 border rounded text-sm hover:bg-gray-50"
                >
                  Next
                </Link>
              )}
            </div>
          )}
        </div>
      )}

      <div className="text-center">
        <Link href="/assessment-performance" className="text-blue-600 hover:underline text-sm">
          View Your Performance Report
        </Link>
      </div>
    </div>
  );
}

export default function LeaderboardDetailPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Loading...</div>}>
      <LeaderboardDetailPageInner />
    </Suspense>
  );
}
