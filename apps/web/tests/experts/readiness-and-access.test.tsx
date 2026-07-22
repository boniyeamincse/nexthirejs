import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReadinessSummary } from '@/features/experts/components/ReadinessSummary';
import { DocumentAccessButton } from '@/features/experts/components/DocumentAccessButton';
import * as apiClient from '@/lib/api-client';
import type { ExpertApplicationReadiness } from '@nexthire/types';

vi.mock('@/lib/api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api-client')>();
  return { ...actual, getExpertVerificationDocumentAccess: vi.fn() };
});

const notReady: ExpertApplicationReadiness = {
  ready: false,
  blockers: [
    { code: 'MFA_REQUIRED_BY_POLICY', message: 'Enable MFA before submitting.' },
    { code: 'DOCUMENTS_MISSING', message: 'Upload a government ID.' },
  ],
  summary: {
    profileComplete: true,
    requiredDocumentsPresent: false,
    mfaEnabled: false,
    documentCount: 1,
  },
};

describe('ReadinessSummary', () => {
  it('surfaces the MFA blocker with a setup link', () => {
    render(<ReadinessSummary readiness={notReady} />);
    expect(screen.getByText(/MFA required/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Set up MFA/i })).toHaveAttribute(
      'href',
      '/settings/security',
    );
  });

  it('lists blockers and a not-ready status', () => {
    render(<ReadinessSummary readiness={notReady} />);
    expect(screen.getByText('Upload a government ID.')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/Complete the items above/i);
  });

  it('shows a ready status when ready', () => {
    render(
      <ReadinessSummary
        readiness={{
          ready: true,
          blockers: [],
          summary: {
            profileComplete: true,
            requiredDocumentsPresent: true,
            mfaEnabled: true,
            documentCount: 2,
          },
        }}
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent(/ready to submit/i);
  });
});

describe('DocumentAccessButton', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches a short-lived URL and opens it without persisting it', async () => {
    const openSpy = vi.fn().mockReturnValue({});
    vi.stubGlobal('open', openSpy);
    (apiClient.getExpertVerificationDocumentAccess as any).mockResolvedValue({
      url: 'https://storage.example/signed-abc',
      expiresAt: '2026-07-20T10:05:00.000Z',
      expiresInSeconds: 300,
    });

    render(
      <DocumentAccessButton
        accessToken="tok"
        applicationId="app-1"
        documentId="doc-1"
        label="Government ID"
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /View Government ID/i }));

    await waitFor(() =>
      expect(apiClient.getExpertVerificationDocumentAccess).toHaveBeenCalledWith(
        'tok',
        'app-1',
        'doc-1',
      ),
    );
    expect(openSpy).toHaveBeenCalledWith(
      'https://storage.example/signed-abc',
      '_blank',
      'noopener,noreferrer',
    );
    // The signed URL must not be rendered/persisted anywhere in the DOM.
    expect(screen.queryByText(/signed-abc/)).not.toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it('shows an error when the link cannot be opened', async () => {
    vi.stubGlobal('open', vi.fn().mockReturnValue(null));
    (apiClient.getExpertVerificationDocumentAccess as any).mockResolvedValue({
      url: 'https://storage.example/signed-xyz',
      expiresAt: '2026-07-20T10:05:00.000Z',
      expiresInSeconds: 300,
    });

    render(
      <DocumentAccessButton
        accessToken="tok"
        applicationId="app-1"
        documentId="doc-1"
        label="ID"
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /View ID/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/Pop-up blocked/i);
    vi.unstubAllGlobals();
  });
});
