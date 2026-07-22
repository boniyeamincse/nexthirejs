import type { ExpertApplicationStatusValue } from '@nexthire/types';
import {
  APPLICATION_STATUS_PRESENTATION,
  type StatusPresentation,
} from '../lib/expert-presentation';

const TONE_STYLES: Record<
  StatusPresentation['tone'],
  { bg: string; color: string; border: string }
> = {
  neutral: { bg: 'rgba(100,116,139,0.15)', color: '#cbd5e1', border: 'rgba(148,163,184,0.4)' },
  info: { bg: 'rgba(59,130,246,0.15)', color: '#93c5fd', border: 'rgba(59,130,246,0.4)' },
  progress: { bg: 'rgba(168,85,247,0.15)', color: '#d8b4fe', border: 'rgba(168,85,247,0.4)' },
  success: { bg: 'rgba(34,197,94,0.15)', color: '#86efac', border: 'rgba(34,197,94,0.4)' },
  danger: { bg: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: 'rgba(239,68,68,0.4)' },
  warning: { bg: 'rgba(245,158,11,0.15)', color: '#fcd34d', border: 'rgba(245,158,11,0.4)' },
};

export function StatusBadge({ status }: { status: ExpertApplicationStatusValue }) {
  const presentation = APPLICATION_STATUS_PRESENTATION[status];
  const tone = TONE_STYLES[presentation.tone];

  return (
    <span
      // Colour is decorative; the label + marker carry the meaning for
      // colour-blind and screen-reader users.
      data-status={status}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.2rem 0.65rem',
        borderRadius: '9999px',
        fontSize: '0.78rem',
        fontWeight: 600,
        background: tone.bg,
        color: tone.color,
        border: `1px solid ${tone.border}`,
      }}
    >
      <span aria-hidden="true">{presentation.marker}</span>
      <span>{presentation.label}</span>
    </span>
  );
}
