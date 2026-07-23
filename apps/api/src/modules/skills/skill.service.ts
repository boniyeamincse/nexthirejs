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

export interface SkillResponse {
  id: string;
  name: string;
  level: string;
  yearsOfExperience?: number;
  createdAt: string;
}

@Injectable()
export class SkillService {
  private readonly logger = new Logger(SkillService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async addSkill(
    userId: string,
    name: string,
    level: string,
    yearsOfExperience?: number,
  ): Promise<SkillResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const normalizedName = name.toLowerCase().trim();

    const existing = await this.prisma.candidateSkill.findUnique({
      where: {
        userId_normalizedName: {
          userId,
          normalizedName,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Skill already exists');
    }

    const skill = await this.prisma.candidateSkill.create({
      data: {
        userId,
        name,
        normalizedName,
        level: level as any,
        yearsOfExperience: yearsOfExperience ? parseFloat(yearsOfExperience.toString()) : null,
      },
    });

    await this.auditService.recordBestEffort({
      action: 'skill.added',
      actorType: AuditActorType.USER,
      actorUserId: userId,
      targetType: 'skill',
      targetId: skill.id,
      outcome: AuditOutcome.SUCCESS,
      metadata: { skillName: name, level },
    });

    this.logger.log(`Skill ${name} added for user ${userId}`);

    return this.formatSkillResponse(skill);
  }

  async getSkills(userId: string): Promise<SkillResponse[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const skills = await this.prisma.candidateSkill.findMany({
      where: { userId },
      orderBy: { sortOrder: 'asc' },
    });

    return skills.map((s) => this.formatSkillResponse(s));
  }

  async updateSkill(
    userId: string,
    skillId: string,
    level?: string,
    yearsOfExperience?: number,
  ): Promise<SkillResponse> {
    const skill = await this.prisma.candidateSkill.findUnique({
      where: { id: skillId },
      select: { userId: true },
    });

    if (!skill) {
      throw new NotFoundException('Skill not found');
    }

    if (skill.userId !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    const updated = await this.prisma.candidateSkill.update({
      where: { id: skillId },
      data: {
        ...(level && { level: level as any }),
        ...(yearsOfExperience !== undefined && {
          yearsOfExperience: yearsOfExperience ? parseFloat(yearsOfExperience.toString()) : null,
        }),
      },
    });

    await this.auditService.recordBestEffort({
      action: 'skill.updated',
      actorType: AuditActorType.USER,
      actorUserId: userId,
      targetType: 'skill',
      targetId: skillId,
      outcome: AuditOutcome.SUCCESS,
    });

    return this.formatSkillResponse(updated);
  }

  async deleteSkill(userId: string, skillId: string): Promise<void> {
    const skill = await this.prisma.candidateSkill.findUnique({
      where: { id: skillId },
      select: { userId: true, name: true },
    });

    if (!skill) {
      throw new NotFoundException('Skill not found');
    }

    if (skill.userId !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    await this.prisma.candidateSkill.delete({
      where: { id: skillId },
    });

    await this.auditService.recordBestEffort({
      action: 'skill.deleted',
      actorType: AuditActorType.USER,
      actorUserId: userId,
      targetType: 'skill',
      targetId: skillId,
      outcome: AuditOutcome.SUCCESS,
      metadata: { skillName: skill.name },
    });

    this.logger.log(`Skill ${skillId} deleted for user ${userId}`);
  }

  async reorderSkills(
    userId: string,
    skillOrder: Array<{ id: string; order: number }>,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify all skills belong to user
    const skills = await this.prisma.candidateSkill.findMany({
      where: {
        userId,
        id: { in: skillOrder.map((s) => s.id) },
      },
      select: { id: true },
    });

    if (skills.length !== skillOrder.length) {
      throw new BadRequestException('Some skills not found or not owned by user');
    }

    // Update sort order
    await Promise.all(
      skillOrder.map((item) =>
        this.prisma.candidateSkill.update({
          where: { id: item.id },
          data: { sortOrder: item.order },
        }),
      ),
    );

    await this.auditService.recordBestEffort({
      action: 'skills.reordered',
      actorType: AuditActorType.USER,
      actorUserId: userId,
      outcome: AuditOutcome.SUCCESS,
    });

    this.logger.log(`Skills reordered for user ${userId}`);
  }

  private formatSkillResponse(skill: any): SkillResponse {
    return {
      id: skill.id,
      name: skill.name,
      level: skill.level,
      yearsOfExperience: skill.yearsOfExperience ? skill.yearsOfExperience.toNumber() : undefined,
      createdAt: skill.createdAt.toISOString(),
    };
  }
}
