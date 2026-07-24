import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { CompanyApplicationRepository } from '../repositories/company-application.repository';
import { CompanyRepository } from '../repositories/company.repository';
import { CompanyDocumentRepository } from '../repositories/company-document.repository';
import { CompanyDocumentStorageService } from './company-document-storage.service';
import { AuditService } from '../../audit/audit.service';
import { uploadCompanyDocumentMetadataSchema } from '@nexthire/validation';
import { COMPANY_ERROR_CODES, COMPANY_LIMITS } from '@nexthire/constants';
import { AuditActorType, AuditOutcome } from '@nexthire/types';
import type { CompanyVerificationDocumentResult } from '@nexthire/types';
import { verifyFileSignature } from '../../experts/shared/file-signature.util';
import { mapCompanyDocument } from '../shared/company-mappers';

const DOCUMENT_EDITABLE_STATUSES = ['DRAFT', 'CHANGES_REQUESTED'];

export interface UploadedFileLike {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

@Injectable()
export class CompanyDocumentService {
  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly applicationRepository: CompanyApplicationRepository,
    private readonly documentRepository: CompanyDocumentRepository,
    private readonly storage: CompanyDocumentStorageService,
    private readonly auditService: AuditService,
  ) {}

  private async findActiveApplication(ownerUserId: string) {
    const company = await this.companyRepository.findByOwnerUserId(ownerUserId);
    if (!company) {
      throw new NotFoundException(COMPANY_ERROR_CODES.APPLICATION_NOT_FOUND);
    }
    const application = await this.applicationRepository.findActiveByCompanyId(company.id);
    if (!application) {
      throw new NotFoundException(COMPANY_ERROR_CODES.APPLICATION_NOT_FOUND);
    }
    return application;
  }

  private async getEditableApplication(ownerUserId: string) {
    const application = await this.findActiveApplication(ownerUserId);
    if (!DOCUMENT_EDITABLE_STATUSES.includes(application.status)) {
      throw new ConflictException(COMPANY_ERROR_CODES.APPLICATION_TRANSITION_INVALID);
    }
    return application;
  }

  async listMyDocuments(ownerUserId: string): Promise<CompanyVerificationDocumentResult[]> {
    const application = await this.findActiveApplication(ownerUserId);
    const docs = await this.documentRepository.listActive(application.id);
    return docs.map(mapCompanyDocument);
  }

  async upload(
    ownerUserId: string,
    metadata: unknown,
    file: UploadedFileLike | undefined,
    context?: { ipAddress?: string },
  ): Promise<CompanyVerificationDocumentResult> {
    const application = await this.getEditableApplication(ownerUserId);

    const parsed = uploadCompanyDocumentMetadataSchema.safeParse(metadata ?? {});
    if (!parsed.success) {
      throw new BadRequestException({
        code: COMPANY_ERROR_CODES.VERIFICATION_DOCUMENT_INVALID,
        details: parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      });
    }

    if (!file || !file.buffer || file.size === 0) {
      throw new BadRequestException(COMPANY_ERROR_CODES.VERIFICATION_DOCUMENT_INVALID);
    }

    if (file.size > COMPANY_LIMITS.MAX_DOCUMENT_SIZE_BYTES) {
      throw new PayloadTooLargeException(COMPANY_ERROR_CODES.VERIFICATION_DOCUMENT_TOO_LARGE);
    }

    const currentCount = await this.documentRepository.countActive(application.id);
    if (currentCount >= COMPANY_LIMITS.MAX_DOCUMENTS) {
      throw new ConflictException({
        code: COMPANY_ERROR_CODES.VERIFICATION_DOCUMENT_INVALID,
        message: `Maximum of ${COMPANY_LIMITS.MAX_DOCUMENTS} documents allowed`,
      });
    }

    const detected = verifyFileSignature(file.buffer, file.mimetype);
    if (!detected) {
      throw new UnsupportedMediaTypeException(
        COMPANY_ERROR_CODES.VERIFICATION_DOCUMENT_TYPE_UNSUPPORTED,
      );
    }

    const storageKey = this.storage.generateKey(application.id);
    const stored = await this.storage.put(storageKey, file.buffer);

    let record;
    try {
      record = await this.documentRepository.create({
        applicationId: application.id,
        type: parsed.data.type,
        storageKey: stored.storageKey,
        originalFileName: this.sanitizeFileName(file.originalname),
        mimeType: detected,
        sizeBytes: stored.sizeBytes,
        checksumSha256: stored.checksumSha256,
      });
    } catch (error) {
      await this.storage.delete(stored.storageKey).catch(() => undefined);
      throw error;
    }

    await this.auditService.recordRequired({
      actorType: AuditActorType.USER,
      actorUserId: ownerUserId,
      action: 'company.application.document_uploaded',
      targetType: 'CompanyVerificationDocument',
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

    return mapCompanyDocument(record);
  }

  async remove(ownerUserId: string, documentId: string): Promise<{ removed: true }> {
    const application = await this.getEditableApplication(ownerUserId);

    const document = await this.documentRepository.findActiveById(documentId, application.id);
    if (!document) {
      throw new NotFoundException(COMPANY_ERROR_CODES.VERIFICATION_DOCUMENT_NOT_FOUND);
    }

    await this.documentRepository.softRemove(documentId, new Date());
    await this.storage.delete(document.storageKey).catch(() => undefined);

    await this.auditService.recordRequired({
      actorType: AuditActorType.USER,
      actorUserId: ownerUserId,
      action: 'company.application.document_removed',
      targetType: 'CompanyVerificationDocument',
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
