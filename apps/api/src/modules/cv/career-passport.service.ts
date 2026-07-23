import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditActorType, AuditOutcome } from '@nexthire/types';

@Injectable()
export class CareerPassportService {
  private readonly logger = new Logger(CareerPassportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async initializePassport(userId: string): Promise<any> {
    const existing = await this.prisma.careerPassport.findUnique({
      where: { userId },
    });

    if (existing) {
      throw new BadRequestException('Passport already exists');
    }

    const passport = await this.prisma.careerPassport.create({
      data: {
        userId,
        status: 'DRAFT',
      },
    });

    await this.auditService.recordBestEffort({
      action: 'passport.initialized',
      actorType: AuditActorType.USER,
      actorUserId: userId,
      targetType: 'passport',
      targetId: passport.id,
      outcome: AuditOutcome.SUCCESS,
    });

    return passport;
  }

  async getPassport(userId: string, publicOnly = false): Promise<any> {
    const passport = await this.prisma.careerPassport.findUnique({
      where: { userId },
      include: {
        sections: {
          where: { isVisible: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!passport) {
      throw new NotFoundException('Passport not found');
    }

    if (publicOnly && (!passport.publicProfile || passport.status !== 'ACTIVE')) {
      throw new NotFoundException('Passport not public');
    }

    return passport;
  }

  async publishPassport(userId: string): Promise<any> {
    const passport = await this.prisma.careerPassport.findUnique({
      where: { userId },
    });

    if (!passport) {
      throw new NotFoundException('Passport not found');
    }

    const updated = await this.prisma.careerPassport.update({
      where: { userId },
      data: {
        status: 'ACTIVE',
        publicProfile: true,
        lastPublishedAt: new Date(),
      },
    });

    await this.auditService.recordBestEffort({
      action: 'passport.published',
      actorType: AuditActorType.USER,
      actorUserId: userId,
      targetType: 'passport',
      targetId: passport.id,
      outcome: AuditOutcome.SUCCESS,
    });

    this.logger.log(`Passport published for user ${userId}`);

    return updated;
  }

  async aggregateProfile(userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        candidateProfile: true,
        skills: {
          orderBy: { sortOrder: 'asc' },
        },
        cvs: {
          where: { isDefault: true },
          include: { sections: true },
        },
        projects: {
          include: { technologies: true },
        },
        achievements: {
          orderBy: { achievedAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.candidateProfile?.fullName,
      },
      resume: user.cvs[0] || null,
      skills: user.skills,
      projects: user.projects,
      achievements: user.achievements,
      metadata: {
        skillCount: user.skills.length,
        projectCount: user.projects.length,
        achievementCount: user.achievements.length,
      },
    };
  }

  async addSection(userId: string, type: string, title: string, content?: any): Promise<any> {
    const passport = await this.prisma.careerPassport.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!passport) {
      throw new NotFoundException('Passport not found');
    }

    const maxOrder = await this.prisma.passportSection.findFirst({
      where: { passportId: passport.id },
      select: { sortOrder: true },
      orderBy: { sortOrder: 'desc' },
    });

    const section = await this.prisma.passportSection.create({
      data: {
        passportId: passport.id,
        type,
        title,
        content,
        sortOrder: (maxOrder?.sortOrder ?? -1) + 1,
      },
    });

    await this.auditService.recordBestEffort({
      action: 'passport.section_added',
      actorType: AuditActorType.USER,
      actorUserId: userId,
      targetType: 'passport_section',
      targetId: section.id,
      outcome: AuditOutcome.SUCCESS,
      metadata: { type },
    });

    return section;
  }

  async recordView(passportId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    const passport = await this.prisma.careerPassport.findUnique({
      where: { id: passportId },
      select: { id: true },
    });

    if (!passport || !passport.id) {
      return;
    }

    await this.prisma.passportView.create({
      data: {
        passportId,
        ipAddress,
        userAgent,
      },
    });

    await this.prisma.careerPassport.update({
      where: { id: passportId },
      data: {
        viewCount: { increment: 1 },
      },
    });
  }

  async getPassportStats(userId: string): Promise<any> {
    const passport = await this.prisma.careerPassport.findUnique({
      where: { userId },
      include: {
        sections: { select: { id: true, type: true, isVisible: true } },
        views: { select: { viewedAt: true } },
      },
    });

    if (!passport) {
      throw new NotFoundException('Passport not found');
    }

    return {
      status: passport.status,
      isPublic: passport.publicProfile,
      viewCount: passport.viewCount,
      sectionCount: passport.sections.length,
      visibleSections: passport.sections.filter((s) => s.isVisible).length,
      sections: passport.sections.map((s) => s.type),
      lastViewed: passport.views[0]?.viewedAt || null,
    };
  }
}
