import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  GoneException,
  HttpException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../../database/prisma.service';
import { StorageService } from '../../../infrastructure/storage/storage.service';
import { AuditService } from '../../audit/audit.service';
import {
  DATA_EXPORT_QUEUE,
  GENERATE_DATA_EXPORT_JOB,
} from '../../../infrastructure/queue/queue.constants';
import { DATA_EXPORT_ERROR_CODES } from '@nexthire/constants';
import { AuditActorType, AuditOutcome } from '@nexthire/types';
import type {
  DataExportStatus,
  RequestCandidateDataExportResult,
  CandidateDataExportStatusResult,
  CandidateDataExportDownloadResult,
} from '@nexthire/types';

@Injectable()
export class CandidateDataExportService {
  private readonly logger = new Logger(CandidateDataExportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly storageService: StorageService,
    @InjectQueue(DATA_EXPORT_QUEUE) private readonly dataExportQueue: Queue,
  ) {}

  async requestExport(userId: string): Promise<RequestCandidateDataExportResult> {
    const existing = await this.prisma.candidateDataExportRequest.findFirst({
      where: {
        userId,
        status: { in: ['PENDING', 'PROCESSING'] },
      },
    });
    if (existing) {
      throw new ConflictException(DATA_EXPORT_ERROR_CODES.ALREADY_ACTIVE);
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentCount = await this.prisma.candidateDataExportRequest.count({
      where: {
        userId,
        requestedAt: { gte: thirtyDaysAgo },
      },
    });
    if (recentCount >= 3) {
      throw new HttpException(DATA_EXPORT_ERROR_CODES.RATE_LIMITED, 429);
    }

    const request = await this.prisma.candidateDataExportRequest.create({
      data: {
        userId,
        status: 'PENDING',
      },
    });

    await this.dataExportQueue.add(GENERATE_DATA_EXPORT_JOB, {
      userId,
      exportId: request.id,
    });

    await this.auditService.recordBestEffort({
      action: 'candidate.data_export.requested',
      actorType: AuditActorType.USER,
      actorUserId: userId,
      targetType: 'CandidateDataExportRequest',
      targetId: request.id,
      outcome: AuditOutcome.SUCCESS,
    });

    this.logger.log(`Data export requested for user ${userId}, exportId=${request.id}`);

    return {
      id: request.id,
      status: request.status as DataExportStatus,
      requestedAt: request.requestedAt.toISOString(),
    };
  }

  async listExports(userId: string) {
    const exports = await this.prisma.candidateDataExportRequest.findMany({
      where: { userId },
      orderBy: { requestedAt: 'desc' },
      select: {
        id: true,
        status: true,
        requestedAt: true,
        completedAt: true,
        expiresAt: true,
        fileSizeBytes: true,
      },
    });

    return exports.map((e) => ({
      id: e.id,
      status: e.status as DataExportStatus,
      requestedAt: e.requestedAt.toISOString(),
      completedAt: e.completedAt?.toISOString() ?? null,
      expiresAt: e.expiresAt?.toISOString() ?? null,
      fileSizeBytes: e.fileSizeBytes ? Number(e.fileSizeBytes) : null,
      downloadAvailable: e.status === 'READY' && (e.expiresAt ? e.expiresAt > new Date() : false),
    }));
  }

  async getExportStatus(
    userId: string,
    exportId: string,
  ): Promise<CandidateDataExportStatusResult> {
    const record = await this.prisma.candidateDataExportRequest.findUnique({
      where: { id: exportId },
    });
    if (!record || record.userId !== userId) {
      throw new NotFoundException(DATA_EXPORT_ERROR_CODES.NOT_FOUND);
    }
    return {
      id: record.id,
      status: record.status as DataExportStatus,
      requestedAt: record.requestedAt.toISOString(),
      completedAt: record.completedAt?.toISOString() ?? null,
      expiresAt: record.expiresAt?.toISOString() ?? null,
      fileSizeBytes: record.fileSizeBytes ? Number(record.fileSizeBytes) : null,
      downloadAvailable:
        record.status === 'READY' && (record.expiresAt ? record.expiresAt > new Date() : false),
    };
  }

  async getDownloadAccess(
    userId: string,
    exportId: string,
  ): Promise<CandidateDataExportDownloadResult> {
    const record = await this.prisma.candidateDataExportRequest.findUnique({
      where: { id: exportId },
    });
    if (!record || record.userId !== userId) {
      throw new NotFoundException(DATA_EXPORT_ERROR_CODES.NOT_FOUND);
    }
    if (record.status !== 'READY') {
      throw new ConflictException(DATA_EXPORT_ERROR_CODES.NOT_READY);
    }
    if (record.expiresAt && record.expiresAt < new Date()) {
      throw new GoneException(DATA_EXPORT_ERROR_CODES.EXPIRED);
    }
    if (!record.storageKey) {
      throw new NotFoundException(DATA_EXPORT_ERROR_CODES.NOT_FOUND);
    }

    const fileExists = await this.storageService.exists(record.storageKey);
    if (!fileExists) {
      throw new NotFoundException(DATA_EXPORT_ERROR_CODES.NOT_FOUND);
    }

    const expiresInSeconds = 300;
    const { url } = await this.storageService.getPresignedUrl(record.storageKey, expiresInSeconds);

    await this.prisma.candidateDataExportRequest.update({
      where: { id: exportId },
      data: { downloadedAt: new Date() },
    });

    await this.auditService.recordBestEffort({
      action: 'candidate.data_export.downloaded',
      actorType: AuditActorType.USER,
      actorUserId: userId,
      targetType: 'CandidateDataExportRequest',
      targetId: exportId,
      outcome: AuditOutcome.SUCCESS,
    });

    return { downloadUrl: url, expiresInSeconds };
  }
}
