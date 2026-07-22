'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-context';
import {
  getAttemptWorkspace,
  saveAttemptAnswer,
  submitAssessmentAttempt,
} from '@/lib/api-client';
import type {
  AssessmentAttemptQuestionResult,
  AssessmentAttemptSubmissionResult,
  AssessmentAttemptWorkspace,
} from '@nexthire/types';
import styles from './page.module.css';

export default function AssessmentAttemptWorkspacePage() {
  const params = useParams();
  const attemptId = params.attemptId as string;
  const router = useRouter();
  const { getAccessToken, logout } = useAuth();

  const [workspace, setWorkspace] = useState<AssessmentAttemptWorkspace | null>(null);
  const [submissionSummary, setSubmissionSummary] =
    useState<AssessmentAttemptSubmissionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [savingQuestionId, setSavingQuestionId] = useState<string | null>(null);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deadlineFinalizing, setDeadlineFinalizing] = useState(false);

  const debounceRef = useRef<Record<string, number>>({});
  const deadlineRef = useRef(false);

  const fetchWorkspace = useCallback(async () => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      await logout();
      router.push('/login');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getAttemptWorkspace(accessToken, attemptId);
      setWorkspace(data);
      setSubmissionSummary(data.submissionSummary);
      setRemainingSeconds(data.attempt.remainingSeconds);
      deadlineRef.current = data.attempt.remainingSeconds <= 0;
    } catch (err: any) {
      setError(err.message || 'Failed to load assessment workspace.');
    } finally {
      setLoading(false);
      setDeadlineFinalizing(false);
    }
  }, [attemptId, getAccessToken, logout, router]);

  useEffect(() => {
    if (attemptId) {
      void fetchWorkspace();
    }
  }, [attemptId, fetchWorkspace]);

  useEffect(() => {
    return () => {
      Object.values(debounceRef.current).forEach((timeoutId) => clearTimeout(timeoutId));
    };
  }, []);

  useEffect(() => {
    if (!workspace || remainingSeconds === null) {
      return;
    }

    if (workspace.attempt.status !== 'IN_PROGRESS' || submissionSummary) {
      return;
    }

    if (remainingSeconds <= 0) {
      if (!deadlineRef.current) {
        deadlineRef.current = true;
        setDeadlineFinalizing(true);
        void fetchWorkspace();
      }
      return;
    }

    const timer = window.setInterval(() => {
      setRemainingSeconds((previous) => (previous && previous > 0 ? previous - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [fetchWorkspace, remainingSeconds, submissionSummary, workspace]);

  const isReadOnly =
    submissionSummary !== null ||
    workspace?.attempt.status === 'SUBMITTED' ||
    workspace?.attempt.status === 'EXPIRED' ||
    deadlineFinalizing;

  const saveDraft = async (
    questionId: string,
    payload: { selectedOptionIds: string[]; shortTextAnswer: string | null },
  ) => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      await logout();
      router.push('/login');
      return;
    }

    try {
      setSavingQuestionId(questionId);
      const data = await saveAttemptAnswer(accessToken, attemptId, questionId, payload);
      setWorkspace((previous) => {
        if (!previous) {
          return previous;
        }

        return {
          ...previous,
          sections: previous.sections.map((section) => ({
            ...section,
            questions: section.questions.map((question) =>
              question.id === questionId
                ? { ...question, draftAnswer: data.savedAnswer }
                : question,
            ),
          })),
          progress: data.progress,
        };
      });
    } catch (err: any) {
      setError(err.message || 'Failed to save answer.');
      if (err.message === 'AUTH_ACCESS_TOKEN_INVALID') {
        await logout();
        router.push('/login');
      }
    } finally {
      setSavingQuestionId(null);
    }
  };

  const handleOptionChange = (
    question: AssessmentAttemptQuestionResult,
    optionId: string,
    checked: boolean,
  ) => {
    if (isReadOnly) {
      return;
    }

    const currentSelected = question.draftAnswer?.selectedOptionIds ?? [];
    let nextSelected: string[] = [];

    if (question.type === 'SINGLE_CHOICE' || question.type === 'TRUE_FALSE') {
      nextSelected = [optionId];
    } else {
      nextSelected = checked
        ? [...currentSelected, optionId]
        : currentSelected.filter((selectedId) => selectedId !== optionId);
    }

    setWorkspace((previous) => {
      if (!previous) {
        return previous;
      }

      return {
        ...previous,
        sections: previous.sections.map((section) => ({
          ...section,
          questions: section.questions.map((candidateQuestion) =>
            candidateQuestion.id === question.id
              ? {
                  ...candidateQuestion,
                  draftAnswer: {
                    selectedOptionIds: nextSelected,
                    shortTextAnswer: candidateQuestion.draftAnswer?.shortTextAnswer ?? null,
                    lastSavedAt: new Date().toISOString(),
                  },
                }
              : candidateQuestion,
          ),
        })),
      };
    });

    const currentShortText = question.draftAnswer?.shortTextAnswer ?? null;
    if (debounceRef.current[question.id]) {
      clearTimeout(debounceRef.current[question.id]);
    }
    debounceRef.current[question.id] = window.setTimeout(() => {
      void saveDraft(question.id, {
        selectedOptionIds: nextSelected,
        shortTextAnswer: currentShortText,
      });
    }, 500);
  };

  const handleTextChange = (question: AssessmentAttemptQuestionResult, text: string) => {
    if (isReadOnly) {
      return;
    }

    setWorkspace((previous) => {
      if (!previous) {
        return previous;
      }

      return {
        ...previous,
        sections: previous.sections.map((section) => ({
          ...section,
          questions: section.questions.map((candidateQuestion) =>
            candidateQuestion.id === question.id
              ? {
                  ...candidateQuestion,
                  draftAnswer: {
                    selectedOptionIds: candidateQuestion.draftAnswer?.selectedOptionIds ?? [],
                    shortTextAnswer: text,
                    lastSavedAt: new Date().toISOString(),
                  },
                }
              : candidateQuestion,
          ),
        })),
      };
    });

    if (debounceRef.current[question.id]) {
      clearTimeout(debounceRef.current[question.id]);
    }
    debounceRef.current[question.id] = window.setTimeout(() => {
      void saveDraft(question.id, {
        selectedOptionIds: question.draftAnswer?.selectedOptionIds ?? [],
        shortTextAnswer: text,
      });
    }, 800);
  };

  const handleSubmitAttempt = async () => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      await logout();
      router.push('/login');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const summary = await submitAssessmentAttempt(accessToken, attemptId, {
        confirmation: 'SUBMIT',
      });
      setSubmissionSummary(summary);
      setWorkspace((previous) =>
        previous
          ? {
              ...previous,
              attempt: {
                ...previous.attempt,
                status: summary.status,
                submittedAt: summary.submittedAt,
                finalizationReason: summary.finalizationReason,
                scoringVersion: summary.scoringVersion,
                remainingSeconds: 0,
              },
              submissionSummary: summary,
            }
          : previous,
      );
      setRemainingSeconds(0);
      setShowSubmitDialog(false);
    } catch (err: any) {
      setError(err.message || 'Failed to submit assessment.');
      if (err.message === 'AUTH_ACCESS_TOKEN_INVALID') {
        await logout();
        router.push('/login');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return `${minutes}:${remainder.toString().padStart(2, '0')}`;
  };

  const formatReason = (reason: string | null) => {
    if (!reason) {
      return 'Not finalized';
    }

    return reason === 'DEADLINE_REACHED' ? 'Deadline reached' : 'Candidate submitted';
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <p>Loading workspace...</p>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className={styles.container}>
        <div className={styles.errorCard}>
          <h2 className={styles.errorTitle}>Workspace Error</h2>
          <p>{error || 'An unknown error occurred.'}</p>
          <button
            className={styles.submitButton}
            onClick={() => router.push('/assessments')}
            style={{ marginTop: '1rem' }}
          >
            Return to Assessments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{workspace.attempt.title}</h1>
          <p className={styles.progressText}>
            Progress: {workspace.progress.percentage}% ({workspace.progress.answered}/
            {workspace.progress.total} answered)
          </p>
          <p className={styles.progressText}>
            Status: {workspace.attempt.status} · Finalization:{' '}
            {formatReason(workspace.attempt.finalizationReason)}
          </p>
        </div>
        <div className={styles.controls}>
          <div
            className={`${styles.timer} ${
              remainingSeconds !== null && remainingSeconds < 300 && !isReadOnly
                ? styles.timerWarning
                : ''
            }`}
          >
            ⏱ {remainingSeconds !== null ? formatTime(remainingSeconds) : '--:--'}
          </div>
          <button
            className={styles.submitButton}
            onClick={() => setShowSubmitDialog(true)}
            disabled={isReadOnly || submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Assessment'}
          </button>
        </div>
      </div>

      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${workspace.progress.percentage}%` }}
        ></div>
      </div>

      {deadlineFinalizing && (
        <div className={styles.statusCard}>
          <strong>Finalizing due to deadline.</strong>
          <p>Your remaining saved answers are being scored now.</p>
        </div>
      )}

      {submissionSummary && (
        <div className={styles.summaryCard}>
          <h2 className={styles.summaryTitle}>Submission Summary</h2>
          <div className={styles.summaryGrid}>
            <SummaryItem label="Score" value={`${submissionSummary.result.scoreEarned} / ${submissionSummary.result.scorePossible}`} />
            <SummaryItem label="Percentage" value={`${submissionSummary.result.percentage}%`} />
            <SummaryItem label="Result" value={submissionSummary.result.resultStatus} />
            <SummaryItem label="Correct" value={String(submissionSummary.result.correctCount)} />
            <SummaryItem label="Incorrect" value={String(submissionSummary.result.incorrectCount)} />
            <SummaryItem label="Unanswered" value={String(submissionSummary.result.unansweredCount)} />
            <SummaryItem label="Finalized by" value={formatReason(submissionSummary.finalizationReason)} />
            <SummaryItem label="Submitted at" value={new Date(submissionSummary.submittedAt).toLocaleString()} />
          </div>
          <p className={styles.summaryNote}>
            Detailed answer review will be available in the next step.
          </p>
        </div>
      )}

      <div>
        {workspace.sections.map((section, sectionIndex) => (
          <div key={section.id} className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                Section {sectionIndex + 1}: {section.title}
              </h2>
              {section.description && <p className={styles.sectionDesc}>{section.description}</p>}
            </div>

            <div>
              {section.questions.map((question, questionIndex) => (
                <div
                  key={question.id}
                  className={`${styles.questionCard} ${
                    savingQuestionId === question.id ? styles.questionSaving : ''
                  }`}
                >
                  <div className={styles.questionHeader}>
                    <h3 className={styles.questionPrompt}>
                      <span className={styles.questionNum}>{questionIndex + 1}.</span>
                      <span>{question.prompt}</span>
                    </h3>
                    <span className={styles.pointsBadge}>{question.points} pts</span>
                  </div>

                  {(question.type === 'SINGLE_CHOICE' || question.type === 'TRUE_FALSE') && (
                    <div className={styles.optionsList}>
                      {question.options.map((option) => (
                        <label key={option.id} className={styles.optionLabel}>
                          <input
                            type="radio"
                            name={question.id}
                            value={option.id}
                            checked={(question.draftAnswer?.selectedOptionIds ?? []).includes(option.id)}
                            onChange={() => handleOptionChange(question, option.id, true)}
                            className={styles.optionInput}
                            disabled={isReadOnly}
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {question.type === 'MULTIPLE_CHOICE' && (
                    <div className={styles.optionsList}>
                      {question.options.map((option) => (
                        <label key={option.id} className={styles.optionLabel}>
                          <input
                            type="checkbox"
                            name={question.id}
                            value={option.id}
                            checked={(question.draftAnswer?.selectedOptionIds ?? []).includes(option.id)}
                            onChange={(event) =>
                              handleOptionChange(question, option.id, event.target.checked)
                            }
                            className={styles.optionInput}
                            disabled={isReadOnly}
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {question.type === 'SHORT_TEXT' && (
                    <textarea
                      className={styles.textInput}
                      placeholder="Type your answer here..."
                      value={question.draftAnswer?.shortTextAnswer ?? ''}
                      onChange={(event) => handleTextChange(question, event.target.value)}
                      disabled={isReadOnly}
                    />
                  )}

                  <p className={styles.saveState}>
                    {savingQuestionId === question.id
                      ? 'Saving draft...'
                      : question.draftAnswer?.lastSavedAt
                        ? `Last saved ${new Date(question.draftAnswer.lastSavedAt).toLocaleTimeString()}`
                        : 'Not answered yet'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showSubmitDialog && (
        <div className={styles.dialogBackdrop} role="presentation">
          <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="submit-dialog-title">
            <h2 id="submit-dialog-title" className={styles.summaryTitle}>
              Submit assessment
            </h2>
            <p className={styles.dialogText}>
              Answered: {workspace.progress.answered} / {workspace.progress.total}
            </p>
            <p className={styles.dialogText}>Unanswered: {workspace.progress.unanswered}</p>
            <p className={styles.dialogText}>
              Remaining time: {remainingSeconds !== null ? formatTime(remainingSeconds) : '--:--'}
            </p>
            <p className={styles.dialogWarning}>
              Submission is irreversible. No answer edits are allowed after finalization.
            </p>
            <div className={styles.dialogActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setShowSubmitDialog(false)}
                disabled={submitting}
              >
                Keep working
              </button>
              <button
                type="button"
                className={styles.submitButton}
                onClick={() => void handleSubmitAttempt()}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Confirm Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.summaryItem}>
      <span className={styles.summaryLabel}>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
