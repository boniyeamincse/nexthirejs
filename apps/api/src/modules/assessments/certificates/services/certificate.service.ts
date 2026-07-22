import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException, ConflictException, GoneException } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { AuditService } from '../../../audit/audit.service';
import { CertificateStorageService } from '../../../../infrastructure/storage/certificate-storage.service';
import { AuditActorType } from '@nexthire/types';
import { ASSESSMENT_ERROR_CODES } from '@nexthire/constants';
import type { AssessmentCertificateListItem, AssessmentCertificateDetail, AssessmentCertificateDownloadResult } from '@nexthire/types';

@Injectable()
export class CertificateService {
  private readonly logger = new Logger(CertificateService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly storageService: CertificateStorageService,
  ) {}

  async listCertificates(
    candidateId: string,
    query: { page?: number; pageSize?: number; status?: string },
  ): Promise<{ items: AssessmentCertificateListItem[]; pagination: { page: number; pageSize: number; totalItems: number; totalPages: number } }> {
    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? 25, 50);
    const skip = (page - 1) * pageSize;

    const where: any = { candidateId };
    if (query.status) {
      where.status = query.status;
    }

    const [items, totalItems] = await Promise.all([
      this.prisma.assessmentCertificate.findMany({
        where,
        select: {
          id: true,
          certificateNumber: true,
          assessmentTitleSnapshot: true,
          scorePercentageSnapshot: true,
          status: true,
          issuedAt: true,
          expiresAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.assessmentCertificate.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        id: item.id,
        certificateNumber: item.certificateNumber,
        assessmentTitle: item.assessmentTitleSnapshot,
        scorePercentage: Number(item.scorePercentageSnapshot),
        status: item.status as any,
        issuedAt: item.issuedAt?.toISOString() ?? null,
        expiresAt: item.expiresAt?.toISOString() ?? null,
        downloadAvailable: item.status === 'READY',
      })),
      pagination: { page, pageSize, totalItems, totalPages: Math.ceil(totalItems / pageSize) || 1 },
    };
  }

  async getCertificateDetail(candidateId: string, certificateId: string): Promise<AssessmentCertificateDetail> {
    const cert = await this.prisma.assessmentCertificate.findUnique({
      where: { id: certificateId },
    });

    if (!cert) {
      throw new NotFoundException(ASSESSMENT_ERROR_CODES.CERTIFICATE_NOT_FOUND);
    }

    if (cert.candidateId !== candidateId) {
      throw new ForbiddenException(ASSESSMENT_ERROR_CODES.CERTIFICATE_ACCESS_DENIED);
    }

    if (cert.status === 'REVOKED') {
      throw new GoneException(ASSESSMENT_ERROR_CODES.CERTIFICATE_REVOKED);
    }

    return {
      id: cert.id,
      certificateNumber: cert.certificateNumber,
      holderName: cert.holderNameSnapshot,
      assessmentTitle: cert.assessmentTitleSnapshot,
      scorePercentage: Number(cert.scorePercentageSnapshot),
      status: cert.status as any,
      issuedAt: cert.issuedAt?.toISOString() ?? null,
      expiresAt: cert.expiresAt?.toISOString() ?? null,
      generatedAt: cert.generatedAt?.toISOString() ?? null,
      failedAt: cert.failedAt?.toISOString() ?? null,
      failureCategory: cert.failureCategory,
      downloadAvailable: cert.status === 'READY',
      verificationCodeHint: cert.verificationCodeHint,
    };
  }

  async downloadCertificate(candidateId: string, certificateId: string): Promise<AssessmentCertificateDownloadResult> {
    const cert = await this.prisma.assessmentCertificate.findUnique({
      where: { id: certificateId },
    });

    if (!cert) {
      throw new NotFoundException(ASSESSMENT_ERROR_CODES.CERTIFICATE_NOT_FOUND);
    }

    if (cert.candidateId !== candidateId) {
      throw new ForbiddenException(ASSESSMENT_ERROR_CODES.CERTIFICATE_ACCESS_DENIED);
    }

    if (cert.status !== 'READY') {
      throw new ConflictException(ASSESSMENT_ERROR_CODES.CERTIFICATE_NOT_READY);
    }

    if (cert.expiresAt && cert.expiresAt < new Date()) {
      throw new GoneException(ASSESSMENT_ERROR_CODES.CERTIFICATE_EXPIRED);
    }

    if (!cert.storageKey) {
      throw new NotFoundException(ASSESSMENT_ERROR_CODES.CERTIFICATE_NOT_FOUND);
    }

    const downloadUrl = await this.storageService.getPresignedUrl(cert.storageKey, 300);

    await this.auditService.recordBestEffort({
      actorType: AuditActorType.USER,
      actorUserId: candidateId,
      action: 'assessment.certificate.downloaded',
      targetType: 'AssessmentCertificate',
      targetId: certificateId,
      metadata: { certificateId, fileSizeBytes: Number(cert.fileSizeBytes ?? 0) },
    });

    return { downloadUrl, expiresInSeconds: 300 };
  }

  async retryCertificateGeneration(candidateId: string, certificateId: string): Promise<{ status: string }> {
    const cert = await this.prisma.assessmentCertificate.findUnique({
      where: { id: certificateId },
    });

    if (!cert) {
      throw new NotFoundException(ASSESSMENT_ERROR_CODES.CERTIFICATE_NOT_FOUND);
    }

    if (cert.candidateId !== candidateId) {
      throw new ForbiddenException(ASSESSMENT_ERROR_CODES.CERTIFICATE_ACCESS_DENIED);
    }

    if (cert.status === 'READY') {
      return { status: 'READY' };
    }

    if (cert.status !== 'FAILED') {
      throw new BadRequestException(ASSESSMENT_ERROR_CODES.CERTIFICATE_GENERATION_NOT_RETRYABLE);
    }

    await this.prisma.assessmentCertificate.update({
      where: { id: certificateId },
      data: {
        status: 'PENDING',
        failedAt: null,
        failureCategory: null,
      },
    });

    await this.auditService.recordBestEffort({
      actorType: AuditActorType.USER,
      actorUserId: candidateId,
      action: 'assessment.certificate.retry_requested',
      targetType: 'AssessmentCertificate',
      targetId: certificateId,
      metadata: { certificateId, attemptId: cert.attemptId },
    });

    return { status: 'PENDING' };
  }
}
