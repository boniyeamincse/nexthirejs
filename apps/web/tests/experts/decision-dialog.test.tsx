import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DecisionDialog } from '@/features/experts/components/DecisionDialog';

describe('DecisionDialog', () => {
  it('renders as a modal dialog with an accessible name', () => {
    render(
      <DecisionDialog kind="approve" onConfirm={vi.fn()} onClose={vi.fn()} submitting={false} />,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleName(/Approve application/i);
  });

  it('blocks reject without a note and does not call onConfirm', async () => {
    const onConfirm = vi.fn();
    render(
      <DecisionDialog kind="reject" onConfirm={onConfirm} onClose={vi.fn()} submitting={false} />,
    );
    await userEvent.click(screen.getByRole('button', { name: /Reject application/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/note is required/i);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('submits reject with reason and note', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(
      <DecisionDialog kind="reject" onConfirm={onConfirm} onClose={vi.fn()} submitting={false} />,
    );
    await userEvent.type(screen.getByLabelText(/Reviewer note/i), 'Documents illegible.');
    await userEvent.click(screen.getByRole('button', { name: /Reject application/i }));
    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
    const arg = onConfirm.mock.calls[0][0];
    expect(arg.reviewerNote).toBe('Documents illegible.');
    expect(arg.reasonCode).toBeTruthy();
  });

  it('closes on Escape', async () => {
    const onClose = vi.fn();
    render(
      <DecisionDialog kind="approve" onConfirm={vi.fn()} onClose={onClose} submitting={false} />,
    );
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  it('allows approve without a note', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(
      <DecisionDialog kind="approve" onConfirm={onConfirm} onClose={vi.fn()} submitting={false} />,
    );
    await userEvent.click(screen.getByRole('button', { name: /Approve and grant Expert role/i }));
    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
  });
});
