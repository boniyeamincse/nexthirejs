import { AuditActorType, AuditOutcome } from '@nexthire/types';
import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { AuditService } from '../../../audit/audit.service';
import { CreateAssessmentInput, UpdateAssessmentInput } from '@nexthire/types';
import { createAssessmentSchema, updateAssessmentSchema } from '@nexthire/validation';
import { AssessmentStatus, AssessmentVisibility, AssessmentAvailability } from '@nexthire/types';

@Injectable()
export class AssessmentAuthoringService {
  private readonly logger = new Logger(AssessmentAuthoringService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async createAssessment(
    actorUserId: string,
    requestId: string,
    input: CreateAssessmentInput,
  ) {
    const validated = createAssessmentSchema.safeParse(input);
    if (!validated.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: validated.error.errors,
      });
    }

    const { categoryId, slug } = validated.data;

    // Verify category exists and is active
    const category = await this.prisma.assessmentCategory.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    if (!category.isActive) {
      throw new BadRequestException('Cannot assign assessment to an inactive category');
    }

    // Check slug uniqueness
    const existing = await this.prisma.assessment.findUnique({
      where: { slug },
    });
    if (existing) {
      throw new ConflictException('Assessment slug is already in use');
    }

    const assessment = await this.prisma.assessment.create({
      data: {
        ...validated.data,
        status: AssessmentStatus.DRAFT,
        questionCount: 0,
        totalPoints: 0,
        publicationVersion: 0,
        createdById: actorUserId,
        updatedById: actorUserId,
      },
    });

    await this.audit.recordRequired({
      actorType: AuditActorType.USER, outcome: AuditOutcome.SUCCESS,
      action: 'assessment.created',
      actorUserId,
      requestId,
      targetId: assessment.id,
      targetType: 'Assessment',
      metadata: {
        title: assessment.title,
        slug: assessment.slug,
        categoryId: assessment.categoryId,
        type: assessment.type,
      },
    });

    return assessment;
  }

  async updateAssessment(
    actorUserId: string,
    requestId: string,
    assessmentId: string,
    input: UpdateAssessmentInput,
  ) {
    const validated = updateAssessmentSchema.safeParse(input);
    if (!validated.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: validated.error.errors,
      });
    }

    const existing = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
    });
    if (!existing) {
      throw new NotFoundException('Assessment not found');
    }

    // Lifecycle check:
    // If PUBLISHED, we only allow certain changes (description, instructions, availability)
    if (existing.status === AssessmentStatus.PUBLISHED) {
      const blockedKeys = ['categoryId', 'title', 'slug', 'type', 'difficulty', 'estimatedDurationMinutes', 'passingScorePercentage', 'maximumAttempts'];
      for (const key of blockedKeys) {
        if (validated.data[key as keyof UpdateAssessmentInput] !== undefined) {
          throw new BadRequestException(`Cannot change ${key} while assessment is PUBLISHED. Archive it first.`);
        }
      }
    }

    if (existing.status === AssessmentStatus.RETIRED) {
      throw new BadRequestException('Cannot edit a RETIRED assessment');
    }

    // If changing category, check it
    if (validated.data.categoryId && validated.data.categoryId !== existing.categoryId) {
      const category = await this.prisma.assessmentCategory.findUnique({
        where: { id: validated.data.categoryId },
      });
      if (!category) throw new NotFoundException('Category not found');
      if (!category.isActive) throw new BadRequestException('Cannot assign to inactive category');
    }

    // If changing slug, check uniqueness
    if (validated.data.slug && validated.data.slug !== existing.slug) {
      const slugExists = await this.prisma.assessment.findUnique({
        where: { slug: validated.data.slug },
      });
      if (slugExists) throw new ConflictException('Assessment slug is already in use');
    }

    const updated = await this.prisma.assessment.update({
      where: { id: assessmentId },
      data: {
        ...validated.data,
        updatedById: actorUserId,
      },
    });

    await this.audit.recordRequired({
      actorType: AuditActorType.USER, outcome: AuditOutcome.SUCCESS,
      action: 'assessment.updated',
      actorUserId,
      requestId,
      targetId: assessmentId,
      targetType: 'Assessment',
      metadata: {
        changedFields: Object.keys(validated.data),
      },
    });

    return updated;
  }

  async getAssessmentDetail(assessmentId: string) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        sections: {
          orderBy: { sortOrder: 'asc' },
          include: {
            questions: {
              orderBy: { sortOrder: 'asc' },
              include: {
                question: {
                  select: {
                    id: true,
                    prompt: true,
                    type: true,
                    difficulty: true,
                    status: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!assessment) {
      throw new NotFoundException('Assessment not found');
    }

    return assessment;
  }

  async listAssessments() {
    const items = await this.prisma.assessment.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        category: { select: { id: true, name: true } },
      }
    });
    return items;
  }
}

