import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { ExpertApplicationRepository } from '../repositories/expert-application.repository';
import { ExpertDocumentRepository } from '../repositories/expert-document.repository';
import { ExpertDocumentStorageService } from './expert-document-storage.service';
import { AuditService } from '../../audit/audit.service';
import { uploadDocumentMetadataSchema } from '@nexthire/validation';
import { EXPERT_ERROR_CODES, EXPERT_LIMITS } from '@nexthire/constants';
import { AuditActorType, AuditOutcome } from '@nexthire/types';
import type { ExpertVerificationDocumentResult } from '@nexthire/types';
import { verifyFileSignature } from '../shared/file-signature.util';
import { mapDocument } from '../shared/expert-mappers';

/** Documents may only be mutated while the application is applicant-editable. */
const DOCUMENT_EDITABLE_STATUSES = ['DRAFT', 'CHANGES_REQUESTED'];

export interface UploadedFileLike {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

@Injectable()
export class ExpertDocumentService {
  constructor(
    private readonly applicationRepository: ExpertApplicationRepository,
    private readonly documentRepository: ExpertDocumentRepository,
    private readonly storage: ExpertDocumentStorageService,
    private readonly auditService: AuditService,
  ) {}

  private async getEditableApplication(userId: string) {
    const application = await this.applicationRepository.findActiveByUserId(userId);
    if (!application) {
      throw new NotFoundException(EXPERT_ERROR_CODES.APPLICATION_NOT_FOUND);
    }
    if (!DOCUMENT_EDITABLE_STATUSES.includes(application.status)) {
      throw new ConflictException(EXPERT_ERROR_CODES.APPLICATION_TRANSITION_INVALID);
    }
    return application;
  }

  async listMyDocuments(userId: string): Promise<ExpertVerificationDocumentResult[]> {
    const application = await this.applicationRepository.findActiveByUserId(userId);
    if (!application) {
      throw new NotFoundException(EXPERT_ERROR_CODES.APPLICATION_NOT_FOUND);
    }
    const docs = await this.documentRepository.listActive(application.id);
    return docs.map(mapDocument);
  }

  async upload(
    userId: string,
    metadata: unknown,
    file: UploadedFileLike | undefined,
    context?: { ipAddress?: string },
  ): Promise<ExpertVerificationDocumentResult> {
    const application = await this.getEditableApplication(userId);

    const parsed = uploadDocumentMetadataSchema.safeParse(metadata ?? {});
    if (!parsed.success) {
      throw new BadRequestException({
        code: EXPERT_ERROR_CODES.VERIFICATION_DOCUMENT_INVALID,
        details: parsed.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      });
    }

    if (!file || !file.buffer || file.size === 0) {
      throw new BadRequestException(EXPERT_ERROR_CODES.VERIFICATION_DOCUMENT_INVALID);
    }

    if (file.size > EXPERT_LIMITS.MAX_DOCUMENT_SIZE_BYTES) {
      throw new PayloadTooLargeException(EXPERT_ERROR_CODES.VERIFICATION_DOCUMENT_TOO_LARGE);
    }

    const currentCount = await this.documentRepository.countActive(application.id);
    if (currentCount >= EXPERT_LIMITS.MAX_DOCUMENTS) {
      throw new ConflictException({
        code: EXPERT_ERROR_CODES.VERIFICATION_DOCUMENT_INVALID,
        message: `Maximum of ${EXPERT_LIMITS.MAX_DOCUMENTS} documents allowed`,
      });
    }

    // Real content-type check via magic bytes — never trust the client MIME.
    const detected = verifyFileSignature(file.buffer, file.mimetype);
    if (!detected) {
      throw new UnsupportedMediaTypeException(
        EXPERT_ERROR_CODES.VERIFICATION_DOCUMENT_TYPE_UNSUPPORTED,
      );
    }

    const storageKey = this.storage.generateKey(application.id);
    const stored = await this.storage.put(storageKey, file.buffer);

    let record;
    try {
      record = await this.documentRepository.create({
        applicationId: application.id,
        type: parsed.data.type as ExpertVerificationDocumentResult['type'],
        storageKey: stored.storageKey,
        originalFileName: this.sanitizeFileName(file.originalname),
        mimeType: detected,
        sizeBytes: stored.sizeBytes,
        checksumSha256: stored.checksumSha256,
      });
    } catch (error) {
      // Roll back the orphaned object if the DB write fails.
      await this.storage.delete(stored.storageKey).catch(() => undefined);
      throw error;
    }

    // Audit intentionally excludes file bytes and original filename.
    await this.auditService.recordRequired({
      actorType: AuditActorType.USER,
      actorUserId: userId,
      action: 'expert.application.document_uploaded',
      targetType: 'ExpertVerificationDocument',
      targetId: record.id,
      outcome: AuditOutcome.SUCCESS,
      metadata: {
        applicationId: application.id,
        documentType: record.type,
        mimeType: detected,
        sizeBytes: stored.sizeBytes,
        ipAddress: context?.ipAddress,
      },
    });

    return mapDocument(record);
  }

  async remove(userId: string, documentId: string): Promise<{ removed: true }> {
    const application = await this.getEditableApplication(userId);

    const document = await this.documentRepository.findActiveById(documentId, application.id);
    if (!document) {
      throw new NotFoundException(EXPERT_ERROR_CODES.VERIFICATION_DOCUMENT_NOT_FOUND);
    }

    await this.documentRepository.softRemove(documentId, new Date());
    await this.storage.delete(document.storageKey).catch(() => undefined);

    await this.auditService.recordRequired({
      actorType: AuditActorType.USER,
      actorUserId: userId,
      action: 'expert.application.document_removed',
      targetType: 'ExpertVerificationDocument',
      targetId: documentId,
      outcome: AuditOutcome.SUCCESS,
      metadata: { applicationId: application.id, documentType: document.type },
    });

    return { removed: true };
  }

  private sanitizeFileName(name: string): string {
    const base = name.split(/[\\/]/).pop() ?? 'document';
    return base.replace(/[^\w.\- ]/g, '_').slice(0, 255);
  }
}
