import { useEffect, useId, useRef, useState } from 'react';
import { EXPERT_LIMITS, EXPERT_REJECTION_REASONS } from '@nexthire/constants';
import type { ReviewExpertApplicationInput } from '@nexthire/types';
import { REJECTION_REASON_LABELS } from '../lib/expert-presentation';

export type DecisionKind = 'approve' | 'reject' | 'request-changes';

interface DecisionDialogProps {
  kind: DecisionKind;
  onConfirm: (input: ReviewExpertApplicationInput) => Promise<void>;
  onClose: () => void;
  submitting: boolean;
  error?: string | null;
}

const DIALOG_COPY: Record<
  DecisionKind,
  {
    title: string;
    confirmLabel: string;
    requiresReason: boolean;
    noteRequired: boolean;
    intro: string;
  }
> = {
  approve: {
    title: 'Approve application',
    confirmLabel: 'Approve and grant Expert role',
    requiresReason: false,
    noteRequired: false,
    intro: 'Approving grants the applicant the Expert role. This action is final.',
  },
  reject: {
    title: 'Reject application',
    confirmLabel: 'Reject application',
    requiresReason: true,
    noteRequired: true,
    intro: 'Select a reason and add a note. Rejection is final for this application.',
  },
  'request-changes': {
    title: 'Request changes',
    confirmLabel: 'Send change request',
    requiresReason: false,
    noteRequired: true,
    intro: 'Explain what the applicant must update. They can revise and resubmit.',
  },
};

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => !el.hasAttribute('disabled'));
}

export function DecisionDialog({
  kind,
  onConfirm,
  onClose,
  submitting,
  error,
}: DecisionDialogProps) {
  const copy = DIALOG_COPY[kind];
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descId = useId();

  const [reasonCode, setReasonCode] = useState<string>(
    copy.requiresReason ? EXPERT_REJECTION_REASONS[0] : 'APPROVED',
  );
  const [note, setNote] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const first = dialogRef.current ? getFocusable(dialogRef.current)[0] : null;
    first?.focus();
    return () => {
      previouslyFocused.current?.focus();
    };
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape' && !submitting) {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key === 'Tab' && dialogRef.current) {
      const focusable = getFocusable(dialogRef.current);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  const handleConfirm = async () => {
    setLocalError(null);
    if (copy.noteRequired && note.trim().length === 0) {
      setLocalError('A note is required for this decision.');
      return;
    }
    if (note.length > EXPERT_LIMITS.MAX_REVIEW_NOTE) {
      setLocalError(`Note must be at most ${EXPERT_LIMITS.MAX_REVIEW_NOTE} characters.`);
      return;
    }
    await onConfirm({ reasonCode, reviewerNote: note.trim() });
  };

  return (
    <div
      onKeyDown={handleKeyDown}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        zIndex: 50,
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        style={{
          width: '100%',
          maxWidth: '30rem',
          background: '#0f172a',
          border: '1px solid #334155',
          borderRadius: '0.9rem',
          padding: '1.4rem',
        }}
      >
        <h2 id={titleId} style={{ margin: '0 0 0.5rem', color: '#f1f5f9', fontSize: '1.2rem' }}>
          {copy.title}
        </h2>
        <p id={descId} style={{ margin: '0 0 1rem', color: '#94a3b8', fontSize: '0.88rem' }}>
          {copy.intro}
        </p>

        {copy.requiresReason && (
          <div style={{ marginBottom: '1rem' }}>
            <label
              htmlFor="decision-reason"
              style={{
                display: 'block',
                color: '#e4e4e7',
                marginBottom: '0.35rem',
                fontWeight: 500,
                fontSize: '0.9rem',
              }}
            >
              Reason
            </label>
            <select
              id="decision-reason"
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value)}
              disabled={submitting}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '0.5rem',
                color: '#f1f5f9',
              }}
            >
              {EXPERT_REJECTION_REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {REJECTION_REASON_LABELS[reason] ?? reason}
                </option>
              ))}
            </select>
          </div>
        )}

        <div style={{ marginBottom: '1rem' }}>
          <label
            htmlFor="decision-note"
            style={{
              display: 'block',
              color: '#e4e4e7',
              marginBottom: '0.35rem',
              fontWeight: 500,
              fontSize: '0.9rem',
            }}
          >
            Reviewer note{copy.noteRequired ? '' : ' (optional)'}
          </label>
          <textarea
            id="decision-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={submitting}
            rows={4}
            maxLength={EXPERT_LIMITS.MAX_REVIEW_NOTE}
            aria-describedby="decision-note-hint"
            style={{
              width: '100%',
              padding: '0.55rem 0.75rem',
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '0.5rem',
              color: '#f1f5f9',
              resize: 'vertical',
            }}
          />
          <p
            id="decision-note-hint"
            style={{ margin: '0.3rem 0 0', color: '#64748b', fontSize: '0.75rem' }}
          >
            {note.length} / {EXPERT_LIMITS.MAX_REVIEW_NOTE} characters
          </p>
        </div>

        {(localError || error) && (
          <p role="alert" style={{ margin: '0 0 0.85rem', color: '#fca5a5', fontSize: '0.85rem' }}>
            {localError ?? error}
          </p>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            style={{
              padding: '0.55rem 1.1rem',
              background: 'transparent',
              border: '1px solid #475569',
              borderRadius: '0.5rem',
              color: '#e4e4e7',
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            style={{
              padding: '0.55rem 1.1rem',
              background:
                kind === 'reject' ? '#b91c1c' : kind === 'approve' ? '#15803d' : '#b45309',
              border: 'none',
              borderRadius: '0.5rem',
              color: '#fff',
              fontWeight: 600,
              cursor: submitting ? 'wait' : 'pointer',
            }}
          >
            {submitting ? 'Working…' : copy.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
