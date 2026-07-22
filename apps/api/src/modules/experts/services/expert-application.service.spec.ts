import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ExpertApplicationService } from './expert-application.service';

describe('ExpertApplicationService', () => {
  let service: ExpertApplicationService;
  const repo = {
    findActiveByUserId: jest.fn(),
    createDraft: jest.fn(),
    updateStatus: jest.fn(),
  };
  const profileRepo = { findByUserId: jest.fn() };
  const readiness = { evaluate: jest.fn(), isMfaEnabled: jest.fn() };
  const audit = { recordRequired: jest.fn(), recordBestEffort: jest.fn() };

  const baseApp = (over: Record<string, unknown> = {}) => ({
    id: 'a1',
    userId: 'u1',
    expertProfileId: 'p1',
    status: 'DRAFT',
    submissionVersion: 0,
    submittedAt: null,
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
    ...over,
  });

  beforeEach(() => {
    jest.resetAllMocks();
    service = new ExpertApplicationService(
      repo as never,
      profileRepo as never,
      readiness as never,
      audit as never,
    );
  });

  describe('createApplication', () => {
    it('requires a profile first', async () => {
      profileRepo.findByUserId.mockResolvedValue(null);
      await expect(service.createApplication('u1')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects when an active application already exists', async () => {
      profileRepo.findByUserId.mockResolvedValue({ id: 'p1' });
      repo.findActiveByUserId.mockResolvedValue(baseApp());
      await expect(service.createApplication('u1')).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates a draft and audits', async () => {
      profileRepo.findByUserId.mockResolvedValue({ id: 'p1' });
      repo.findActiveByUserId.mockResolvedValue(null);
      repo.createDraft.mockResolvedValue(baseApp());
      readiness.evaluate.mockResolvedValue({ ready: false, blockers: [], summary: {} });

      const result = await service.createApplication('u1');

      expect(repo.createDraft).toHaveBeenCalledWith('u1', 'p1');
      expect(audit.recordRequired).toHaveBeenCalled();
      expect(result.application?.id).toBe('a1');
    });
  });

  describe('submit', () => {
    it('404 when no active application', async () => {
      repo.findActiveByUserId.mockResolvedValue(null);
      await expect(service.submit('u1', {})).rejects.toBeInstanceOf(NotFoundException);
    });

    it('conflict when not in a submittable status', async () => {
      repo.findActiveByUserId.mockResolvedValue(baseApp({ status: 'SUBMITTED' }));
      await expect(service.submit('u1', {})).rejects.toBeInstanceOf(ConflictException);
    });

    it('forbids submit when MFA disabled (MFA_REQUIRED_BY_POLICY)', async () => {
      repo.findActiveByUserId.mockResolvedValue(baseApp());
      readiness.isMfaEnabled.mockResolvedValue(false);

      await expect(service.submit('u1', {})).rejects.toMatchObject({
        response: { message: 'MFA_REQUIRED_BY_POLICY' },
      });
      expect(audit.recordBestEffort).toHaveBeenCalled();
    });

    it('rejects submit when readiness not met', async () => {
      repo.findActiveByUserId.mockResolvedValue(baseApp());
      readiness.isMfaEnabled.mockResolvedValue(true);
      readiness.evaluate.mockResolvedValue({
        ready: false,
        blockers: [{ code: 'MISSING_IDENTITY_DOCUMENT', message: 'x' }],
        summary: {},
      });

      await expect(service.submit('u1', {})).rejects.toBeInstanceOf(BadRequestException);
    });

    it('submits successfully and increments version', async () => {
      repo.findActiveByUserId.mockResolvedValue(baseApp({ status: 'CHANGES_REQUESTED' }));
      readiness.isMfaEnabled.mockResolvedValue(true);
      readiness.evaluate.mockResolvedValue({ ready: true, blockers: [], summary: {} });
      repo.updateStatus.mockResolvedValue(
        baseApp({ status: 'SUBMITTED', submissionVersion: 1, documents: [] }),
      );

      const result = await service.submit('u1', { applicantResponse: 'ready now' });

      expect(repo.updateStatus).toHaveBeenCalledWith(
        'a1',
        expect.objectContaining({
          status: 'SUBMITTED',
          submissionVersion: { increment: 1 },
          applicantResponse: 'ready now',
        }),
      );
      expect(result.application?.status).toBe('SUBMITTED');
    });

    it('rejects an invalid MFA case with ForbiddenException type', async () => {
      repo.findActiveByUserId.mockResolvedValue(baseApp());
      readiness.isMfaEnabled.mockResolvedValue(false);
      await expect(service.submit('u1', {})).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('withdraw', () => {
    it('404 when nothing active', async () => {
      repo.findActiveByUserId.mockResolvedValue(null);
      await expect(service.withdraw('u1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('withdraws an active application', async () => {
      repo.findActiveByUserId.mockResolvedValue(baseApp({ status: 'SUBMITTED' }));
      repo.updateStatus.mockResolvedValue(baseApp({ status: 'WITHDRAWN' }));

      const result = await service.withdraw('u1');

      expect(repo.updateStatus).toHaveBeenCalledWith(
        'a1',
        expect.objectContaining({ status: 'WITHDRAWN' }),
      );
      expect(result.application?.status).toBe('WITHDRAWN');
      expect(audit.recordRequired).toHaveBeenCalled();
    });
  });
});
