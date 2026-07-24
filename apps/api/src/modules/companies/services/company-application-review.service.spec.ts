import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { CompanyApplicationReviewService } from './company-application-review.service';

describe('CompanyApplicationReviewService', () => {
  let service: CompanyApplicationReviewService;
  const applicationRepository = {
    listForReview: jest.fn(),
    findByIdWithCompany: jest.fn(),
    updateStatus: jest.fn(),
    approveWithRoleAssignment: jest.fn(),
  };
  const documentRepository = { findByStorageKey: jest.fn() };
  const storage = {
    createSignedUrl: jest.fn().mockReturnValue({ url: '/signed', expiresAt: 'later' }),
    verifySignedUrl: jest.fn(),
    read: jest.fn(),
  };
  const audit = { recordRequired: jest.fn(), recordBestEffort: jest.fn() };

  const SUBMITTED_APPLICATION = {
    id: 'app-1',
    companyId: 'c1',
    status: 'SUBMITTED',
    documents: [],
    reviewStartedAt: null,
    company: { ownerUserId: 'owner-1', name: 'Acme', headquartersCountryId: 'country-1' },
    createdAt: new Date('2026-08-01T00:00:00.000Z'),
    updatedAt: new Date('2026-08-01T00:00:00.000Z'),
  };

  beforeEach(() => {
    jest.resetAllMocks();
    storage.createSignedUrl.mockReturnValue({ url: '/signed', expiresAt: 'later' });
    service = new CompanyApplicationReviewService(
      applicationRepository as never,
      documentRepository as never,
      storage as never,
      audit as never,
    );
  });

  describe('list', () => {
    it('maps rows into the paginated queue shape', async () => {
      applicationRepository.listForReview.mockResolvedValue({
        total: 1,
        rows: [
          {
            id: 'app-1',
            companyId: 'c1',
            status: 'SUBMITTED',
            submissionVersion: 1,
            submittedAt: new Date('2026-08-01T00:00:00.000Z'),
            _count: { documents: 2 },
            company: { name: 'Acme', industry: 'Tech', headquartersCountryId: 'country-1' },
          },
        ],
      });

      const result = await service.list({ page: 1, pageSize: 20 });

      expect(result.data[0]).toEqual(
        expect.objectContaining({
          id: 'app-1',
          documentCount: 2,
          company: expect.objectContaining({ name: 'Acme' }),
        }),
      );
    });
  });

  describe('getDetail / startReview', () => {
    it('404s when the application does not exist', async () => {
      applicationRepository.findByIdWithCompany.mockResolvedValue(null);
      await expect(service.getDetail('reviewer-1', 'app-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('rejects starting review on a non-SUBMITTED application', async () => {
      applicationRepository.findByIdWithCompany.mockResolvedValue({
        ...SUBMITTED_APPLICATION,
        status: 'DRAFT',
      });
      await expect(service.startReview('reviewer-1', 'app-1')).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('moves a submitted application into under-review', async () => {
      applicationRepository.findByIdWithCompany
        .mockResolvedValueOnce(SUBMITTED_APPLICATION)
        .mockResolvedValueOnce({ ...SUBMITTED_APPLICATION, status: 'UNDER_REVIEW' });

      const result = await service.startReview('reviewer-1', 'app-1');

      expect(applicationRepository.updateStatus).toHaveBeenCalledWith(
        'app-1',
        expect.objectContaining({ status: 'UNDER_REVIEW' }),
      );
      expect(result.status).toBe('UNDER_REVIEW');
    });
  });

  describe('approve', () => {
    it('rejects invalid body', async () => {
      await expect(
        service.approve('reviewer-1', 'app-1', { reviewerNote: 123 }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects approving an already-approved application', async () => {
      applicationRepository.findByIdWithCompany.mockResolvedValue({
        ...SUBMITTED_APPLICATION,
        status: 'APPROVED',
      });
      await expect(service.approve('reviewer-1', 'app-1', {})).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('approves and assigns the company role to the owner', async () => {
      applicationRepository.findByIdWithCompany
        .mockResolvedValueOnce(SUBMITTED_APPLICATION)
        .mockResolvedValueOnce({ ...SUBMITTED_APPLICATION, status: 'APPROVED' });
      applicationRepository.approveWithRoleAssignment.mockResolvedValue({
        roleNewlyAssigned: true,
      });

      const result = await service.approve('reviewer-1', 'app-1', {});

      expect(applicationRepository.approveWithRoleAssignment).toHaveBeenCalledWith(
        expect.objectContaining({ applicationId: 'app-1', ownerUserId: 'owner-1' }),
      );
      expect(result.roleAssigned).toBe(true);
      expect(result.status).toBe('APPROVED');
    });
  });

  describe('reject', () => {
    it('requires a reason code and reviewer note', async () => {
      await expect(service.reject('reviewer-1', 'app-1', {})).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects the application with a reason', async () => {
      applicationRepository.findByIdWithCompany.mockResolvedValue(SUBMITTED_APPLICATION);

      await service.reject('reviewer-1', 'app-1', {
        reasonCode: 'INVALID_DOCUMENTS',
        reviewerNote: 'Missing registration certificate',
      });

      expect(applicationRepository.updateStatus).toHaveBeenCalledWith(
        'app-1',
        expect.objectContaining({ status: 'REJECTED', decisionReasonCode: 'INVALID_DOCUMENTS' }),
      );
    });
  });

  describe('requestChanges', () => {
    it('requires a reviewer note', async () => {
      await expect(service.requestChanges('reviewer-1', 'app-1', {})).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('moves the application to CHANGES_REQUESTED', async () => {
      applicationRepository.findByIdWithCompany.mockResolvedValue(SUBMITTED_APPLICATION);

      await service.requestChanges('reviewer-1', 'app-1', { reviewerNote: 'Please fix X' });

      expect(applicationRepository.updateStatus).toHaveBeenCalledWith(
        'app-1',
        expect.objectContaining({ status: 'CHANGES_REQUESTED' }),
      );
    });
  });

  describe('resolveSignedDocument', () => {
    it('404s on an invalid signature', async () => {
      storage.verifySignedUrl.mockReturnValue(false);
      await expect(service.resolveSignedDocument('key', 123, 'sig')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('404s when the document was removed', async () => {
      storage.verifySignedUrl.mockReturnValue(true);
      documentRepository.findByStorageKey.mockResolvedValue({ removedAt: new Date() });
      await expect(service.resolveSignedDocument('key', 123, 'sig')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('streams the document when the signature is valid', async () => {
      storage.verifySignedUrl.mockReturnValue(true);
      documentRepository.findByStorageKey.mockResolvedValue({
        removedAt: null,
        mimeType: 'application/pdf',
        originalFileName: 'reg.pdf',
      });
      storage.read.mockResolvedValue(Buffer.from('data'));

      const result = await service.resolveSignedDocument('key', 123, 'sig');
      expect(result.fileName).toBe('reg.pdf');
    });
  });
});
