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
    expertProfile: {},
    user: { id: 'u1', email: 'a@b.com' },
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
      expect(result.application.status).toBe('APPROVED');
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
      appRepo.findByIdWithProfile.mockResolvedValue(app());
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
      expect(result.application.status).toBe('REJECTED');
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
      appRepo.findByIdWithProfile.mockResolvedValue(app());
      appRepo.updateStatus.mockResolvedValue(app({ status: 'CHANGES_REQUESTED' }));

      const result = await service.requestChanges('r1', 'a1', { reviewerNote: 'fix docs' });

      expect(result.application.status).toBe('CHANGES_REQUESTED');
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
      expect(result.data[0].documentCount).toBe(3);
      expect(result.data[0].profile.professionalTitle).toBe('Engineer');
    });
  });
});
