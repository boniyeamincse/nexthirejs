import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CvEditor } from '../CvEditor';
import * as apiClient from '@/lib/api-client';
import type {
  CvResult,
  CvReadinessResult,
  CvSectionContentResult,
  CvExportResult,
} from '@/lib/api-client';

const { mockPush, mockLogout, mockGetAccessToken, mockUseAuth } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockLogout: vi.fn(),
  mockGetAccessToken: vi.fn(),
  mockUseAuth: vi.fn(),
}));

vi.mock('next/navigation', () => {
  const router = { push: mockPush };
  return { useRouter: () => router };
});

vi.mock('@/providers/auth-context', () => ({
  useAuth: mockUseAuth,
}));

const baseCv: CvResult = {
  id: 'cv-1',
  userId: 'user-1',
  title: 'Software Engineer CV',
  template: 'ATS_OPTIMIZED',
  visibility: 'PRIVATE',
  isDefault: true,
  completionScore: 20,
  createdAt: '2026-07-23T10:00:00.000Z',
  updatedAt: '2026-07-23T10:00:00.000Z',
};

const notReady: CvReadinessResult = {
  ready: false,
  missingSections: ['professional_summary'],
  completionScore: 20,
};

const ready: CvReadinessResult = {
  ready: true,
  missingSections: [],
  completionScore: 60,
};

const emptySections: CvSectionContentResult[] = [];

function educationSection(count: number): CvSectionContentResult {
  return {
    cvId: 'cv-1',
    sectionType: 'education',
    content: {
      items: Array.from({ length: count }, (_, i) => ({ institutionName: `School ${i}` })),
    },
    updatedAt: '2026-07-23T10:00:00.000Z',
  };
}

beforeEach(() => {
  vi.restoreAllMocks();
  mockUseAuth.mockReturnValue(undefined);
  mockGetAccessToken.mockReturnValue('test-token');
  mockLogout.mockResolvedValue(undefined);
  vi.mocked(mockUseAuth).mockReturnValue({
    getAccessToken: mockGetAccessToken,
    logout: mockLogout,
  });
});

function mockLoadCalls(overrides: {
  cv?: CvResult;
  readiness?: CvReadinessResult;
  sections?: CvSectionContentResult[];
  exports?: CvExportResult[];
}) {
  vi.spyOn(apiClient, 'getCv').mockResolvedValue(overrides.cv ?? baseCv);
  vi.spyOn(apiClient, 'getCvReadiness').mockResolvedValue(overrides.readiness ?? notReady);
  vi.spyOn(apiClient, 'getAllCvSections').mockResolvedValue(overrides.sections ?? emptySections);
  vi.spyOn(apiClient, 'listCvExports').mockResolvedValue(overrides.exports ?? []);
}

describe('CvEditor', () => {
  it('loads and displays CV details', async () => {
    mockLoadCalls({});
    render(<CvEditor cvId="cv-1" />);

    expect(
      await screen.findByRole('heading', { name: 'Software Engineer CV' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^title$/i)).toHaveValue('Software Engineer CV');
  });

  it('shows the not-ready banner with the missing section', async () => {
    mockLoadCalls({});
    render(<CvEditor cvId="cv-1" />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/add a professional summary/i);
  });

  it('shows the ready banner and enables export once ready', async () => {
    mockLoadCalls({ readiness: ready });
    render(<CvEditor cvId="cv-1" />);

    expect(await screen.findByText(/ready to export/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate pdf/i })).not.toBeDisabled();
  });

  it('disables Generate PDF while not ready', async () => {
    mockLoadCalls({});
    render(<CvEditor cvId="cv-1" />);

    await screen.findByRole('heading', { name: 'Software Engineer CV' });
    expect(screen.getByRole('button', { name: /generate pdf/i })).toBeDisabled();
  });

  it('saves the professional summary', async () => {
    const user = userEvent.setup();
    mockLoadCalls({});
    const updateSpy = vi.spyOn(apiClient, 'updateCvSectionContent').mockResolvedValue({
      cvId: 'cv-1',
      sectionType: 'professional_summary',
      content: { summary: 'Experienced engineer.' },
      updatedAt: '2026-07-23T10:05:00.000Z',
    });
    vi.spyOn(apiClient, 'getCvReadiness')
      .mockResolvedValueOnce(notReady)
      .mockResolvedValueOnce(ready);

    render(<CvEditor cvId="cv-1" />);
    await screen.findByRole('heading', { name: 'Software Engineer CV' });

    const textarea = screen.getByLabelText(/a short summary/i);
    await user.type(textarea, 'Experienced engineer.');
    await user.click(screen.getByRole('button', { name: /save summary/i }));

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith('test-token', 'cv-1', 'professional_summary', {
        summary: 'Experienced engineer.',
      });
    });
    expect(await screen.findByText(/^saved$/i)).toBeInTheDocument();
  });

  it('imports a section from the profile and shows the item count', async () => {
    const user = userEvent.setup();
    mockLoadCalls({});
    const importSpy = vi
      .spyOn(apiClient, 'importCvSectionFromProfile')
      .mockResolvedValue(educationSection(2));

    render(<CvEditor cvId="cv-1" />);
    await screen.findByRole('heading', { name: 'Software Engineer CV' });

    const importButtons = screen.getAllByRole('button', { name: /import from profile/i });
    await user.click(importButtons[0]);

    await waitFor(() => {
      expect(importSpy).toHaveBeenCalledWith('test-token', 'cv-1', 'education');
    });
    expect(await screen.findByText('2 entries')).toBeInTheDocument();
  });

  it('shows an error and keeps the previous state when import fails', async () => {
    const user = userEvent.setup();
    mockLoadCalls({});
    vi.spyOn(apiClient, 'importCvSectionFromProfile').mockRejectedValue(new Error('boom'));

    render(<CvEditor cvId="cv-1" />);
    await screen.findByRole('heading', { name: 'Software Engineer CV' });

    const importButtons = screen.getAllByRole('button', { name: /import from profile/i });
    await user.click(importButtons[0]);

    expect(await screen.findByText(/unable to import from your profile/i)).toBeInTheDocument();
  });

  it('toggles the live HTML preview into an iframe', async () => {
    const user = userEvent.setup();
    mockLoadCalls({ readiness: ready });
    vi.spyOn(apiClient, 'getCvExportPreviewHtml').mockResolvedValue(
      '<html><body>Preview</body></html>',
    );

    render(<CvEditor cvId="cv-1" />);
    await screen.findByRole('heading', { name: 'Software Engineer CV' });

    await user.click(screen.getByRole('button', { name: /show preview/i }));

    expect(await screen.findByTitle('CV preview')).toBeInTheDocument();
  });

  it('requests a PDF export and shows it in export history once ready', async () => {
    const user = userEvent.setup();
    mockLoadCalls({ readiness: ready });
    vi.spyOn(apiClient, 'requestCvExport').mockResolvedValue({
      id: 'exp-1',
      cvId: 'cv-1',
      status: 'PENDING',
      fileSizeBytes: null,
      failureCategory: null,
      requestedAt: '2026-07-23T11:00:00.000Z',
      generatedAt: null,
      failedAt: null,
    });
    vi.spyOn(apiClient, 'getCvExport').mockResolvedValue({
      id: 'exp-1',
      cvId: 'cv-1',
      status: 'READY',
      fileSizeBytes: 4096,
      failureCategory: null,
      requestedAt: '2026-07-23T11:00:00.000Z',
      generatedAt: '2026-07-23T11:00:02.000Z',
      failedAt: null,
    });

    render(<CvEditor cvId="cv-1" />);
    await screen.findByRole('heading', { name: 'Software Engineer CV' });

    await user.click(screen.getByRole('button', { name: /generate pdf/i }));

    expect(await screen.findByRole('button', { name: /^download$/i })).toBeInTheDocument();
  });

  it('shows a friendly message when export is requested before readiness', async () => {
    const user = userEvent.setup();
    mockLoadCalls({ readiness: ready });
    vi.spyOn(apiClient, 'requestCvExport').mockRejectedValue(
      new apiClient.ApiClientError('CV_NOT_READY_FOR_EXPORT', 400),
    );

    render(<CvEditor cvId="cv-1" />);
    await screen.findByRole('heading', { name: 'Software Engineer CV' });

    await user.click(screen.getByRole('button', { name: /generate pdf/i }));

    expect(
      await screen.findByText(/add a professional summary before generating/i),
    ).toBeInTheDocument();
  });

  it("shows an access error for a CV that is not the caller's own (IDOR)", async () => {
    vi.spyOn(apiClient, 'getCv').mockRejectedValue(
      new apiClient.ApiClientError('CV_NOT_FOUND', 404),
    );
    vi.spyOn(apiClient, 'getCvReadiness').mockResolvedValue(notReady);
    vi.spyOn(apiClient, 'getAllCvSections').mockResolvedValue(emptySections);
    vi.spyOn(apiClient, 'listCvExports').mockResolvedValue([]);

    render(<CvEditor cvId="not-mine" />);

    expect(
      await screen.findByText(/does not exist or you do not have access/i),
    ).toBeInTheDocument();
  });

  it('uses accessible section landmarks', async () => {
    mockLoadCalls({});
    render(<CvEditor cvId="cv-1" />);

    await screen.findByRole('heading', { name: 'Software Engineer CV' });
    expect(screen.getByRole('heading', { name: /professional summary/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /import from your profile/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /preview and export/i })).toBeInTheDocument();
  });
});
