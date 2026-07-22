'use client';

import { useCallback, useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../providers/auth-context';
import { getMyAssessmentPerformance } from '../../../lib/api-client';
import type { AssessmentPerformanceReport } from '@nexthire/types';

function PerformancePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getAccessToken, logout, status: authStatus } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AssessmentPerformanceReport | null>(null);

  const currentDateFrom = searchParams.get('dateFrom') ?? '';
  const currentDateTo = searchParams.get('dateTo') ?? '';
  const currentAssessmentType = searchParams.get('assessmentType') ?? '';
  const currentDifficulty = searchParams.get('difficulty') ?? '';
  const currentCategory = searchParams.get('category') ?? '';

  const buildQueryString = useCallback(
    (overrides: Record<string, string | undefined>) => {
      const params = new URLSearchParams();
      const dFrom = overrides.dateFrom ?? currentDateFrom;
      if (dFrom) params.set('dateFrom', dFrom);
      const dTo = overrides.dateTo ?? currentDateTo;
      if (dTo) params.set('dateTo', dTo);
      const at = overrides.assessmentType ?? currentAssessmentType;
      if (at) params.set('assessmentType', at);
      const df = overrides.difficulty ?? currentDifficulty;
      if (df) params.set('difficulty', df);
      const cat = overrides.category ?? currentCategory;
      if (cat) params.set('category', cat);
      return params.toString();
    },
    [currentDateFrom, currentDateTo, currentAssessmentType, currentDifficulty, currentCategory],
  );

  const updateQuery = useCallback(
    (overrides: Record<string, string | undefined>) => {
      router.push(`/assessment-performance?${buildQueryString(overrides)}`);
    },
    [router, buildQueryString],
  );

  const clearFilters = useCallback(() => {
    router.push('/assessment-performance');
  }, [router]);

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
      const result = await getMyAssessmentPerformance(token, buildQueryString({}));
      setData(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load report';
      if (message.includes('401') || message.includes('Unauthorized')) {
        await logout();
        router.push('/login');
        return;
      }
      if (message.includes('429') || message.includes('Too Many Requests')) {
        setError('Rate limited. Please wait before trying again.');
        return;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, logout, router, buildQueryString]);

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
    return <div className="p-6 text-center"><Link href="/login" className="text-blue-600 underline">Sign in to view your performance</Link></div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p className="font-semibold">Error loading performance report</p>
          <p className="text-sm mt-1">{error}</p>
          <button onClick={fetchData} className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 rounded animate-pulse" />)}
        </div>
        <div className="h-64 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  if (!data || data.summary.totalFinalizedAttempts === 0) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h2 className="text-lg font-semibold text-yellow-800">No Assessment Results Yet</h2>
          <p className="text-yellow-600 mt-2">Complete an assessment to see your performance report.</p>
          <Link href="/assessments" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Browse Assessments
          </Link>
        </div>
      </div>
    );
  }

  const { summary, trend, byCategory, byType, byDifficulty, recentActivity } = data;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Assessment Performance</h1>
        <Link href="/assessment-results" className="text-blue-600 hover:underline text-sm">View Results History</Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Date From</label>
            <input type="date" value={currentDateFrom} onChange={e => updateQuery({ dateFrom: e.target.value || undefined })}
              className="border rounded px-2 py-1 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Date To</label>
            <input type="date" value={currentDateTo} onChange={e => updateQuery({ dateTo: e.target.value || undefined })}
              className="border rounded px-2 py-1 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Type</label>
            <select value={currentAssessmentType} onChange={e => updateQuery({ assessmentType: e.target.value || undefined })}
              className="border rounded px-2 py-1 text-sm">
              <option value="">All Types</option>
              <option value="PRACTICE">Practice</option>
              <option value="CERTIFICATION">Certification</option>
              <option value="SCREENING">Screening</option>
              <option value="SKILL_CHECK">Skill Check</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Difficulty</label>
            <select value={currentDifficulty} onChange={e => updateQuery({ difficulty: e.target.value || undefined })}
              className="border rounded px-2 py-1 text-sm">
              <option value="">All Difficulties</option>
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
              <option value="EXPERT">Expert</option>
            </select>
          </div>
          {currentDateFrom || currentDateTo || currentAssessmentType || currentDifficulty || currentCategory ? (
            <button onClick={clearFilters} className="px-3 py-1 bg-gray-100 rounded text-sm hover:bg-gray-200 self-end">
              Clear Filters
            </button>
          ) : null}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4" role="region" aria-label="Average score">
          <p className="text-sm text-gray-500">Average Score</p>
          <p className="text-2xl font-bold">{summary.averagePercentage}%</p>
        </div>
        <div className="bg-white rounded-lg border p-4" role="region" aria-label="Best score">
          <p className="text-sm text-gray-500">Best Score</p>
          <p className="text-2xl font-bold">{summary.bestPercentage}%</p>
        </div>
        <div className="bg-white rounded-lg border p-4" role="region" aria-label="Pass rate">
          <p className="text-sm text-gray-500">Pass Rate</p>
          <p className="text-2xl font-bold">{summary.passRate}%</p>
          <p className="text-xs text-gray-400">{summary.passedCount} passed / {summary.failedCount} failed</p>
        </div>
        <div className="bg-white rounded-lg border p-4" role="region" aria-label="Total attempts">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-2xl font-bold">{summary.totalFinalizedAttempts}</p>
          <p className="text-xs text-gray-400">{summary.uniqueAssessmentsCompleted} unique assessments</p>
        </div>
      </div>

      {/* Score Trend */}
      {trend.length > 0 && (
        <div className="bg-white rounded-lg border p-4">
          <h2 className="text-lg font-semibold mb-3">Score Trend</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Score trend data">
              <caption className="text-left text-xs text-gray-500 mb-2">Your last {trend.length} assessment scores</caption>
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Assessment</th>
                  <th className="text-right py-2">Score</th>
                  <th className="text-right py-2">Result</th>
                  <th className="text-right py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {trend.map(t => (
                  <tr key={t.attemptId} className="border-b hover:bg-gray-50">
                    <td className="py-2">{t.assessmentTitle}</td>
                    <td className="text-right py-2">{t.percentage}%</td>
                    <td className="text-right py-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${t.resultStatus === 'PASSED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {t.resultStatus}
                      </span>
                    </td>
                    <td className="text-right py-2 text-gray-500">{new Date(t.submittedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      {byCategory.length > 0 && (
        <div className="bg-white rounded-lg border p-4">
          <h2 className="text-lg font-semibold mb-3">Performance by Category</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Category breakdown">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Category</th>
                  <th className="text-right py-2">Attempts</th>
                  <th className="text-right py-2">Average</th>
                  <th className="text-right py-2">Best</th>
                  <th className="text-right py-2">Pass Rate</th>
                </tr>
              </thead>
              <tbody>
                {byCategory.map(c => (
                  <tr key={c.key} className="border-b hover:bg-gray-50">
                    <td className="py-2">{c.label}</td>
                    <td className="text-right py-2">{c.attemptCount}</td>
                    <td className="text-right py-2">{c.averagePercentage}%</td>
                    <td className="text-right py-2">{c.bestPercentage}%</td>
                    <td className="text-right py-2">{c.passRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Difficulty & Type Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {byDifficulty.length > 0 && (
          <div className="bg-white rounded-lg border p-4">
            <h2 className="text-lg font-semibold mb-3">By Difficulty</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" aria-label="Difficulty breakdown">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Difficulty</th>
                    <th className="text-right py-2">Average</th>
                    <th className="text-right py-2">Pass Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {byDifficulty.map(d => (
                    <tr key={d.key} className="border-b hover:bg-gray-50">
                      <td className="py-2">{d.label}</td>
                      <td className="text-right py-2">{d.averagePercentage}%</td>
                      <td className="text-right py-2">{d.passRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {byType.length > 0 && (
          <div className="bg-white rounded-lg border p-4">
            <h2 className="text-lg font-semibold mb-3">By Type</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" aria-label="Assessment type breakdown">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Type</th>
                    <th className="text-right py-2">Average</th>
                    <th className="text-right py-2">Pass Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {byType.map(t => (
                    <tr key={t.key} className="border-b hover:bg-gray-50">
                      <td className="py-2">{t.label}</td>
                      <td className="text-right py-2">{t.averagePercentage}%</td>
                      <td className="text-right py-2">{t.passRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <div className="bg-white rounded-lg border p-4">
          <h2 className="text-lg font-semibold mb-3">Recent Activity</h2>
          <div className="space-y-2">
            {recentActivity.map(a => (
              <Link key={a.attemptId} href={`/assessment-results/${a.attemptId}`}
                className="flex items-center justify-between p-3 rounded hover:bg-gray-50 border">
                <div>
                  <p className="font-medium">{a.assessmentTitle}</p>
                  <p className="text-xs text-gray-500">{new Date(a.submittedAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{a.percentage}%</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${a.resultStatus === 'PASSED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {a.resultStatus}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="text-center py-4">
        <Link href="/assessment-leaderboards" className="text-blue-600 hover:underline text-sm">
          View Leaderboards
        </Link>
      </div>
    </div>
  );
}

export default function AssessmentPerformancePage() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Loading...</div>}>
      <PerformancePageInner />
    </Suspense>
  );
}
