import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditActorType, AuditOutcome } from '@nexthire/types';

export interface CreateProjectDto {
  title: string;
  summary: string;
  description: string;
  problemStatement?: string;
  solution?: string;
  candidateContribution?: string;
  status?: string;
  visibility?: string;
  startDate?: string;
  completionDate?: string;
  teamSize?: number;
  roleInProject?: string;
  githubUrl?: string;
  liveUrl?: string;
  documentationUrl?: string;
  challenges?: string;
  lessonsLearned?: string;
  futureImprovements?: string;
}

export interface ProjectResponse {
  id: string;
  userId: string;
  title: string;
  summary: string;
  status: string;
  visibility: string;
  verificationLevel: string;
  completionScore: number;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class ProjectService {
  private readonly logger = new Logger(ProjectService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async createProject(userId: string, dto: CreateProjectDto): Promise<ProjectResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const project = await this.prisma.project.create({
      data: {
        userId,
        title: dto.title,
        summary: dto.summary,
        description: dto.description,
        problemStatement: dto.problemStatement,
        solution: dto.solution,
        candidateContribution: dto.candidateContribution,
        status: (dto.status || 'IN_PROGRESS') as any,
        visibility: (dto.visibility || 'PRIVATE') as any,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        completionDate: dto.completionDate ? new Date(dto.completionDate) : null,
        teamSize: dto.teamSize,
        roleInProject: dto.roleInProject,
        githubUrl: dto.githubUrl,
        liveUrl: dto.liveUrl,
        documentationUrl: dto.documentationUrl,
        challenges: dto.challenges,
        lessonsLearned: dto.lessonsLearned,
        futureImprovements: dto.futureImprovements,
      },
    });

    await this.auditService.recordBestEffort({
      action: 'project.created',
      actorType: AuditActorType.USER,
      actorUserId: userId,
      targetType: 'project',
      targetId: project.id,
      outcome: AuditOutcome.SUCCESS,
      metadata: { title: dto.title },
    });

    this.logger.log(`Project created for user ${userId}: ${project.id}`);

    return this.formatProjectResponse(project);
  }

  async getProjectById(userId: string, projectId: string): Promise<any> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        technologies: true,
        media: { orderBy: { sortOrder: 'asc' } },
        verifications: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.userId !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    return project;
  }

  async listProjects(
    userId: string,
    filters?: { status?: string; visibility?: string },
  ): Promise<ProjectResponse[]> {
    const projects = await this.prisma.project.findMany({
      where: {
        userId,
        ...(filters?.status && { status: filters.status as any }),
        ...(filters?.visibility && { visibility: filters.visibility as any }),
      },
      orderBy: { createdAt: 'desc' },
    });

    return projects.map((p) => this.formatProjectResponse(p));
  }

  async updateProject(
    userId: string,
    projectId: string,
    dto: Partial<CreateProjectDto>,
  ): Promise<ProjectResponse> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.userId !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    const updated = await this.prisma.project.update({
      where: { id: projectId },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.summary && { summary: dto.summary }),
        ...(dto.description && { description: dto.description }),
        ...(dto.problemStatement !== undefined && { problemStatement: dto.problemStatement }),
        ...(dto.solution !== undefined && { solution: dto.solution }),
        ...(dto.candidateContribution !== undefined && {
          candidateContribution: dto.candidateContribution,
        }),
        ...(dto.status && { status: dto.status as any }),
        ...(dto.visibility && { visibility: dto.visibility as any }),
        ...(dto.startDate !== undefined && {
          startDate: dto.startDate ? new Date(dto.startDate) : null,
        }),
        ...(dto.completionDate !== undefined && {
          completionDate: dto.completionDate ? new Date(dto.completionDate) : null,
        }),
        ...(dto.teamSize !== undefined && { teamSize: dto.teamSize }),
        ...(dto.roleInProject !== undefined && { roleInProject: dto.roleInProject }),
        ...(dto.githubUrl !== undefined && { githubUrl: dto.githubUrl }),
        ...(dto.liveUrl !== undefined && { liveUrl: dto.liveUrl }),
        ...(dto.documentationUrl !== undefined && { documentationUrl: dto.documentationUrl }),
        ...(dto.challenges !== undefined && { challenges: dto.challenges }),
        ...(dto.lessonsLearned !== undefined && { lessonsLearned: dto.lessonsLearned }),
        ...(dto.futureImprovements !== undefined && { futureImprovements: dto.futureImprovements }),
      },
    });

    await this.auditService.recordBestEffort({
      action: 'project.updated',
      actorType: AuditActorType.USER,
      actorUserId: userId,
      targetType: 'project',
      targetId: projectId,
      outcome: AuditOutcome.SUCCESS,
    });

    return this.formatProjectResponse(updated);
  }

  async deleteProject(userId: string, projectId: string): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.userId !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    await this.prisma.project.delete({
      where: { id: projectId },
    });

    await this.auditService.recordBestEffort({
      action: 'project.deleted',
      actorType: AuditActorType.USER,
      actorUserId: userId,
      targetType: 'project',
      targetId: projectId,
      outcome: AuditOutcome.SUCCESS,
    });

    this.logger.log(`Project ${projectId} deleted for user ${userId}`);
  }

  async addTechnology(
    userId: string,
    projectId: string,
    name: string,
    category: string,
  ): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.userId !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    await this.prisma.projectTechnology.upsert({
      where: {
        projectId_name: {
          projectId,
          name,
        },
      },
      update: { category },
      create: { projectId, name, category },
    });

    await this.auditService.recordBestEffort({
      action: 'project.technology_added',
      actorType: AuditActorType.USER,
      actorUserId: userId,
      targetType: 'project_technology',
      targetId: `${projectId}:${name}`,
      outcome: AuditOutcome.SUCCESS,
    });
  }

  async removeTechnology(userId: string, projectId: string, name: string): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.userId !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    await this.prisma.projectTechnology.delete({
      where: {
        projectId_name: {
          projectId,
          name,
        },
      },
    });

    await this.auditService.recordBestEffort({
      action: 'project.technology_removed',
      actorType: AuditActorType.USER,
      actorUserId: userId,
      targetType: 'project_technology',
      targetId: `${projectId}:${name}`,
      outcome: AuditOutcome.SUCCESS,
    });
  }

  async addMedia(
    userId: string,
    projectId: string,
    type: string,
    url: string,
    caption?: string,
  ): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.userId !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    const maxOrder = await this.prisma.projectMedia.findFirst({
      where: { projectId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    await this.prisma.projectMedia.create({
      data: {
        projectId,
        type,
        url,
        caption,
        sortOrder: (maxOrder?.sortOrder || 0) + 1,
      },
    });

    await this.auditService.recordBestEffort({
      action: 'project.media_added',
      actorType: AuditActorType.USER,
      actorUserId: userId,
      targetType: 'project_media',
      targetId: projectId,
      outcome: AuditOutcome.SUCCESS,
      metadata: { type },
    });
  }

  private formatProjectResponse(project: any): ProjectResponse {
    return {
      id: project.id,
      userId: project.userId,
      title: project.title,
      summary: project.summary,
      status: project.status,
      visibility: project.visibility,
      verificationLevel: project.verificationLevel,
      completionScore: project.completionScore,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    };
  }
}
