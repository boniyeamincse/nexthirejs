import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditActorType, AuditOutcome } from '@nexthire/types';

export interface SectionContentResponse {
  cvId: string;
  sectionType: string;
  content: Record<string, any>;
  updatedAt: string;
}

@Injectable()
export class CvSectionService {
  private readonly logger = new Logger(CvSectionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getSectionContent(
    userId: string,
    cvId: string,
    sectionType: string,
  ): Promise<SectionContentResponse> {
    const cv = await this.prisma.cv.findUnique({
      where: { id: cvId },
      select: { userId: true },
    });

    if (!cv) {
      throw new NotFoundException('CV not found');
    }

    if (cv.userId !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    const content = await this.prisma.cvSectionContent.findUnique({
      where: {
        cvId_sectionType: {
          cvId,
          sectionType,
        },
      },
    });

    if (!content) {
      return {
        cvId,
        sectionType,
        content: {},
        updatedAt: new Date().toISOString(),
      };
    }

    return {
      cvId,
      sectionType,
      content: content.content as Record<string, any>,
      updatedAt: content.updatedAt.toISOString(),
    };
  }

  async updateSectionContent(
    userId: string,
    cvId: string,
    sectionType: string,
    content: Record<string, any>,
  ): Promise<SectionContentResponse> {
    const cv = await this.prisma.cv.findUnique({
      where: { id: cvId },
      select: { userId: true },
    });

    if (!cv) {
      throw new NotFoundException('CV not found');
    }

    if (cv.userId !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    // Validate section type exists
    const section = await this.prisma.cvSection.findUnique({
      where: {
        cvId_type: {
          cvId,
          type: sectionType,
        },
      },
    });

    if (!section) {
      throw new NotFoundException('Section not found');
    }

    const updated = await this.prisma.cvSectionContent.upsert({
      where: {
        cvId_sectionType: {
          cvId,
          sectionType,
        },
      },
      update: {
        content,
      },
      create: {
        cvId,
        sectionType,
        content,
      },
    });

    await this.auditService.recordBestEffort({
      action: 'cv.section_updated',
      actorType: AuditActorType.USER,
      actorUserId: userId,
      targetType: 'cv_section',
      targetId: `${cvId}:${sectionType}`,
      outcome: AuditOutcome.SUCCESS,
      metadata: { sectionType },
    });

    this.logger.log(`Section ${sectionType} updated for CV ${cvId}`);

    return {
      cvId,
      sectionType,
      content: updated.content as Record<string, any>,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async getAllSectionContents(userId: string, cvId: string): Promise<SectionContentResponse[]> {
    const cv = await this.prisma.cv.findUnique({
      where: { id: cvId },
      select: { userId: true },
    });

    if (!cv) {
      throw new NotFoundException('CV not found');
    }

    if (cv.userId !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    const contents = await this.prisma.cvSectionContent.findMany({
      where: { cvId },
    });

    return contents.map((c) => ({
      cvId: c.cvId,
      sectionType: c.sectionType,
      content: c.content as Record<string, any>,
      updatedAt: c.updatedAt.toISOString(),
    }));
  }

  async updateSectionOrder(
    userId: string,
    cvId: string,
    sectionOrder: Array<{ type: string; sortOrder: number }>,
  ): Promise<void> {
    const cv = await this.prisma.cv.findUnique({
      where: { id: cvId },
      select: { userId: true },
    });

    if (!cv) {
      throw new NotFoundException('CV not found');
    }

    if (cv.userId !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    // Update section order
    await Promise.all(
      sectionOrder.map((item) =>
        this.prisma.cvSection.updateMany({
          where: {
            cvId,
            type: item.type,
          },
          data: {
            sortOrder: item.sortOrder,
          },
        }),
      ),
    );

    await this.auditService.recordBestEffort({
      action: 'cv.sections_reordered',
      actorType: AuditActorType.USER,
      actorUserId: userId,
      targetType: 'cv',
      targetId: cvId,
      outcome: AuditOutcome.SUCCESS,
    });

    this.logger.log(`Sections reordered for CV ${cvId}`);
  }

  async toggleSectionVisibility(
    userId: string,
    cvId: string,
    sectionType: string,
    enabled: boolean,
  ): Promise<void> {
    const cv = await this.prisma.cv.findUnique({
      where: { id: cvId },
      select: { userId: true },
    });

    if (!cv) {
      throw new NotFoundException('CV not found');
    }

    if (cv.userId !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    await this.prisma.cvSection.updateMany({
      where: {
        cvId,
        type: sectionType,
      },
      data: {
        enabled,
      },
    });

    await this.auditService.recordBestEffort({
      action: 'cv.section_visibility_toggled',
      actorType: AuditActorType.USER,
      actorUserId: userId,
      targetType: 'cv_section',
      targetId: `${cvId}:${sectionType}`,
      outcome: AuditOutcome.SUCCESS,
      metadata: { enabled },
    });

    this.logger.log(`Section ${sectionType} visibility set to ${enabled} for CV ${cvId}`);
  }
}
