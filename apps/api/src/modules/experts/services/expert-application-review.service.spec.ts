import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ExpertApplicationReviewService } from './expert-application-review.service';

describe('ExpertApplicationReviewService', () => {
  let service: ExpertApplicationReviewService;
  const appRepo = {
    findByIdWithProfile: jest.fn(),
    updateStatus: jest.fn(),
    approveWithRoleAssignment: jest.fn(),
    listForReview: jest.fn(),
  };
  const docRepo = { findByStorageKey: jest.fn() };
  const storage = {
    createSignedUrl: jest.fn(),
    verifySignedUrl: jest.fn(),
    read: jest.fn(),
  };
  const audit = { recordRequired: jest.fn(), recordBestEffort: jest.fn() };

  const app = (over: Record<string, unknown> = {}) => ({
    id: 'a1',
    userId: 'u1',
    expertProfileId: 'p1',
    status: 'SUBMITTED',
    submissionVersion: 1,
    submittedAt: new Date(),
    reviewStartedAt: null,
    reviewedAt: null,
    decisionReasonCode: null,
    reviewerNote: null,
    applicantResponse: null,
    approvedAt: null,
    rejectedAt: null,
    withdrawnAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    documents: [],
    expertProfile: { countryId: 'c1' },
    user: { id: 'u1', email: 'a@b.com', candidateProfile: { fullName: 'Jane Doe' } },
    ...over,
  });

  beforeEach(() => {
    jest.resetAllMocks();
    service = new ExpertApplicationReviewService(
      appRepo as never,
      docRepo as never,
      storage as never,
      audit as never,
    );
  });

  describe('approve', () => {
    it('404 when application missing', async () => {
      appRepo.findByIdWithProfile.mockResolvedValue(null);
      await expect(service.approve('r1', 'a1', {})).rejects.toBeInstanceOf(NotFoundException);
    });

    it('conflict when already approved', async () => {
      appRepo.findByIdWithProfile.mockResolvedValue(app({ status: 'APPROVED' }));
      await expect(service.approve('r1', 'a1', {})).rejects.toBeInstanceOf(ConflictException);
    });

    it('conflict when not in a reviewable status', async () => {
      appRepo.findByIdWithProfile.mockResolvedValue(app({ status: 'DRAFT' }));
      await expect(service.approve('r1', 'a1', {})).rejects.toBeInstanceOf(ConflictException);
    });

    it('approves and assigns role transactionally', async () => {
      appRepo.findByIdWithProfile
        .mockResolvedValueOnce(app())
        .mockResolvedValueOnce(app({ status: 'APPROVED' }));
      appRepo.approveWithRoleAssignment.mockResolvedValue({ roleNewlyAssigned: true });

      const result = await service.approve('r1', 'a1', { reviewerNote: 'welcome' });

      expect(appRepo.approveWithRoleAssignment).toHaveBeenCalledWith(
        expect.objectContaining({ applicationId: 'a1', userId: 'u1', reviewerId: 'r1' }),
      );
      // The frontend replaces its whole `detail` state with this response, so
      // it must be the same flat shape as getDetail — not nested under `.application`.
      expect(result.status).toBe('APPROVED');
      expect(result.applicant).toEqual({ displayName: 'Jane Doe', countryId: 'c1' });
      expect(result.profile).toBeDefined();
      expect(result.documents).toEqual([]);
      expect(audit.recordRequired).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'expert.application.approved' }),
      );
    });
  });

  describe('reject', () => {
    it('requires reasonCode + note', async () => {
      appRepo.findByIdWithProfile.mockResolvedValue(app());
      await expect(service.reject('r1', 'a1', {})).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects with reason and audits', async () => {
      appRepo.findByIdWithProfile
        .mockResolvedValueOnce(app())
        .mockResolvedValueOnce(app({ status: 'REJECTED' }));
      appRepo.updateStatus.mockResolvedValue(app({ status: 'REJECTED' }));

      const result = await service.reject('r1', 'a1', {
        reasonCode: 'INSUFFICIENT_EXPERIENCE',
        reviewerNote: 'need more years',
      });

      expect(appRepo.updateStatus).toHaveBeenCalledWith(
        'a1',
        expect.objectContaining({
          status: 'REJECTED',
          decisionReasonCode: 'INSUFFICIENT_EXPERIENCE',
        }),
      );
      // Flat shape, same as getDetail/approve — not nested under `.application`.
      expect(result.status).toBe('REJECTED');
      expect(result.applicant).toEqual({ displayName: 'Jane Doe', countryId: 'c1' });
      expect(result.profile).toBeDefined();
    });
  });

  describe('requestChanges', () => {
    it('requires a note', async () => {
      appRepo.findByIdWithProfile.mockResolvedValue(app());
      await expect(service.requestChanges('r1', 'a1', {})).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('transitions to CHANGES_REQUESTED', async () => {
      appRepo.findByIdWithProfile
        .mockResolvedValueOnce(app())
        .mockResolvedValueOnce(app({ status: 'CHANGES_REQUESTED' }));
      appRepo.updateStatus.mockResolvedValue(app({ status: 'CHANGES_REQUESTED' }));

      const result = await service.requestChanges('r1', 'a1', { reviewerNote: 'fix docs' });

      expect(result.status).toBe('CHANGES_REQUESTED');
      expect(result.profile).toBeDefined();
    });
  });

  describe('getDetail', () => {
    it('returns a flat detail shape with applicant.displayName sourced from the candidate profile', async () => {
      appRepo.findByIdWithProfile.mockResolvedValue(app());

      const result = await service.getDetail('r1', 'a1');

      expect(result.status).toBe('SUBMITTED');
      expect(result.applicant).toEqual({ displayName: 'Jane Doe', countryId: 'c1' });
      expect(result.profile).toEqual({ countryId: 'c1' });
      expect(audit.recordBestEffort).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'expert.application.review_viewed' }),
      );
    });

    it('falls back to email when the applicant has no candidate profile name', async () => {
      appRepo.findByIdWithProfile.mockResolvedValue(
        app({ user: { id: 'u1', email: 'a@b.com', candidateProfile: null } }),
      );
      const result = await service.getDetail('r1', 'a1');
      expect(result.applicant.displayName).toBe('a@b.com');
    });

    it('404 when application missing', async () => {
      appRepo.findByIdWithProfile.mockResolvedValue(null);
      await expect(service.getDetail('r1', 'a1')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('startReview', () => {
    it('moves a SUBMITTED application to UNDER_REVIEW and returns the flat detail shape', async () => {
      appRepo.findByIdWithProfile
        .mockResolvedValueOnce(app({ status: 'SUBMITTED' }))
        .mockResolvedValueOnce(app({ status: 'UNDER_REVIEW' }));

      const result = await service.startReview('r1', 'a1');

      expect(appRepo.updateStatus).toHaveBeenCalledWith(
        'a1',
        expect.objectContaining({ status: 'UNDER_REVIEW' }),
      );
      expect(result.status).toBe('UNDER_REVIEW');
      expect(audit.recordBestEffort).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'expert.application.review_started' }),
      );
    });

    it('rejects starting review on a non-SUBMITTED application', async () => {
      appRepo.findByIdWithProfile.mockResolvedValue(app({ status: 'UNDER_REVIEW' }));
      await expect(service.startReview('r1', 'a1')).rejects.toBeInstanceOf(ConflictException);
    });

    it('404 when application missing', async () => {
      appRepo.findByIdWithProfile.mockResolvedValue(null);
      await expect(service.startReview('r1', 'a1')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('resolveSignedDocument', () => {
    it('404 on invalid signature', async () => {
      storage.verifySignedUrl.mockReturnValue(false);
      await expect(service.resolveSignedDocument('k', 1, 'sig')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('404 when document removed', async () => {
      storage.verifySignedUrl.mockReturnValue(true);
      docRepo.findByStorageKey.mockResolvedValue({ removedAt: new Date() });
      await expect(service.resolveSignedDocument('k', 1, 'sig')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('returns buffer + mime for a valid token', async () => {
      storage.verifySignedUrl.mockReturnValue(true);
      docRepo.findByStorageKey.mockResolvedValue({
        removedAt: null,
        mimeType: 'application/pdf',
        originalFileName: 'id.pdf',
      });
      storage.read.mockResolvedValue(Buffer.from('pdf'));

      const result = await service.resolveSignedDocument('k', 1, 'sig');
      expect(result.mimeType).toBe('application/pdf');
      expect(result.buffer).toBeInstanceOf(Buffer);
    });
  });

  describe('list', () => {
    it('maps paginated queue results', async () => {
      appRepo.listForReview.mockResolvedValue({
        total: 1,
        rows: [
          {
            id: 'a1',
            userId: 'u1',
            expertProfileId: 'p1',
            status: 'SUBMITTED',
            submissionVersion: 1,
            submittedAt: new Date('2026-07-01T00:00:00.000Z'),
            expertProfile: {
              professionalTitle: 'Engineer',
              yearsOfExperience: 5,
              countryId: 'c1',
            },
            _count: { documents: 3 },
          },
        ],
      });

      const result = await service.list({ page: 1, pageSize: 20 });
      expect(result.pagination.total).toBe(1);
      const first = result.data[0]!;
      expect(first.documentCount).toBe(3);
      expect(first.profile.professionalTitle).toBe('Engineer');
    });
  });
});
