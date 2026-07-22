import type { ExpertApplicationDetail } from '@nexthire/types';
import { APPLICATION_STATUS_PRESENTATION, formatDateTime } from '../lib/expert-presentation';

interface TimelineStep {
  key: string;
  label: string;
  state: 'done' | 'current' | 'upcoming';
  at?: string | null;
  detail?: string;
}

function buildSteps(application: ExpertApplicationDetail): TimelineStep[] {
  const { status } = application;

  const created: TimelineStep = {
    key: 'DRAFT',
    label: 'Application started',
    state: 'done',
    at: application.createdAt,
  };

  const submitted: TimelineStep = {
    key: 'SUBMITTED',
    label: 'Submitted for review',
    state: application.submittedAt ? 'done' : 'upcoming',
    at: application.submittedAt,
  };

  const review: TimelineStep = {
    key: 'UNDER_REVIEW',
    label: 'Under review',
    state:
      status === 'UNDER_REVIEW' ? 'current' : application.reviewStartedAt ? 'done' : 'upcoming',
    at: application.reviewStartedAt,
  };

  let decisionLabel = 'Decision';
  let decisionState: TimelineStep['state'] = 'upcoming';
  let decisionAt: string | null | undefined = null;
  let decisionDetail: string | undefined;

  if (status === 'APPROVED') {
    decisionLabel = 'Approved';
    decisionState = 'done';
    decisionAt = application.approvedAt ?? application.reviewedAt;
    decisionDetail = 'You now have the Expert role.';
  } else if (status === 'REJECTED') {
    decisionLabel = 'Rejected';
    decisionState = 'done';
    decisionAt = application.rejectedAt ?? application.reviewedAt;
  } else if (status === 'CHANGES_REQUESTED') {
    decisionLabel = 'Changes requested';
    decisionState = 'current';
    decisionAt = application.reviewedAt;
    decisionDetail = 'Update your application and resubmit.';
  } else if (status === 'WITHDRAWN') {
    decisionLabel = 'Withdrawn';
    decisionState = 'done';
    decisionAt = application.withdrawnAt;
  }

  if (status === 'SUBMITTED') {
    submitted.state = 'current';
  }
  if (status === 'DRAFT') {
    created.state = 'current';
  }

  return [
    created,
    submitted,
    review,
    {
      key: 'DECISION',
      label: decisionLabel,
      state: decisionState,
      at: decisionAt,
      detail: decisionDetail,
    },
  ];
}

const STATE_MARKER: Record<TimelineStep['state'], string> = {
  done: '✓',
  current: '●',
  upcoming: '○',
};

const STATE_TEXT: Record<TimelineStep['state'], string> = {
  done: 'Completed',
  current: 'In progress',
  upcoming: 'Pending',
};

export function ApplicationTimeline({ application }: { application: ExpertApplicationDetail }) {
  const steps = buildSteps(application);
  const current = APPLICATION_STATUS_PRESENTATION[application.status];

  return (
    <section aria-label="Application progress">
      <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {steps.map((step) => {
          const color =
            step.state === 'done' ? '#22c55e' : step.state === 'current' ? '#a855f7' : '#64748b';
          return (
            <li
              key={step.key}
              style={{
                display: 'flex',
                gap: '0.85rem',
                padding: '0.85rem 0',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  flexShrink: 0,
                  width: '1.6rem',
                  height: '1.6rem',
                  borderRadius: '9999px',
                  border: `2px solid ${color}`,
                  color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                }}
              >
                {STATE_MARKER[step.state]}
              </span>
              <div>
                <p style={{ margin: 0, color: '#f1f5f9', fontWeight: 600, fontSize: '0.95rem' }}>
                  {step.label}{' '}
                  <span style={{ color: '#94a3b8', fontWeight: 500, fontSize: '0.8rem' }}>
                    ({STATE_TEXT[step.state]})
                  </span>
                </p>
                {step.at && (
                  <p style={{ margin: '0.15rem 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>
                    {formatDateTime(step.at)}
                  </p>
                )}
                {step.detail && (
                  <p style={{ margin: '0.15rem 0 0', color: '#cbd5e1', fontSize: '0.8rem' }}>
                    {step.detail}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      <p style={{ marginTop: '0.75rem', color: '#94a3b8', fontSize: '0.85rem' }}>
        Current status: <strong style={{ color: '#e4e4e7' }}>{current.label}</strong> —{' '}
        {current.description}
      </p>
    </section>
  );
}
