'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../../providers/auth-context';
import { getMyAssessmentResult } from '../../../../lib/api-client';
import type { AssessmentAttemptResultDetail, AssessmentResultSection, AssessmentResultQuestion, AssessmentResultQuestionOption } from '@nexthire/types';

function OutcomeBadge({ outcome }: { outcome: string }) {
  if (outcome === 'CORRECT') {
    return <span className="inline-flex items-center gap-1 text-green-400 font-medium"><span aria-hidden="true">&#10003;</span> Correct</span>;
  }
  if (outcome === 'INCORRECT') {
    return <span className="inline-flex items-center gap-1 text-red-400 font-medium"><span aria-hidden="true">&#10007;</span> Incorrect</span>;
  }
  return <span className="inline-flex items-center gap-1 text-yellow-400 font-medium"><span aria-hidden="true">&#8212;</span> Unanswered</span>;
}

export default function AssessmentResultDetailPage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params.attemptId as string;
  const { getAccessToken, logout, status: authStatus } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AssessmentAttemptResultDetail | null>(null);
  const [statusCode, setStatusCode] = useState<number | null>(null);

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
      const result = await getMyAssessmentResult(token, attemptId);
      setData(result);
      setStatusCode(200);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load result';
      if (message.includes('401') || message.includes('Unauthorized')) {
        await logout();
        router.push('/login');
        return;
      }
      if (message.includes('404') || message.includes('Not Found')) {
        setStatusCode(404);
      } else if (message.includes('409') || message.includes('Conflict')) {
        setStatusCode(409);
      } else if (message.includes('403') || message.includes('Forbidden')) {
        setStatusCode(403);
      } else if (message.includes('429') || message.includes('Rate Limit')) {
        setStatusCode(429);
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, logout, router, attemptId]);

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
        <p className="text-gray-400 mb-4">Please log in to view this result.</p>
        <Link href="/login" className="text-blue-400 hover:underline">Log in</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-1/2" />
          <div className="h-4 bg-gray-700 rounded w-1/3" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-gray-700 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (error && statusCode === 404) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <p className="text-gray-400 text-lg mb-2">Result Not Found</p>
        <p className="text-gray-500 mb-4">This result could not be found or you do not have access to it.</p>
        <Link href="/assessment-results" className="text-blue-400 hover:underline">Back to Results</Link>
      </div>
    );
  }

  if (error && statusCode === 409) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <p className="text-yellow-400 text-lg mb-2">Result Not Available</p>
        <p className="text-gray-400 mb-4">This attempt has not been finalized or the result data is inconsistent. Please try again later.</p>
        <Link href="/assessment-results" className="text-blue-400 hover:underline">Back to Results</Link>
      </div>
    );
  }

  if (error && statusCode === 403) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <p className="text-red-400 text-lg mb-2">Access Denied</p>
        <p className="text-gray-400 mb-4">You do not have permission to view this result.</p>
        <Link href="/assessment-results" className="text-blue-400 hover:underline">Back to Results</Link>
      </div>
    );
  }

  if (error && statusCode === 429) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <p className="text-yellow-400 text-lg mb-2">Rate Limited</p>
        <p className="text-gray-400 mb-4">Too many requests. Please wait a moment and try again.</p>
        <button onClick={fetchData} className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700">Retry</button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <p className="text-red-400 mb-4" role="alert">{error}</p>
        <button onClick={fetchData} className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700">Retry</button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <p className="text-gray-400 mb-4">No result data available.</p>
        <Link href="/assessment-results" className="text-blue-400 hover:underline">Back to Results</Link>
      </div>
    );
  }

  const d = data;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Link href="/assessment-results" className="text-blue-400 hover:underline text-sm mb-4 inline-block">&larr; Back to Results</Link>

      {/* Header Summary */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
        <h1 className="text-2xl font-bold mb-1">{d.attempt.title}</h1>
        <p className="text-sm text-gray-400 mb-4">
          Version {d.attempt.publicationVersion} &middot;
          Started {new Date(d.attempt.startedAt).toLocaleString()} &middot;
          Submitted {new Date(d.attempt.submittedAt).toLocaleString()} &middot;
          Duration {Math.floor(d.attempt.durationSeconds / 60)}m {d.attempt.durationSeconds % 60}s &middot;
          Reason: {d.attempt.finalizationReason === 'CANDIDATE_SUBMITTED' ? 'Candidate Submitted' : 'Deadline Reached'}
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-900 rounded">
            <p className={`text-2xl font-bold ${d.result.resultStatus === 'PASSED' ? 'text-green-400' : 'text-red-400'}`}>
              {d.result.percentage.toFixed(1)}%
            </p>
            <p className="text-sm text-gray-400">{d.result.resultStatus === 'PASSED' ? 'PASSED' : 'FAILED'}</p>
          </div>
          <div className="text-center p-3 bg-gray-900 rounded">
            <p className="text-2xl font-bold">{d.result.scoreEarned}/{d.result.scorePossible}</p>
            <p className="text-sm text-gray-400">Score (pass: {d.result.passingScorePercentage}%)</p>
          </div>
          <div className="text-center p-3 bg-gray-900 rounded">
            <p className="text-2xl font-bold text-green-400">{d.result.correctCount}</p>
            <p className="text-sm text-gray-400">Correct</p>
          </div>
          <div className="text-center p-3 bg-gray-900 rounded">
            <p className="text-2xl font-bold text-red-400">{d.result.incorrectCount}</p>
            <p className="text-sm text-gray-400">Incorrect</p>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-2 text-center">Unanswered: {d.result.unansweredCount} &middot; Total Questions: {d.result.questionCount}</p>
      </div>

      {/* Sections */}
      {d.sections.map((section: AssessmentResultSection) => (
        <div key={section.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
          <h2 className="text-xl font-semibold mb-2">{section.title}</h2>
          <p className="text-sm text-gray-400 mb-4">
            Score: {section.scoreEarned}/{section.scorePossible} &middot;
            Correct: {section.correctCount} &middot;
            Incorrect: {section.incorrectCount} &middot;
            Unanswered: {section.unansweredCount}
          </p>

          {section.questions.map((q: AssessmentResultQuestion) => (
            <div key={q.id} className="border-t border-gray-700 pt-4 mt-4 first:border-t-0 first:pt-0 first:mt-0">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium">
                  <span className="text-gray-400 mr-2">Q{q.number}.</span>
                  {q.prompt}
                </h3>
                <div className="text-right text-sm whitespace-nowrap ml-4">
                  <OutcomeBadge outcome={q.outcome} />
                  <div className="text-gray-400 mt-0.5">{q.pointsAwarded}/{q.pointsPossible} pts</div>
                </div>
              </div>

              {/* Options */}
              {q.options.length > 0 && (
                <div className="ml-4 mb-2 space-y-1">
                  {q.options.map((opt: AssessmentResultQuestionOption) => (
                    <div
                      key={opt.id}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm ${
                        opt.selectedByCandidate && opt.isCorrect ? 'bg-green-900/30 text-green-300' :
                        opt.selectedByCandidate && !opt.isCorrect ? 'bg-red-900/30 text-red-300' :
                        !opt.selectedByCandidate && opt.isCorrect ? 'bg-green-900/20 text-green-400' :
                        'text-gray-300'
                      }`}
                    >
                      <span className="w-5 text-center">
                        {opt.selectedByCandidate && opt.isCorrect ? <span aria-label="Correctly selected">&#10003;</span> :
                         opt.selectedByCandidate && !opt.isCorrect ? <span aria-label="Incorrectly selected">&#10007;</span> :
                         !opt.selectedByCandidate && opt.isCorrect ? <span aria-label="Correct answer not selected">&#9679;</span> :
                         <span aria-hidden="true">&nbsp;</span>}
                      </span>
                      <span>{opt.label}</span>
                      <span className="text-xs ml-auto text-gray-500">
                        {opt.selectedByCandidate ? 'Your answer' : ''}
                        {opt.selectedByCandidate && opt.isCorrect ? ' \u2022 Correct' : ''}
                        {!opt.selectedByCandidate && opt.isCorrect ? 'Correct answer' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Candidate Answer (short text) */}
              {q.candidateAnswer?.kind === 'SHORT_TEXT' && (
                <div className="ml-4 mb-2">
                  <p className="text-sm text-gray-400">Your answer:</p>
                  <p className="text-sm bg-gray-900 rounded px-3 py-1.5 inline-block">{q.candidateAnswer.text}</p>
                </div>
              )}

              {/* Correct Answer (short text) */}
              {q.correctAnswer?.kind === 'SHORT_TEXT' && q.correctAnswer.acceptedAnswers && q.correctAnswer.acceptedAnswers.length > 0 && (
                <div className="ml-4 mb-2">
                  <p className="text-sm text-gray-400">Correct answer(s):</p>
                  <ul className="text-sm text-green-400">
                    {q.correctAnswer.acceptedAnswers.map((a: string, i: number) => (
                      <li key={i} className="bg-gray-900 rounded px-3 py-0.5 inline-block mr-1 mb-1">{a}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Explanation */}
              <div className="ml-4 text-sm text-gray-400 mt-1">
                <span className="font-medium text-gray-500">Explanation:</span>{' '}
                {q.explanation || 'No explanation provided.'}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
