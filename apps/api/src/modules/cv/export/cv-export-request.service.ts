import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../../database/prisma.service';
import { CvStorageService } from '../../../infrastructure/storage/cv-storage.service';
import { CvReadinessService } from '../cv-readiness.service';
import { AuditService } from '../../audit/audit.service';
import { AuditActorType, AuditOutcome } from '@nexthire/types';
import {
  CV_EXPORT_QUEUE,
  GENERATE_CV_EXPORT_JOB,
} from '../../../infrastructure/queue/queue.constants';

export interface CvExportResponse {
  id: string;
  cvId: string;
  status: 'PENDING' | 'GENERATING' | 'READY' | 'FAILED';
  fileSizeBytes: number | null;
  failureCategory: string | null;
  requestedAt: string;
  generatedAt: string | null;
  failedAt: string | null;
}

const MAX_PENDING_EXPORTS_PER_CV = 3;

@Injectable()
export class CvExportRequestService {
  private readonly logger = new Logger(CvExportRequestService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: CvStorageService,
    private readonly readinessService: CvReadinessService,
    private readonly auditService: AuditService,
    @InjectQueue(CV_EXPORT_QUEUE) private readonly exportQueue: Queue,
  ) {}

  private async assertOwnedCv(userId: string, cvId: string): Promise<void> {
    const cv = await this.prisma.cv.findUnique({ where: { id: cvId }, select: { userId: true } });
    if (!cv || cv.userId !== userId) {
      throw new NotFoundException('CV_NOT_FOUND');
    }
  }

  async requestExport(userId: string, cvId: string): Promise<CvExportResponse> {
    await this.assertOwnedCv(userId, cvId);

    const readiness = await this.readinessService.checkReadiness(userId, cvId);
    if (!readiness.ready) {
      throw new BadRequestException('CV_NOT_READY_FOR_EXPORT');
    }

    const pendingCount = await this.prisma.cvExport.count({
      where: { cvId, status: { in: ['PENDING', 'GENERATING'] } },
    });
    if (pendingCount >= MAX_PENDING_EXPORTS_PER_CV) {
      throw new ConflictException('CV_EXPORT_ALREADY_IN_PROGRESS');
    }

    const record = await this.prisma.cvExport.create({
      data: { cvId, userId, status: 'PENDING' },
    });

    await this.exportQueue.add(
      GENERATE_CV_EXPORT_JOB,
      { exportId: record.id, cvId, userId },
      { jobId: record.id },
    );

    await this.auditService.recordBestEffort({
      action: 'cv.export.requested',
      actorType: AuditActorType.USER,
      actorUserId: userId,
      targetType: 'CvExport',
      targetId: record.id,
      outcome: AuditOutcome.SUCCESS,
      metadata: { cvId },
    });

    return this.toResponse(record);
  }

  async listExports(userId: string, cvId: string): Promise<CvExportResponse[]> {
    await this.assertOwnedCv(userId, cvId);
    const records = await this.prisma.cvExport.findMany({
      where: { cvId },
      orderBy: { requestedAt: 'desc' },
      take: 20,
    });
    return records.map((r) => this.toResponse(r));
  }

  async getExport(userId: string, cvId: string, exportId: string): Promise<CvExportResponse> {
    await this.assertOwnedCv(userId, cvId);
    const record = await this.prisma.cvExport.findUnique({ where: { id: exportId } });
    if (!record || record.cvId !== cvId || record.userId !== userId) {
      throw new NotFoundException('CV_EXPORT_NOT_FOUND');
    }
    return this.toResponse(record);
  }

  async requestDownload(
    userId: string,
    cvId: string,
    exportId: string,
  ): Promise<{ downloadUrl: string }> {
    await this.assertOwnedCv(userId, cvId);
    const record = await this.prisma.cvExport.findUnique({ where: { id: exportId } });
    if (!record || record.cvId !== cvId || record.userId !== userId) {
      throw new NotFoundException('CV_EXPORT_NOT_FOUND');
    }
    if (record.status !== 'READY' || !record.storageKey) {
      throw new ConflictException('CV_EXPORT_NOT_READY');
    }

    await this.auditService.recordBestEffort({
      action: 'cv.export.downloaded',
      actorType: AuditActorType.USER,
      actorUserId: userId,
      targetType: 'CvExport',
      targetId: exportId,
      outcome: AuditOutcome.SUCCESS,
      metadata: { fileSizeBytes: record.fileSizeBytes ?? 0 },
    });

    // The file endpoint itself requires the caller's bearer token (owner-checked),
    // so no separate short-lived signature is needed for the local/S3-abstracted path.
    return { downloadUrl: `/api/v1/cvs/${cvId}/exports/${exportId}/file` };
  }

  /** Streams the PDF bytes for an owner-verified, READY export. */
  async getFileContent(userId: string, cvId: string, exportId: string): Promise<Buffer> {
    await this.assertOwnedCv(userId, cvId);
    const record = await this.prisma.cvExport.findUnique({ where: { id: exportId } });
    if (!record || record.cvId !== cvId || record.userId !== userId) {
      throw new NotFoundException('CV_EXPORT_NOT_FOUND');
    }
    if (record.status !== 'READY' || !record.storageKey) {
      throw new ConflictException('CV_EXPORT_NOT_READY');
    }

    const buffer = await this.storageService.read(record.storageKey);
    if (!buffer) {
      throw new NotFoundException('CV_EXPORT_NOT_FOUND');
    }
    return buffer;
  }

  private toResponse(record: {
    id: string;
    cvId: string;
    status: string;
    fileSizeBytes: number | null;
    failureCategory: string | null;
    requestedAt: Date;
    generatedAt: Date | null;
    failedAt: Date | null;
  }): CvExportResponse {
    return {
      id: record.id,
      cvId: record.cvId,
      status: record.status as CvExportResponse['status'],
      fileSizeBytes: record.fileSizeBytes,
      failureCategory: record.failureCategory,
      requestedAt: record.requestedAt.toISOString(),
      generatedAt: record.generatedAt?.toISOString() ?? null,
      failedAt: record.failedAt?.toISOString() ?? null,
    };
  }
}
