import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../../database/prisma.service';
import { CvPdfService, CvPdfSection } from './cv-pdf.service';
import { CvStorageService } from '../../../infrastructure/storage/cv-storage.service';
import { AuditService } from '../../audit/audit.service';
import { AuditActorType } from '@nexthire/types';
import { CV_EXPORT_QUEUE } from '../../../infrastructure/queue/queue.constants';

const SECTION_TITLES: Record<string, string> = {
  professional_summary: 'Professional Summary',
  education: 'Education',
  work_experience: 'Work Experience',
  skills: 'Skills',
  projects: 'Projects',
  certifications: 'Certifications',
  languages: 'Languages',
  achievements: 'Achievements',
};

@Processor(CV_EXPORT_QUEUE)
export class CvExportWorker extends WorkerHost {
  private readonly logger = new Logger(CvExportWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pdfService: CvPdfService,
    private readonly storageService: CvStorageService,
    private readonly auditService: AuditService,
  ) {
    super();
  }

  async process(job: Job<{ exportId: string; cvId: string; userId: string }>): Promise<void> {
    const { exportId, cvId, userId } = job.data;
    this.logger.log(`Processing CV export job ${job.id} for export ${exportId}`);

    try {
      const claimed = await this.prisma.$transaction(async (tx) => {
        const record = await tx.cvExport.findUnique({ where: { id: exportId } });
        if (!record || record.status !== 'PENDING') {
          return null;
        }
        await tx.cvExport.update({ where: { id: exportId }, data: { status: 'GENERATING' } });
        return record;
      });

      if (!claimed) {
        this.logger.debug(`Export ${exportId} skipped (not PENDING or already claimed)`);
        return;
      }

      const cv = await this.prisma.cv.findUnique({
        where: { id: cvId },
        include: {
          sections: { where: { enabled: true }, orderBy: { sortOrder: 'asc' } },
          sectionContents: true,
        },
      });
      if (!cv) {
        await this.markFailed(exportId, 'cv not found');
        return;
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { candidateProfile: true, candidatePreference: { include: { country: true } } },
      });
      if (!user) {
        await this.markFailed(exportId, 'user not found');
        return;
      }

      const contentByType = new Map(cv.sectionContents.map((c) => [c.sectionType, c.content]));
      const sections: CvPdfSection[] = cv.sections.map((s) => ({
        title: SECTION_TITLES[s.type] ?? s.title,
        type: s.type,
        content: contentByType.get(s.type) as Record<string, unknown> | undefined,
      }));

      const profile = user.candidateProfile;
      const preference = user.candidatePreference;
      const contactParts = [
        user.email,
        preference?.currentCity
          ? `${preference.currentCity}${preference.country ? `, ${preference.country.name}` : ''}`
          : null,
      ].filter(Boolean);

      const pdfBuffer = await this.pdfService.generate({
        cvTitle: cv.title,
        template: cv.template,
        fullName: profile?.fullName || user.email,
        professionalHeadline: profile?.professionalHeadline ?? null,
        contactLine: contactParts.length > 0 ? contactParts.join('  ·  ') : null,
        sections,
        generatedAt: new Date(),
      });

      const storageKey = this.storageService.generateKey(cvId, exportId);
      const { checksumSha256, fileSizeBytes } = await this.storageService.upload(
        storageKey,
        pdfBuffer,
      );

      const now = new Date();
      await this.prisma.cvExport.update({
        where: { id: exportId },
        data: { status: 'READY', storageKey, checksumSha256, fileSizeBytes, generatedAt: now },
      });

      await this.auditService.recordBestEffort({
        actorType: AuditActorType.USER,
        actorUserId: userId,
        action: 'cv.export.ready',
        targetType: 'CvExport',
        targetId: exportId,
        metadata: { cvId, fileSizeBytes },
      });

      this.logger.log(`CV export ${exportId} generated successfully`);
    } catch (error) {
      this.logger.error(`CV export failed for ${exportId}`, error);
      await this.markFailed(
        exportId,
        error instanceof Error ? error.message.slice(0, 100) : 'unknown error',
      );
      throw error;
    }
  }

  private async markFailed(exportId: string, failureCategory: string): Promise<void> {
    await this.prisma.cvExport.update({
      where: { id: exportId },
      data: {
        status: 'FAILED',
        failedAt: new Date(),
        failureCategory: failureCategory.slice(0, 100),
      },
    });

    await this.auditService.recordBestEffort({
      actorType: AuditActorType.SYSTEM,
      action: 'cv.export.failed',
      targetType: 'CvExport',
      targetId: exportId,
      metadata: { failureCategory: failureCategory.slice(0, 100) },
    });
  }
}
