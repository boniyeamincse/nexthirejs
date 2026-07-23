'use client';
/* eslint-disable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-context';
import {
  getMyProfileCompletionDashboard,
  ApiClientError,
  uploadMyPhoto,
  fetchMyPhotoObjectUrl,
} from '@/lib/api-client';
import type { CandidateProfileCompletionDashboard } from '@/lib/api-client';
import Link from 'next/link';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import styles from './dashboard.module.css';

const MOCK_SKILLS = [
  { subject: 'Frontend', A: 90, fullMark: 100 },
  { subject: 'Backend', A: 70, fullMark: 100 },
  { subject: 'UI/UX', A: 60, fullMark: 100 },
  { subject: 'DevOps', A: 40, fullMark: 100 },
  { subject: 'Testing', A: 80, fullMark: 100 },
  { subject: 'Sys Design', A: 65, fullMark: 100 },
];

const FLOATING_TAGS = ['React', 'Node.js', 'TypeScript', 'System Design', 'PostgreSQL', 'AWS'];

export default function DashboardPage() {
  const { getAccessToken, logout, user, status: authStatus } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<CandidateProfileCompletionDashboard | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (avatarUrl) URL.revokeObjectURL(avatarUrl);
    };
  }, [avatarUrl]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const loadAvatar = useCallback(async (token: string) => {
    try {
      const url = await fetchMyPhotoObjectUrl(token);
      setAvatarUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    } catch (e) {
      // Photo might not exist (404 is handled as null returned), or other error
    }
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const token = getAccessToken();
      if (!token) return;
      try {
        await uploadMyPhoto(token, file);
        await loadAvatar(token);
      } catch (err) {
        alert('Failed to upload photo. Ensure it is a valid JPEG/PNG under 2MB.');
      }
    }
  };

  const fetchDashboard = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setPageError(null);

    try {
      const [data] = await Promise.all([getMyProfileCompletionDashboard(token), loadAvatar(token)]);
      setDashboard(data);
    } catch (err) {
      if (err instanceof ApiClientError && err.statusCode === 401) {
        await logout();
        router.push('/login');
        return;
      }
      setPageError('Dashboard is temporarily unavailable. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, logout, router, loadAvatar]);

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  const statusLabel = (s: string): string => {
    switch (s) {
      case 'NOT_STARTED':
        return 'Not started';
      case 'IN_PROGRESS':
        return 'In progress';
      case 'COMPLETED':
        return 'Completed';
      default:
        return s;
    }
  };

  if (authStatus === 'unknown' || authStatus === 'loading') {
    return (
      <div className={styles.centerState} aria-live="polite" aria-busy="true">
        <p>Loading...</p>
      </div>
    );
  }

  if (authStatus === 'unauthenticated') {
    return (
      <div className={styles.centerState}>
        <p>Session expired. Please log in again.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.centerState} aria-live="polite" aria-busy="true">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className={`${styles.centerState} ${styles.centerStateColumn}`} aria-live="polite">
        <p style={{ color: '#ef4444' }}>{pageError}</p>
        <button className={styles.retryBtn} onClick={() => void fetchDashboard()}>
          Try again
        </button>
      </div>
    );
  }

  if (!dashboard) {
    return null;
  }

  const pct = dashboard.completion.percentage;
  const displayName = user?.email ? (user.email.split('@')[0] ?? 'there') : 'there';
  const avatarInitial = displayName.charAt(0).toUpperCase();
  const nextUpSection = dashboard.sections.find((s) => s.status !== 'COMPLETED');

  return (
    <div className={styles.page}>
      <div className={styles.bgGlow} />

      <div className={styles.container}>
        {/* Hero section */}
        <div className={styles.hero}>
          <div className={styles.floatingTags} aria-hidden="true">
            {FLOATING_TAGS.map((tag, i) => (
              <div key={i} className={styles.tag}>
                {tag}
              </div>
            ))}
          </div>

          <div className={styles.heroContent}>
            <div className={styles.heroIdentity}>
              <div
                className={styles.avatarContainer}
                onClick={handleAvatarClick}
                title="Upload photo"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAvatarClick();
                }}
              >
                <div
                  className={styles.avatar}
                  aria-hidden="true"
                  style={
                    avatarUrl
                      ? { backgroundImage: `url(${avatarUrl})`, color: 'transparent' }
                      : undefined
                  }
                >
                  {avatarUrl ? null : avatarInitial}
                </div>
                <div className={styles.avatarOverlay}>
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
              </div>
              <div>
                <h1 className={styles.heroGreeting}>
                  Hi <span className={styles.heroGreetingName}>{displayName}</span>!
                </h1>
                <p className={styles.heroSubtitle}>
                  {pct === 100
                    ? 'Your profile is complete and ready to share.'
                    : 'Welcome back to your learning journey. Keep building your profile to stand out to employers.'}
                </p>
              </div>
            </div>
          </div>

          <div className={styles.heroBadges}>
            <span
              className={`${styles.heroBadge} ${pct >= 80 ? styles.badgePro : styles.badgeBasic}`}
            >
              {pct >= 80 ? 'PRO' : 'BASIC'}
            </span>
            <span className={`${styles.heroBadge} ${styles.badgeBasic}`}>{pct}% COMPLETED</span>
          </div>
        </div>

        <div className={styles.dashboardGrid}>
          {/* Let's Get Started Card */}
          <div className={`${styles.card} ${styles.cardPrimary}`}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Let&apos;s Get Started!</h2>
              <span className={styles.cardBadge}>
                {dashboard.summary.completedSections} OF {dashboard.summary.totalSections}
              </span>
            </div>

            {dashboard.nextActions.length > 0 ? (
              <div className={styles.checklist}>
                {dashboard.nextActions.map((action) => (
                  <Link
                    key={action.id}
                    href={action.route}
                    className={styles.checklistItem}
                    aria-label={`${action.title}: ${action.description}`}
                  >
                    <span className={`${styles.checklistCircle} ${styles.checklistCircleDone}`}>
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </span>
                    <span className={styles.checklistLabel}>{action.title}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className={styles.emptyStateContainer}>
                <div
                  className={`${styles.checklistCircle} ${styles.checklistCircleDone}`}
                  style={{ width: '3rem', height: '3rem' }}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <p className={styles.emptyState}>All caught up! Your profile is looking great.</p>
              </div>
            )}
          </div>

          {/* Profile Modules Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Profile Modules</h2>
              <span className={styles.cardBadge}>{dashboard.summary.totalSections} TOTAL</span>
            </div>

            <div className={styles.miniStat}>
              <p className={styles.miniStatValue}>{dashboard.summary.completedSections}</p>
              <p className={styles.miniStatLabel}>Completed Sections</p>
            </div>

            {nextUpSection && (
              <Link href={nextUpSection.route} className={styles.cardLink}>
                {nextUpSection.percentage}% {nextUpSection.label} →
              </Link>
            )}
          </div>

          {/* Assessments Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Assessments</h2>
              <span className={styles.cardBadge}>0 TOTAL</span>
            </div>

            <div className={styles.emptyStateContainer}>
              <svg
                className={styles.emptyStateIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="6"></circle>
                <circle cx="12" cy="12" r="2"></circle>
              </svg>
              <p className={styles.emptyState}>No enrollments. Click to browse assessments.</p>
            </div>

            <Link href="/assessments" className={styles.cardLink}>
              View all assessments →
            </Link>
          </div>

          {/* Sections List Card (Spans 2 columns) */}
          <div className={`${styles.card} ${styles.span2}`}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Profile Sections</h2>
              <span className={styles.cardBadge}>{pct}% OVERALL</span>
            </div>

            <div className={styles.sectionsTableContainer}>
              <table className={styles.sectionsTable}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Progress</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.sections.map((section) => (
                    <tr key={section.section}>
                      <td>
                        <div className={styles.sectionNameCell}>
                          <div className={styles.sectionIcon} />
                          {section.label}
                        </div>
                      </td>
                      <td>
                        <div className={styles.progressCell}>
                          <div className={styles.progressTrack}>
                            <div
                              className={styles.progressFill}
                              style={{
                                width: `${section.percentage}%`,
                                background:
                                  section.status === 'COMPLETED'
                                    ? '#22c55e'
                                    : section.status === 'IN_PROGRESS'
                                      ? '#eab308'
                                      : '#3b82f6',
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className={styles.statusCell}>
                        <span
                          className={`${styles.statusBadge} ${
                            section.status === 'COMPLETED'
                              ? styles.statusCompleted
                              : section.status === 'IN_PROGRESS'
                                ? styles.statusInProgress
                                : styles.statusNotStarted
                          }`}
                        >
                          {statusLabel(section.status)}
                        </span>
                      </td>
                      <td className={styles.actionCell}>
                        <Link href={section.route} className={styles.actionLink}>
                          ⭢
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Skill Coverage Radar Chart */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Skill Coverage</h2>
              <span className={styles.cardBadge}>MOCK DATA</span>
            </div>
            <p
              className={styles.miniStatLabel}
              style={{ textAlign: 'left', marginTop: 0, marginBottom: '1rem' }}
            >
              Based on profile completion
            </p>

            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={MOCK_SKILLS}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <Radar
                    name="Skills"
                    dataKey="A"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.4}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className={styles.footerLinks}>
          <Link href="/profile" className={styles.footerLink}>
            View profile preview
          </Link>
          <Link href="/settings/privacy" className={styles.footerLink}>
            Privacy settings
          </Link>
        </div>

        <p className={styles.versionNote}>Completion v{dashboard.completion.version}</p>
      </div>
    </div>
  );
}
