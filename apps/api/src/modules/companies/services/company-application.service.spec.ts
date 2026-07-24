import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { CompanyApplicationService } from './company-application.service';

describe('CompanyApplicationService', () => {
  let service: CompanyApplicationService;
  const repository = {
    findActiveByCompanyId: jest.fn(),
    createDraft: jest.fn(),
    updateStatus: jest.fn(),
  };
  const companyRepository = { findByOwnerUserId: jest.fn() };
  const readinessService = { evaluate: jest.fn(), isMfaEnabled: jest.fn() };
  const audit = { recordRequired: jest.fn(), recordBestEffort: jest.fn() };

  const DRAFT_APPLICATION = {
    id: 'app-1',
    companyId: 'c1',
    status: 'DRAFT',
    documents: [],
    applicantResponse: null,
    createdAt: new Date('2026-08-01T00:00:00.000Z'),
    updatedAt: new Date('2026-08-01T00:00:00.000Z'),
  };

  beforeEach(() => {
    jest.resetAllMocks();
    service = new CompanyApplicationService(
      repository as never,
      companyRepository as never,
      readinessService as never,
      audit as never,
    );
  });

  describe('getMyApplication', () => {
    it('returns nulls when the user has no company yet', async () => {
      companyRepository.findByOwnerUserId.mockResolvedValue(null);
      const result = await service.getMyApplication('u1');
      expect(result).toEqual({ application: null, documents: [], readiness: null });
    });

    it('returns readiness-only when the company has no active application', async () => {
      companyRepository.findByOwnerUserId.mockResolvedValue({ id: 'c1' });
      repository.findActiveByCompanyId.mockResolvedValue(null);
      readinessService.evaluate.mockResolvedValue({ ready: false, blockers: [], summary: {} });

      const result = await service.getMyApplication('u1');

      expect(result.application).toBeNull();
      expect(readinessService.evaluate).toHaveBeenCalledWith({ ownerUserId: 'u1', applicationId: null });
    });

    it('returns the mapped application when one is active', async () => {
      companyRepository.findByOwnerUserId.mockResolvedValue({ id: 'c1' });
      repository.findActiveByCompanyId.mockResolvedValue(DRAFT_APPLICATION);
      readinessService.evaluate.mockResolvedValue({ ready: false, blockers: [], summary: {} });

      const result = await service.getMyApplication('u1');

      expect(result.application?.id).toBe('app-1');
    });
  });

  describe('createApplication', () => {
    it('rejects when there is no company profile yet', async () => {
      companyRepository.findByOwnerUserId.mockResolvedValue(null);
      await expect(service.createApplication('u1')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects when an application is already active', async () => {
      companyRepository.findByOwnerUserId.mockResolvedValue({ id: 'c1' });
      repository.findActiveByCompanyId.mockResolvedValue(DRAFT_APPLICATION);
      await expect(service.createApplication('u1')).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates a draft application', async () => {
      companyRepository.findByOwnerUserId.mockResolvedValue({ id: 'c1' });
      repository.findActiveByCompanyId.mockResolvedValue(null);
      repository.createDraft.mockResolvedValue(DRAFT_APPLICATION);
      readinessService.evaluate.mockResolvedValue({ ready: false, blockers: [], summary: {} });

      const result = await service.createApplication('u1');

      expect(repository.createDraft).toHaveBeenCalledWith('c1');
      expect(result.application?.status).toBe('DRAFT');
    });
  });

  describe('submit', () => {
    it('404s when there is no active application', async () => {
      companyRepository.findByOwnerUserId.mockResolvedValue({ id: 'c1' });
      repository.findActiveByCompanyId.mockResolvedValue(null);
      await expect(service.submit('u1', {})).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects submitting from a non-submittable status', async () => {
      companyRepository.findByOwnerUserId.mockResolvedValue({ id: 'c1' });
      repository.findActiveByCompanyId.mockResolvedValue({ ...DRAFT_APPLICATION, status: 'SUBMITTED' });
      await expect(service.submit('u1', {})).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects when MFA is not enabled', async () => {
      companyRepository.findByOwnerUserId.mockResolvedValue({ id: 'c1' });
      repository.findActiveByCompanyId.mockResolvedValue(DRAFT_APPLICATION);
      readinessService.isMfaEnabled.mockResolvedValue(false);

      await expect(service.submit('u1', {})).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects when readiness is not met', async () => {
      companyRepository.findByOwnerUserId.mockResolvedValue({ id: 'c1' });
      repository.findActiveByCompanyId.mockResolvedValue(DRAFT_APPLICATION);
      readinessService.isMfaEnabled.mockResolvedValue(true);
      readinessService.evaluate.mockResolvedValue({ ready: false, blockers: [{ code: 'X' }], summary: {} });

      await expect(service.submit('u1', {})).rejects.toBeInstanceOf(BadRequestException);
    });

    it('submits successfully when ready', async () => {
      companyRepository.findByOwnerUserId.mockResolvedValue({ id: 'c1' });
      repository.findActiveByCompanyId.mockResolvedValue(DRAFT_APPLICATION);
      readinessService.isMfaEnabled.mockResolvedValue(true);
      readinessService.evaluate.mockResolvedValue({ ready: true, blockers: [], summary: {} });
      repository.updateStatus.mockResolvedValue({
        ...DRAFT_APPLICATION,
        status: 'SUBMITTED',
        submissionVersion: 1,
      });

      const result = await service.submit('u1', {});

      expect(repository.updateStatus).toHaveBeenCalledWith(
        'app-1',
        expect.objectContaining({ status: 'SUBMITTED' }),
      );
      expect(result.application?.status).toBe('SUBMITTED');
    });
  });

  describe('withdraw', () => {
    it('404s when there is no active application', async () => {
      companyRepository.findByOwnerUserId.mockResolvedValue({ id: 'c1' });
      repository.findActiveByCompanyId.mockResolvedValue(null);
      await expect(service.withdraw('u1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('withdraws an active application', async () => {
      companyRepository.findByOwnerUserId.mockResolvedValue({ id: 'c1' });
      repository.findActiveByCompanyId.mockResolvedValue(DRAFT_APPLICATION);
      repository.updateStatus.mockResolvedValue({ ...DRAFT_APPLICATION, status: 'WITHDRAWN' });

      const result = await service.withdraw('u1');

      expect(result.application?.status).toBe('WITHDRAWN');
    });
  });
});
