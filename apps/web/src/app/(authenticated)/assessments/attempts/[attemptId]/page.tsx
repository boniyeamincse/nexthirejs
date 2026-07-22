'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-context';
import { getAttemptWorkspace, saveAttemptAnswer } from '@/lib/api-client';
import type { AssessmentAttemptWorkspace, AssessmentAttemptQuestionResult } from '@nexthire/types';
import styles from './page.module.css';

export default function AssessmentAttemptWorkspacePage() {
  const params = useParams();
  const attemptId = params.attemptId as string;
  const router = useRouter();
  const { getAccessToken } = useAuth();

  const [workspace, setWorkspace] = useState<AssessmentAttemptWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  const [savingQuestionId, setSavingQuestionId] = useState<string | null>(null);
  const debounceRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

  const fetchWorkspace = useCallback(async () => {
    const accessToken = getAccessToken();
    if (!accessToken) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getAttemptWorkspace(accessToken, attemptId);
      setWorkspace(data);
      setRemainingSeconds(data.attempt.remainingSeconds);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load assessment workspace.');
    } finally {
      setLoading(false);
    }
  }, [attemptId, getAccessToken]);

  useEffect(() => {
    if (attemptId) {
      fetchWorkspace();
    }
  }, [attemptId, fetchWorkspace]);

  useEffect(() => {
    if (remainingSeconds === null) return;

    if (remainingSeconds <= 0) {
      alert('Time is up! Your assessment attempt has expired.');
      router.push('/dashboard');
      return;
    }

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => (prev && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSeconds, router]);

  const saveDraftAnswer = async (questionId: string, payload: { selectedOptionIds: string[], shortTextAnswer: string | null }) => {
    const accessToken = getAccessToken();
    if (!accessToken) return;
    try {
      setSavingQuestionId(questionId);
      const data = await saveAttemptAnswer(accessToken, attemptId, questionId, payload);
      setWorkspace(prev => {
        if (!prev) return prev;
        const newSections = prev.sections.map(sec => ({
          ...sec,
          questions: sec.questions.map(q => {
            if (q.id === questionId) {
              return { ...q, draftAnswer: data.savedAnswer };
            }
            return q;
          })
        }));
        return { ...prev, sections: newSections, progress: data.progress };
      });
    } catch (err: any) {
      alert(err.message || 'Failed to save answer');
    } finally {
      setSavingQuestionId(null);
    }
  };

  const handleOptionChange = (question: AssessmentAttemptQuestionResult, optionId: string, checked: boolean) => {
    let newSelected: string[] = [];
    const currentSelected = question.draftAnswer?.selectedOptionIds || [];

    if (question.type === 'SINGLE_CHOICE' || question.type === 'TRUE_FALSE') {
      newSelected = [optionId];
    } else if (question.type === 'MULTIPLE_CHOICE') {
      if (checked) {
        newSelected = [...currentSelected, optionId];
      } else {
        newSelected = currentSelected.filter(id => id !== optionId);
      }
    }

    setWorkspace(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.map(sec => ({
          ...sec,
          questions: sec.questions.map(q => q.id === question.id ? {
            ...q, draftAnswer: { selectedOptionIds: newSelected, shortTextAnswer: q.draftAnswer?.shortTextAnswer || null, lastSavedAt: new Date().toISOString() }
          } : q)
        }))
      };
    });

    if (debounceRef.current[question.id]) {
      clearTimeout(debounceRef.current[question.id]);
    }

    debounceRef.current[question.id] = setTimeout(() => {
      saveDraftAnswer(question.id, { selectedOptionIds: newSelected, shortTextAnswer: question.draftAnswer?.shortTextAnswer || null });
    }, 500);
  };

  const handleTextChange = (question: AssessmentAttemptQuestionResult, text: string) => {
    setWorkspace(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.map(sec => ({
          ...sec,
          questions: sec.questions.map(q => q.id === question.id ? {
            ...q, draftAnswer: { selectedOptionIds: q.draftAnswer?.selectedOptionIds || [], shortTextAnswer: text, lastSavedAt: new Date().toISOString() }
          } : q)
        }))
      };
    });

    if (debounceRef.current[question.id]) {
      clearTimeout(debounceRef.current[question.id]);
    }

    debounceRef.current[question.id] = setTimeout(() => {
      saveDraftAnswer(question.id, { selectedOptionIds: question.draftAnswer?.selectedOptionIds || [], shortTextAnswer: text });
    }, 1000);
  };

  if (loading) {
    return <div className={styles.container}><p>Loading workspace...</p></div>;
  }

  if (error || !workspace) {
    return (
      <div className={styles.container}>
        <div className={styles.errorCard}>
          <h2 className={styles.errorTitle}>Workspace Error</h2>
          <p>{error || 'An unknown error occurred.'}</p>
          <button className={styles.submitButton} onClick={() => router.push('/dashboard')} style={{ marginTop: '1rem' }}>Return to Dashboard</button>
        </div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{workspace.attempt.title}</h1>
          <p className={styles.progressText}>
            Progress: {workspace.progress.percentage}% ({workspace.progress.answered}/{workspace.progress.total} answered)
          </p>
        </div>
        <div className={styles.controls}>
          <div className={`${styles.timer} ${remainingSeconds !== null && remainingSeconds < 300 ? styles.timerWarning : ''}`}>
            ⏱ {remainingSeconds !== null ? formatTime(remainingSeconds) : '--:--'}
          </div>
          <button className={styles.submitButton} onClick={() => alert("Submission coming soon")}>Submit Assessment</button>
        </div>
      </div>

      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${workspace.progress.percentage}%` }}></div>
      </div>

      <div>
        {workspace.sections.map((section, sIdx) => (
          <div key={section.id} className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Section {sIdx + 1}: {section.title}</h2>
              {section.description && <p className={styles.sectionDesc}>{section.description}</p>}
            </div>

            <div>
              {section.questions.map((question, qIdx) => (
                <div key={question.id} className={`${styles.questionCard} ${savingQuestionId === question.id ? styles.questionSaving : ''}`}>
                  <div className={styles.questionHeader}>
                    <h3 className={styles.questionPrompt}>
                      <span className={styles.questionNum}>{qIdx + 1}.</span>
                      <span>{question.prompt}</span>
                    </h3>
                    <span className={styles.pointsBadge}>{question.points} pts</span>
                  </div>
                  <div>
                    {(question.type === 'SINGLE_CHOICE' || question.type === 'TRUE_FALSE') && (
                      <div className={styles.optionsList}>
                        {question.options.map(opt => (
                          <label key={opt.id} className={styles.optionLabel}>
                            <input
                              type="radio"
                              name={question.id}
                              value={opt.id}
                              checked={(question.draftAnswer?.selectedOptionIds || []).includes(opt.id)}
                              onChange={() => handleOptionChange(question, opt.id, true)}
                              className={styles.optionInput}
                            />
                            <span>{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    )}
                    {question.type === 'MULTIPLE_CHOICE' && (
                      <div className={styles.optionsList}>
                        {question.options.map(opt => (
                          <label key={opt.id} className={styles.optionLabel}>
                            <input
                              type="checkbox"
                              name={question.id}
                              value={opt.id}
                              checked={(question.draftAnswer?.selectedOptionIds || []).includes(opt.id)}
                              onChange={(e) => handleOptionChange(question, opt.id, e.target.checked)}
                              className={styles.optionInput}
                            />
                            <span>{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    )}
                    {question.type === 'SHORT_TEXT' && (
                      <textarea
                        className={styles.textInput}
                        placeholder="Type your answer here..."
                        value={question.draftAnswer?.shortTextAnswer || ''}
                        onChange={(e) => handleTextChange(question, e.target.value)}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
