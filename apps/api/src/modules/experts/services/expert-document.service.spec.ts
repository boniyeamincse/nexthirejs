import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { ExpertDocumentService } from './expert-document.service';
import { EXPERT_LIMITS } from '@nexthire/constants';

const PDF_BYTES = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]);

describe('ExpertDocumentService', () => {
  let service: ExpertDocumentService;
  const appRepo = { findActiveByUserId: jest.fn() };
  const docRepo = {
    countActive: jest.fn(),
    listActive: jest.fn(),
    findActiveById: jest.fn(),
    create: jest.fn(),
    softRemove: jest.fn(),
  };
  const storage = { generateKey: jest.fn(), put: jest.fn(), delete: jest.fn() };
  const audit = { recordRequired: jest.fn() };

  const file = (over: Record<string, unknown> = {}) => ({
    buffer: PDF_BYTES,
    mimetype: 'application/pdf',
    originalname: 'id.pdf',
    size: PDF_BYTES.length,
    ...over,
  });

  beforeEach(() => {
    jest.resetAllMocks();
    service = new ExpertDocumentService(
      appRepo as never,
      docRepo as never,
      storage as never,
      audit as never,
    );
    appRepo.findActiveByUserId.mockResolvedValue({ id: 'a1', status: 'DRAFT' });
    storage.delete.mockResolvedValue(undefined);
  });

  it('404 when no active application', async () => {
    appRepo.findActiveByUserId.mockResolvedValue(null);
    await expect(service.upload('u1', { type: 'GOVERNMENT_ID' }, file())).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('conflict when application not editable', async () => {
    appRepo.findActiveByUserId.mockResolvedValue({ id: 'a1', status: 'SUBMITTED' });
    await expect(service.upload('u1', { type: 'GOVERNMENT_ID' }, file())).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('rejects invalid document type metadata', async () => {
    await expect(service.upload('u1', { type: 'NOT_A_TYPE' }, file())).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects missing file', async () => {
    await expect(service.upload('u1', { type: 'GOVERNMENT_ID' }, undefined)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects oversized files', async () => {
    await expect(
      service.upload(
        'u1',
        { type: 'GOVERNMENT_ID' },
        file({ size: EXPERT_LIMITS.MAX_DOCUMENT_SIZE_BYTES + 1 }),
      ),
    ).rejects.toBeInstanceOf(PayloadTooLargeException);
  });

  it('rejects when document limit reached', async () => {
    docRepo.countActive.mockResolvedValue(EXPERT_LIMITS.MAX_DOCUMENTS);
    await expect(service.upload('u1', { type: 'GOVERNMENT_ID' }, file())).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('rejects spoofed content (magic bytes mismatch)', async () => {
    docRepo.countActive.mockResolvedValue(0);
    await expect(
      service.upload(
        'u1',
        { type: 'GOVERNMENT_ID' },
        file({ buffer: Buffer.from('plain text'), mimetype: 'application/pdf' }),
      ),
    ).rejects.toBeInstanceOf(UnsupportedMediaTypeException);
  });

  it('stores a valid document and audits without leaking filename bytes', async () => {
    docRepo.countActive.mockResolvedValue(0);
    storage.generateKey.mockReturnValue('applications/a1/key');
    storage.put.mockResolvedValue({
      storageKey: 'applications/a1/key',
      sizeBytes: PDF_BYTES.length,
      checksumSha256: 'abc',
    });
    docRepo.create.mockResolvedValue({
      id: 'd1',
      applicationId: 'a1',
      type: 'GOVERNMENT_ID',
      originalFileName: 'id.pdf',
      mimeType: 'application/pdf',
      sizeBytes: BigInt(PDF_BYTES.length),
      uploadedAt: new Date(),
      removedAt: null,
    });

    const result = await service.upload('u1', { type: 'GOVERNMENT_ID' }, file());

    expect(result.id).toBe('d1');
    expect(storage.put).toHaveBeenCalled();
    const auditArg = audit.recordRequired.mock.calls[0][0];
    expect(JSON.stringify(auditArg.metadata)).not.toContain('id.pdf');
    expect(auditArg.metadata.documentType).toBe('GOVERNMENT_ID');
  });

  it('rolls back stored object if DB insert fails', async () => {
    docRepo.countActive.mockResolvedValue(0);
    storage.generateKey.mockReturnValue('applications/a1/key');
    storage.put.mockResolvedValue({
      storageKey: 'applications/a1/key',
      sizeBytes: PDF_BYTES.length,
      checksumSha256: 'abc',
    });
    docRepo.create.mockRejectedValue(new Error('db down'));

    await expect(service.upload('u1', { type: 'GOVERNMENT_ID' }, file())).rejects.toThrow(
      'db down',
    );
    expect(storage.delete).toHaveBeenCalledWith('applications/a1/key');
  });

  describe('remove', () => {
    it('404 when document not found', async () => {
      docRepo.findActiveById.mockResolvedValue(null);
      await expect(service.remove('u1', 'd1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('soft removes and deletes from storage', async () => {
      docRepo.findActiveById.mockResolvedValue({
        id: 'd1',
        storageKey: 'applications/a1/key',
        type: 'GOVERNMENT_ID',
      });
      docRepo.softRemove.mockResolvedValue({});

      const result = await service.remove('u1', 'd1');

      expect(result).toEqual({ removed: true });
      expect(docRepo.softRemove).toHaveBeenCalledWith('d1', expect.any(Date));
      expect(storage.delete).toHaveBeenCalledWith('applications/a1/key');
    });
  });
});
