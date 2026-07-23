import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditActorType, AuditOutcome } from '@nexthire/types';

export interface CreateCvDto {
  title: string;
  template?: string;
}

export interface UpdateCvDto {
  title?: string;
  template?: string;
  visibility?: string;
}

export interface CvResponse {
  id: string;
  userId: string;
  title: string;
  template: string;
  visibility: string;
  isDefault: boolean;
  completionScore: number;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class CvService {
  private readonly logger = new Logger(CvService.name);
  private readonly DEFAULT_SECTIONS = [
    { type: 'personal_info', title: 'Personal Information', enabled: true },
    { type: 'professional_summary', title: 'Professional Summary', enabled: true },
    { type: 'education', title: 'Education', enabled: true },
    { type: 'work_experience', title: 'Work Experience', enabled: true },
    { type: 'skills', title: 'Skills', enabled: true },
    { type: 'projects', title: 'Projects', enabled: false },
    { type: 'certifications', title: 'Certifications', enabled: false },
    { type: 'languages', title: 'Languages', enabled: false },
    { type: 'achievements', title: 'Achievements', enabled: false },
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async createCv(userId: string, dto: CreateCvDto): Promise<CvResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existingCvCount = await this.prisma.cv.count({
      where: { userId },
    });

    if (existingCvCount >= 10) {
      throw new BadRequestException('Maximum 10 CVs allowed per user');
    }

    const cv = await this.prisma.cv.create({
      data: {
        userId,
        title: dto.title,
        template: (dto.template || 'ATS_OPTIMIZED') as any,
        isDefault: existingCvCount === 0, // First CV is default
      },
    });

    // Create default sections
    await this.prisma.cvSection.createMany({
      data: this.DEFAULT_SECTIONS.map((section, index) => ({
        cvId: cv.id,
        type: section.type,
        title: section.title,
        enabled: section.enabled,
        sortOrder: index,
      })),
    });

    // Create initial version
    await this.prisma.cvVersion.create({
      data: {
        cvId: cv.id,
        versionNumber: 1,
        content: {
          title: dto.title,
          template: dto.template || 'ATS_OPTIMIZED',
          sections: this.DEFAULT_SECTIONS,
        },
      },
    });

    await this.auditService.recordBestEffort({
      action: 'cv.created',
      actorType: AuditActorType.USER,
      actorUserId: userId,
      targetType: 'cv',
      targetId: cv.id,
      outcome: AuditOutcome.SUCCESS,
      metadata: { title: dto.title, template: dto.template },
    });

    this.logger.log(`CV created for user ${userId}: ${cv.id}`);

    return this.formatCvResponse(cv);
  }

  async getCvById(userId: string, cvId: string): Promise<CvResponse> {
    const cv = await this.prisma.cv.findUnique({
      where: { id: cvId },
      include: { sections: true },
    });

    if (!cv) {
      throw new NotFoundException('CV not found');
    }

    if (cv.userId !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    return this.formatCvResponse(cv);
  }

  async listCvs(userId: string): Promise<CvResponse[]> {
    const cvs = await this.prisma.cv.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return cvs.map((cv) => this.formatCvResponse(cv));
  }

  async updateCv(userId: string, cvId: string, dto: UpdateCvDto): Promise<CvResponse> {
    const cv = await this.prisma.cv.findUnique({
      where: { id: cvId },
    });

    if (!cv) {
      throw new NotFoundException('CV not found');
    }

    if (cv.userId !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    const updated = await this.prisma.cv.update({
      where: { id: cvId },
      data: {
        title: dto.title || cv.title,
        template: (dto.template || cv.template) as any,
        visibility: (dto.visibility || cv.visibility) as any,
      },
    });

    await this.auditService.recordBestEffort({
      action: 'cv.updated',
      actorType: AuditActorType.USER,
      actorUserId: userId,
      targetType: 'cv',
      targetId: cvId,
      outcome: AuditOutcome.SUCCESS,
    });

    return this.formatCvResponse(updated);
  }

  async setDefaultCv(userId: string, cvId: string): Promise<void> {
    const cv = await this.prisma.cv.findUnique({
      where: { id: cvId },
    });

    if (!cv) {
      throw new NotFoundException('CV not found');
    }

    if (cv.userId !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    // Unset all other CVs as default
    await this.prisma.cv.updateMany({
      where: { userId, id: { not: cvId } },
      data: { isDefault: false },
    });

    // Set this CV as default
    await this.prisma.cv.update({
      where: { id: cvId },
      data: { isDefault: true },
    });

    await this.auditService.recordBestEffort({
      action: 'cv.set_default',
      actorType: AuditActorType.USER,
      actorUserId: userId,
      targetType: 'cv',
      targetId: cvId,
      outcome: AuditOutcome.SUCCESS,
    });

    this.logger.log(`CV ${cvId} set as default for user ${userId}`);
  }

  async deleteCv(userId: string, cvId: string): Promise<void> {
    const cv = await this.prisma.cv.findUnique({
      where: { id: cvId },
    });

    if (!cv) {
      throw new NotFoundException('CV not found');
    }

    if (cv.userId !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    if (cv.isDefault) {
      throw new BadRequestException('Cannot delete default CV. Set another CV as default first.');
    }

    await this.prisma.cv.delete({
      where: { id: cvId },
    });

    await this.auditService.recordBestEffort({
      action: 'cv.deleted',
      actorType: AuditActorType.USER,
      actorUserId: userId,
      targetType: 'cv',
      targetId: cvId,
      outcome: AuditOutcome.SUCCESS,
    });

    this.logger.log(`CV ${cvId} deleted for user ${userId}`);
  }

  async duplicateCv(userId: string, sourceCvId: string, newTitle: string): Promise<CvResponse> {
    const sourceCv = await this.prisma.cv.findUnique({
      where: { id: sourceCvId },
      include: { sections: true, versions: true },
    });

    if (!sourceCv) {
      throw new NotFoundException('Source CV not found');
    }

    if (sourceCv.userId !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    const newCv = await this.prisma.cv.create({
      data: {
        userId,
        title: newTitle,
        template: sourceCv.template,
        visibility: sourceCv.visibility,
      },
    });

    // Duplicate sections
    await this.prisma.cvSection.createMany({
      data: sourceCv.sections.map((section) => ({
        cvId: newCv.id,
        type: section.type,
        title: section.title,
        enabled: section.enabled,
        sortOrder: section.sortOrder,
      })),
    });

    // Create initial version from latest source version
    const latestSourceVersion = sourceCv.versions.sort(
      (a, b) => b.versionNumber - a.versionNumber,
    )[0];

    const versionContent = latestSourceVersion
      ? {
          ...(latestSourceVersion.content as Record<string, any>),
          title: newTitle,
        }
      : { title: newTitle };

    await this.prisma.cvVersion.create({
      data: {
        cvId: newCv.id,
        versionNumber: 1,
        content: versionContent,
      },
    });

    await this.auditService.recordBestEffort({
      action: 'cv.duplicated',
      actorType: AuditActorType.USER,
      actorUserId: userId,
      targetType: 'cv',
      targetId: newCv.id,
      outcome: AuditOutcome.SUCCESS,
      metadata: { sourceId: sourceCvId, newTitle },
    });

    this.logger.log(`CV ${sourceCvId} duplicated to ${newCv.id} for user ${userId}`);

    return this.formatCvResponse(newCv);
  }

  private formatCvResponse(cv: any): CvResponse {
    return {
      id: cv.id,
      userId: cv.userId,
      title: cv.title,
      template: cv.template,
      visibility: cv.visibility,
      isDefault: cv.isDefault,
      completionScore: cv.completionScore,
      createdAt: cv.createdAt.toISOString(),
      updatedAt: cv.updatedAt.toISOString(),
    };
  }
}
