import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VerificationDocumentsManager } from '@/features/experts/components/VerificationDocumentsManager';
import type { ExpertVerificationDocumentResult } from '@nexthire/types';

const govDoc: ExpertVerificationDocumentResult = {
  id: 'doc-1',
  applicationId: 'app-1',
  type: 'GOVERNMENT_ID',
  originalFileName: 'passport.pdf',
  mimeType: 'application/pdf',
  sizeBytes: '204800',
  uploadedAt: '2026-07-20T10:00:00.000Z',
  removedAt: null,
};

function makeFile(name: string, type: string, sizeBytes: number): File {
  const file = new File(['x'], name, { type });
  Object.defineProperty(file, 'size', { value: sizeBytes });
  return file;
}

describe('VerificationDocumentsManager', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the required-documents checklist with text markers', () => {
    render(
      <VerificationDocumentsManager
        documents={[]}
        editable
        onUpload={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect(screen.getByText(/One government-issued ID/i)).toBeInTheDocument();
    expect(screen.getByText(/One proof of profession/i)).toBeInTheDocument();
    // "Required" text marker (not colour-only)
    expect(screen.getAllByText(/Required/i).length).toBeGreaterThan(0);
  });

  it('marks a requirement as provided when a matching document exists', () => {
    render(
      <VerificationDocumentsManager
        documents={[govDoc]}
        editable
        onUpload={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect(screen.getAllByText(/Provided/i).length).toBeGreaterThan(0);
    expect(screen.getByText('passport.pdf', { exact: false })).toBeInTheDocument();
  });

  it('rejects an unsupported file type without calling onUpload', async () => {
    const onUpload = vi.fn();
    render(
      <VerificationDocumentsManager
        documents={[]}
        editable
        onUpload={onUpload}
        onRemove={vi.fn()}
      />,
    );
    const input = screen.getByLabelText(/Choose a file/i) as HTMLInputElement;
    // Bypass the `accept` hint (which the browser/userEvent enforces) to simulate
    // a disallowed file reaching the change handler; validation must still reject it.
    fireEvent.change(input, {
      target: { files: [makeFile('malware.exe', 'application/x-msdownload', 1000)] },
    });
    expect(await screen.findByRole('alert')).toHaveTextContent(/Unsupported file type/i);
    expect(onUpload).not.toHaveBeenCalled();
  });

  it('rejects a file that is too large', async () => {
    const onUpload = vi.fn();
    render(
      <VerificationDocumentsManager
        documents={[]}
        editable
        onUpload={onUpload}
        onRemove={vi.fn()}
      />,
    );
    const input = screen.getByLabelText(/Choose a file/i) as HTMLInputElement;
    await userEvent.upload(input, makeFile('big.pdf', 'application/pdf', 11 * 1024 * 1024));
    expect(await screen.findByRole('alert')).toHaveTextContent(/too large/i);
    expect(onUpload).not.toHaveBeenCalled();
  });

  it('uploads a valid PDF', async () => {
    const onUpload = vi.fn().mockResolvedValue(undefined);
    render(
      <VerificationDocumentsManager
        documents={[]}
        editable
        onUpload={onUpload}
        onRemove={vi.fn()}
      />,
    );
    const input = screen.getByLabelText(/Choose a file/i) as HTMLInputElement;
    await userEvent.upload(input, makeFile('id.pdf', 'application/pdf', 5000));
    await waitFor(() => expect(onUpload).toHaveBeenCalledTimes(1));
    expect(onUpload.mock.calls[0][0].type).toBe('GOVERNMENT_ID');
  });

  it('shows a labelled remove button when editable and calls onRemove', async () => {
    const onRemove = vi.fn().mockResolvedValue(undefined);
    render(
      <VerificationDocumentsManager
        documents={[govDoc]}
        editable
        onUpload={vi.fn()}
        onRemove={onRemove}
      />,
    );
    const removeBtn = screen.getByRole('button', { name: /Remove Government-issued ID/i });
    await userEvent.click(removeBtn);
    await waitFor(() => expect(onRemove).toHaveBeenCalledWith('doc-1'));
  });

  it('hides the uploader and remove buttons when not editable', () => {
    render(
      <VerificationDocumentsManager
        documents={[govDoc]}
        editable={false}
        onUpload={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect(screen.queryByLabelText(/Choose a file/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Remove/i })).not.toBeInTheDocument();
    expect(
      screen.getByText(/cannot be changed while your application is being reviewed/i),
    ).toBeInTheDocument();
  });
});
