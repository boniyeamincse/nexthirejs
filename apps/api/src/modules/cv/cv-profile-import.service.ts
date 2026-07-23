import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditActorType, AuditOutcome } from '@nexthire/types';
import type { SectionContentResponse } from './cv-section.service';

const IMPORTABLE_SECTIONS = [
  'education',
  'work_experience',
  'skills',
  'projects',
  'certifications',
  'languages',
  'achievements',
] as const;

type ImportableSection = (typeof IMPORTABLE_SECTIONS)[number];

/**
 * Snapshots verified candidate-profile records into independent CV section
 * content. The CV keeps its own copy from this point on — later edits to the
 * source profile record do not retroactively change the CV.
 */
@Injectable()
export class CvProfileImportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async importSection(
    userId: string,
    cvId: string,
    sectionType: string,
  ): Promise<SectionContentResponse> {
    if (!IMPORTABLE_SECTIONS.includes(sectionType as ImportableSection)) {
      throw new BadRequestException('CV_SECTION_NOT_IMPORTABLE');
    }

    const cv = await this.prisma.cv.findUnique({ where: { id: cvId }, select: { userId: true } });
    if (!cv || cv.userId !== userId) {
      throw new NotFoundException('CV_NOT_FOUND');
    }

    const section = await this.prisma.cvSection.findUnique({
      where: { cvId_type: { cvId, type: sectionType } },
    });
    if (!section) {
      throw new NotFoundException('CV_SECTION_NOT_FOUND');
    }

    const items = await this.fetchSourceItems(userId, sectionType as ImportableSection);
    const content = {
      items,
      importedAt: new Date().toISOString(),
    } as unknown as Prisma.InputJsonValue;

    const updated = await this.prisma.cvSectionContent.upsert({
      where: { cvId_sectionType: { cvId, sectionType } },
      update: { content },
      create: { cvId, sectionType, content },
    });

    await this.prisma.cvSection.update({
      where: { cvId_type: { cvId, type: sectionType } },
      data: { enabled: true },
    });

    await this.auditService.recordBestEffort({
      action: 'cv.section_imported_from_profile',
      actorType: AuditActorType.USER,
      actorUserId: userId,
      targetType: 'cv_section',
      targetId: `${cvId}:${sectionType}`,
      outcome: AuditOutcome.SUCCESS,
      metadata: { sectionType, itemCount: items.length },
    });

    return {
      cvId,
      sectionType,
      content: updated.content as Record<string, unknown>,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  private async fetchSourceItems(
    userId: string,
    sectionType: ImportableSection,
  ): Promise<Record<string, unknown>[]> {
    switch (sectionType) {
      case 'education': {
        const rows = await this.prisma.educationRecord.findMany({
          where: { userId },
          orderBy: { sortOrder: 'asc' },
        });
        return rows.map((r) => ({
          institutionName: r.institutionName,
          qualification: r.qualification,
          fieldOfStudy: r.fieldOfStudy,
          startDate: r.startDate.toISOString(),
          endDate: r.endDate?.toISOString() ?? null,
          currentlyStudying: r.currentlyStudying,
          grade: r.grade,
          description: r.description,
        }));
      }
      case 'work_experience': {
        const rows = await this.prisma.workExperienceRecord.findMany({
          where: { userId },
          orderBy: { sortOrder: 'asc' },
        });
        return rows.map((r) => ({
          companyName: r.companyName,
          jobTitle: r.jobTitle,
          employmentType: r.employmentType,
          location: r.location,
          isRemote: r.isRemote,
          startDate: r.startDate.toISOString(),
          endDate: r.endDate?.toISOString() ?? null,
          currentlyWorking: r.currentlyWorking,
          responsibilities: r.responsibilities,
          achievements: r.achievements,
        }));
      }
      case 'skills': {
        const rows = await this.prisma.candidateSkill.findMany({
          where: { userId },
          orderBy: { sortOrder: 'asc' },
        });
        return rows.map((r) => ({ name: r.name, level: r.level }));
      }
      case 'projects': {
        const rows = await this.prisma.project.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        });
        return rows.map((r) => ({
          title: r.title,
          summary: r.summary,
          roleInProject: r.roleInProject,
          startDate: r.startDate?.toISOString() ?? null,
          completionDate: r.completionDate?.toISOString() ?? null,
          githubUrl: r.githubUrl,
          liveUrl: r.liveUrl,
        }));
      }
      case 'certifications': {
        const rows = await this.prisma.candidateCertification.findMany({
          where: { userId },
          orderBy: { sortOrder: 'asc' },
        });
        return rows.map((r) => ({
          name: r.name,
          issuer: r.issuer,
          issueDate: r.issueDate.toISOString(),
          expiryDate: r.expiryDate?.toISOString() ?? null,
          doesNotExpire: r.doesNotExpire,
          credentialId: r.credentialId,
        }));
      }
      case 'languages': {
        const rows = await this.prisma.candidateLanguage.findMany({
          where: { userId },
          orderBy: { sortOrder: 'asc' },
        });
        return rows.map((r) => ({
          name: r.name,
          speaking: r.speaking,
          reading: r.reading,
          writing: r.writing,
        }));
      }
      case 'achievements': {
        const rows = await this.prisma.candidateAchievement.findMany({
          where: { userId },
          orderBy: { sortOrder: 'asc' },
        });
        return rows.map((r) => ({
          title: r.title,
          issuer: r.issuer,
          achievedAt: r.achievedAt?.toISOString() ?? null,
          description: r.description,
        }));
      }
    }
  }
}
