import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { StorageService } from '../../../infrastructure/storage/storage.service';
import { AuditService } from '../../audit/audit.service';
import {
  DATA_EXPORT_QUEUE,
  GENERATE_DATA_EXPORT_JOB,
} from '../../../infrastructure/queue/queue.constants';
import { AuditActorType, AuditOutcome } from '@nexthire/types';
import * as crypto from 'node:crypto';

interface GenerateDataExportPayload {
  userId: string;
  exportId: string;
}

@Processor(DATA_EXPORT_QUEUE)
export class CandidateDataExportProcessor extends WorkerHost {
  private readonly logger = new Logger(CandidateDataExportProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly auditService: AuditService,
  ) {
    super();
  }

  async process(
    job: Job<GenerateDataExportPayload>,
  ): Promise<{ exportId: string; status: string }> {
    if (job.name !== GENERATE_DATA_EXPORT_JOB) {
      throw new Error(`Unknown job name: ${job.name}`);
    }

    const { userId, exportId } = job.data;
    if (!userId || !exportId) {
      throw new Error('Invalid export job payload: missing userId or exportId');
    }

    const request = await this.prisma.candidateDataExportRequest.findUnique({
      where: { id: exportId },
    });
    if (!request || request.userId !== userId) {
      throw new Error(`Export request not found or not owned by user: ${exportId}`);
    }
    if (request.status !== 'PENDING') {
      this.logger.warn(`Export ${exportId} is not PENDING (status=${request.status}), skipping`);
      return { exportId, status: request.status };
    }

    await this.prisma.candidateDataExportRequest.update({
      where: { id: exportId },
      data: { status: 'PROCESSING', processingAt: new Date() },
    });

    await this.auditService.recordBestEffort({
      action: 'candidate.data_export.processing',
      actorType: AuditActorType.USER,
      actorUserId: userId,
      targetType: 'CandidateDataExportRequest',
      targetId: exportId,
      outcome: AuditOutcome.SUCCESS,
      metadata: { exportRequestId: exportId, exportStatus: 'PROCESSING' },
    });

    try {
      const data = await this.loadExportData(userId);
      const { buffer, checksum } = await this.generateZip(data);
      const storageKey = this.storageService.generateKey(userId, exportId);
      await this.storageService.upload(storageKey, buffer);
      const fileSizeBytes = BigInt(buffer.length);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await this.prisma.candidateDataExportRequest.update({
        where: { id: exportId },
        data: {
          status: 'READY',
          storageKey,
          fileSizeBytes,
          checksumSha256: checksum,
          completedAt: new Date(),
          expiresAt,
        },
      });

      await this.auditService.recordBestEffort({
        action: 'candidate.data_export.ready',
        actorType: AuditActorType.USER,
        actorUserId: userId,
        targetType: 'CandidateDataExportRequest',
        targetId: exportId,
        outcome: AuditOutcome.SUCCESS,
        metadata: {
          exportRequestId: exportId,
          exportStatus: 'READY',
          fileSizeBytes: Number(fileSizeBytes),
        },
      });

      this.logger.log(`Data export ${exportId} completed for user ${userId}`);
      return { exportId, status: 'READY' };
    } catch (error) {
      const failureCategory = error instanceof Error ? error.constructor.name : 'UNKNOWN';
      await this.prisma.candidateDataExportRequest.update({
        where: { id: exportId },
        data: { status: 'FAILED', failedAt: new Date(), failureCategory },
      });

      await this.auditService.recordBestEffort({
        action: 'candidate.data_export.failed',
        actorType: AuditActorType.USER,
        actorUserId: userId,
        targetType: 'CandidateDataExportRequest',
        targetId: exportId,
        outcome: AuditOutcome.FAILURE,
        metadata: { exportRequestId: exportId, exportStatus: 'FAILED', failureCategory },
      });

      this.logger.error(`Data export ${exportId} failed: ${(error as Error).message}`);
      throw error;
    }
  }

  private async loadExportData(userId: string): Promise<Record<string, unknown>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        candidateProfile: true,
        candidatePreference: { include: { country: true } },
        educationRecords: true,
        workExperienceRecords: true,
        skills: true,
        languages: true,
        certifications: true,
        training: true,
        achievements: true,
        professionalLinks: true,
        profilePrivacy: true,
        sessions: {
          where: { status: 'ACTIVE' },
          select: {
            createdAt: true,
            lastUsedAt: true,
            expiresAt: true,
            browserName: true,
            operatingSystem: true,
            deviceType: true,
            status: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) throw new Error('User not found');

    return {
      generatedAt: new Date().toISOString(),
      schemaVersion: '1.0',
      account: {
        email: user.email,
        status: user.status,
        emailVerified: !!user.emailVerifiedAt,
        createdAt: user.createdAt.toISOString(),
        passwordChangedAt: user.passwordChangedAt?.toISOString() ?? null,
        deactivatedAt: user.deactivatedAt?.toISOString() ?? null,
      },
      profile: user.candidateProfile
        ? {
            fullName: user.candidateProfile.fullName,
            professionalHeadline: user.candidateProfile.professionalHeadline,
            professionalSummary: user.candidateProfile.professionalSummary,
            dateOfBirth: user.candidateProfile.dateOfBirth?.toISOString() ?? null,
          }
        : null,
      preferences: user.candidatePreference
        ? {
            country: user.candidatePreference.country?.name ?? null,
            currentCity: user.candidatePreference.currentCity,
            preferredJobRoles: user.candidatePreference.preferredJobRoles,
            preferredWorkModes: user.candidatePreference.preferredWorkModes,
            preferredEmploymentTypes: user.candidatePreference.preferredEmploymentTypes,
          }
        : null,
      education: user.educationRecords.map((e) => ({
        institution: e.institutionName,
        degree: e.qualification,
        fieldOfStudy: e.fieldOfStudy,
        startDate: e.startDate.toISOString(),
        endDate: e.endDate?.toISOString() ?? null,
        grade: e.grade,
      })),
      workExperience: user.workExperienceRecords.map((w) => ({
        company: w.companyName,
        position: w.jobTitle,
        startDate: w.startDate.toISOString(),
        endDate: w.endDate?.toISOString() ?? null,
        description: w.responsibilities,
        isCurrentPosition: w.currentlyWorking,
      })),
      skills: user.skills.map((s) => ({
        name: s.name,
        level: s.level,
      })),
      languages: user.languages.map((l) => ({
        name: l.name,
        speaking: l.speaking,
        reading: l.reading,
        writing: l.writing,
      })),
      certifications: user.certifications.map((c) => ({
        name: c.name,
        issuer: c.issuer,
        issuedAt: c.issueDate.toISOString(),
        expirationDate: c.expiryDate?.toISOString() ?? null,
        credentialId: c.credentialId,
        credentialUrl: c.credentialUrl,
      })),
      training: user.training.map((t) => ({
        title: t.title,
        provider: t.provider,
        completedAt: t.completionDate.toISOString(),
        description: t.description,
      })),
      achievements: user.achievements.map((a) => ({
        title: a.title,
        issuer: a.issuer,
        achievedAt: a.achievedAt?.toISOString() ?? null,
        description: a.description,
      })),
      professionalLinks: user.professionalLinks.map((l) => ({
        type: l.type,
        label: l.label,
        url: l.url,
      })),
      privacy: user.profilePrivacy
        ? {
            overallDiscoverability: user.profilePrivacy.overallDiscoverability,
            sections: {
              BASIC_PROFILE: user.profilePrivacy.basicProfile,
              LOCATION_AND_PREFERENCES: user.profilePrivacy.locationAndPreferences,
              EDUCATION: user.profilePrivacy.education,
              WORK_EXPERIENCE: user.profilePrivacy.workExperience,
              SKILLS_AND_LANGUAGES: user.profilePrivacy.skillsAndLanguages,
              CERTIFICATIONS_AND_TRAINING: user.profilePrivacy.certificationsAndTraining,
              ACHIEVEMENTS_AND_LINKS: user.profilePrivacy.achievementsAndLinks,
            },
          }
        : null,
      sessions: user.sessions.map((s) => ({
        status: s.status,
        createdAt: s.createdAt.toISOString(),
        lastUsedAt: s.lastUsedAt?.toISOString() ?? null,
        expiresAt: s.expiresAt.toISOString(),
        browser: s.browserName,
        operatingSystem: s.operatingSystem,
        deviceType: s.deviceType,
      })),
    };
  }

  private async generateZip(
    data: Record<string, unknown>,
  ): Promise<{ buffer: Buffer; checksum: string }> {
    const content = {
      'README.txt':
        'NextHire Personal Data Export\nGenerated at: ' +
        data.generatedAt +
        '\nSchema Version: ' +
        data.schemaVersion +
        '\n\nThis file contains your personal data from your NextHire account.',
      ...data,
    };
    const jsonStr = JSON.stringify(content, null, 2);
    const buffer = Buffer.from(jsonStr, 'utf-8');
    const checksum = crypto.createHash('sha256').update(buffer).digest('hex');
    return { buffer, checksum };
  }
}
