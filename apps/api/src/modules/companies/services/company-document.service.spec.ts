import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { CompanyDocumentService } from './company-document.service';

const PDF_BUFFER = Buffer.concat([Buffer.from([0x25, 0x50, 0x44, 0x46]), Buffer.from('rest')]);

describe('CompanyDocumentService', () => {
  let service: CompanyDocumentService;
  const companyRepository = { findByOwnerUserId: jest.fn() };
  const applicationRepository = { findActiveByCompanyId: jest.fn() };
  const documentRepository = {
    countActive: jest.fn(),
    listActive: jest.fn(),
    findActiveById: jest.fn(),
    create: jest.fn(),
    softRemove: jest.fn(),
  };
  const storage = {
    generateKey: jest.fn().mockReturnValue('applications/app-1/key'),
    put: jest.fn(),
    delete: jest.fn().mockResolvedValue(undefined),
  };
  const audit = { recordRequired: jest.fn() };

  const DRAFT_APPLICATION = { id: 'app-1', status: 'DRAFT' };

  beforeEach(() => {
    jest.resetAllMocks();
    storage.generateKey.mockReturnValue('applications/app-1/key');
    storage.delete.mockResolvedValue(undefined);
    service = new CompanyDocumentService(
      companyRepository as never,
      applicationRepository as never,
      documentRepository as never,
      storage as never,
      audit as never,
    );
  });

  describe('listMyDocuments', () => {
    it('404s when there is no company yet', async () => {
      companyRepository.findByOwnerUserId.mockResolvedValue(null);
      await expect(service.listMyDocuments('u1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('lists active documents for the active application', async () => {
      companyRepository.findByOwnerUserId.mockResolvedValue({ id: 'c1' });
      applicationRepository.findActiveByCompanyId.mockResolvedValue(DRAFT_APPLICATION);
      documentRepository.listActive.mockResolvedValue([
        {
          id: 'doc-1',
          applicationId: 'app-1',
          type: 'BUSINESS_REGISTRATION',
          originalFileName: 'reg.pdf',
          mimeType: 'application/pdf',
          sizeBytes: BigInt(4),
          uploadedAt: new Date(),
          removedAt: null,
        },
      ]);

      const result = await service.listMyDocuments('u1');
      expect(result).toHaveLength(1);
    });
  });

  describe('upload', () => {
    const file = {
      buffer: PDF_BUFFER,
      mimetype: 'application/pdf',
      originalname: 'reg.pdf',
      size: PDF_BUFFER.length,
    };

    beforeEach(() => {
      companyRepository.findByOwnerUserId.mockResolvedValue({ id: 'c1' });
      applicationRepository.findActiveByCompanyId.mockResolvedValue(DRAFT_APPLICATION);
    });

    it('rejects when the application is not editable', async () => {
      applicationRepository.findActiveByCompanyId.mockResolvedValue({
        id: 'app-1',
        status: 'SUBMITTED',
      });
      await expect(
        service.upload('u1', { type: 'BUSINESS_REGISTRATION' }, file),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects invalid metadata', async () => {
      await expect(service.upload('u1', { type: 'NOT_A_TYPE' }, file)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects a missing file', async () => {
      await expect(
        service.upload('u1', { type: 'BUSINESS_REGISTRATION' }, undefined),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects an oversized file', async () => {
      await expect(
        service.upload('u1', { type: 'BUSINESS_REGISTRATION' }, { ...file, size: 999_999_999 }),
      ).rejects.toBeInstanceOf(PayloadTooLargeException);
    });

    it('rejects when the document count limit is reached', async () => {
      documentRepository.countActive.mockResolvedValue(10);
      await expect(
        service.upload('u1', { type: 'BUSINESS_REGISTRATION' }, file),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects a file whose magic bytes do not match the declared MIME type', async () => {
      documentRepository.countActive.mockResolvedValue(0);
      const fakeFile = {
        ...file,
        buffer: Buffer.from('not a real pdf'),
        mimetype: 'application/pdf',
      };
      await expect(
        service.upload('u1', { type: 'BUSINESS_REGISTRATION' }, fakeFile),
      ).rejects.toBeInstanceOf(UnsupportedMediaTypeException);
    });

    it('stores a valid document and returns the mapped result', async () => {
      documentRepository.countActive.mockResolvedValue(0);
      storage.put.mockResolvedValue({
        storageKey: 'applications/app-1/key',
        sizeBytes: file.size,
        checksumSha256: 'abc',
      });
      documentRepository.create.mockResolvedValue({
        id: 'doc-1',
        applicationId: 'app-1',
        type: 'BUSINESS_REGISTRATION',
        originalFileName: 'reg.pdf',
        mimeType: 'application/pdf',
        sizeBytes: BigInt(file.size),
        uploadedAt: new Date(),
        removedAt: null,
      });

      const result = await service.upload('u1', { type: 'BUSINESS_REGISTRATION' }, file);

      expect(result.id).toBe('doc-1');
      expect(audit.recordRequired).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'company.application.document_uploaded' }),
      );
    });

    it('rolls back the stored object if the DB write fails', async () => {
      documentRepository.countActive.mockResolvedValue(0);
      storage.put.mockResolvedValue({
        storageKey: 'applications/app-1/key',
        sizeBytes: file.size,
        checksumSha256: 'abc',
      });
      documentRepository.create.mockRejectedValue(new Error('db down'));

      await expect(service.upload('u1', { type: 'BUSINESS_REGISTRATION' }, file)).rejects.toThrow(
        'db down',
      );
      expect(storage.delete).toHaveBeenCalledWith('applications/app-1/key');
    });
  });

  describe('remove', () => {
    it('404s when the document does not exist', async () => {
      companyRepository.findByOwnerUserId.mockResolvedValue({ id: 'c1' });
      applicationRepository.findActiveByCompanyId.mockResolvedValue(DRAFT_APPLICATION);
      documentRepository.findActiveById.mockResolvedValue(null);
      await expect(service.remove('u1', 'doc-1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('soft-removes the document and deletes the stored object', async () => {
      companyRepository.findByOwnerUserId.mockResolvedValue({ id: 'c1' });
      applicationRepository.findActiveByCompanyId.mockResolvedValue(DRAFT_APPLICATION);
      documentRepository.findActiveById.mockResolvedValue({
        id: 'doc-1',
        storageKey: 'applications/app-1/key',
        type: 'BUSINESS_REGISTRATION',
      });

      const result = await service.remove('u1', 'doc-1');

      expect(result).toEqual({ removed: true });
      expect(documentRepository.softRemove).toHaveBeenCalledWith('doc-1', expect.any(Date));
      expect(storage.delete).toHaveBeenCalledWith('applications/app-1/key');
    });
  });
});
