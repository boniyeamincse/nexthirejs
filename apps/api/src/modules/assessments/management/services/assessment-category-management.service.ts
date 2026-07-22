
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { AssessmentCategoryRepository } from '../../repositories/assessment-category.repository';
import { PrismaService } from '../../../../database/prisma.service';
import { AuditService } from '../../../audit/audit.service';
import { CreateAssessmentCategoryInput, UpdateAssessmentCategoryInput, ReorderAssessmentCategoriesInput, AssessmentCategoryManagementItem, AuditActorType, AuditOutcome } from '@nexthire/types';
import { createAssessmentCategorySchema, updateAssessmentCategorySchema, reorderAssessmentCategoriesSchema } from '@nexthire/validation';
import { BadRequestException } from '@nestjs/common';

@Injectable()
export class AssessmentCategoryManagementService {
  constructor(
    private categoryRepo: AssessmentCategoryRepository,
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async listCategories(): Promise<AssessmentCategoryManagementItem[]> {
    const categories = await this.prisma.assessmentCategory.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return categories.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      sortOrder: c.sortOrder,
      isActive: c.isActive,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));
  }

  async createCategory(input: CreateAssessmentCategoryInput, actorId: string): Promise<AssessmentCategoryManagementItem> {
    const parsed = createAssessmentCategorySchema.safeParse(input);
    if (!parsed.success) throw new BadRequestException('INVALID_CATEGORY_INPUT');
    const validData = parsed.data;

    const existing = await this.prisma.assessmentCategory.findUnique({
      where: { slug: validData.slug },
    });
    if (existing) {
      throw new ConflictException('ASSESSMENT_CATEGORY_SLUG_CONFLICT');
    }

    const category = await this.prisma.assessmentCategory.create({
      data: {
        name: validData.name,
        slug: validData.slug,
        description: validData.description,
        sortOrder: validData.sortOrder ?? 0,
        isActive: validData.isActive ?? true,
      },
    });

    await this.auditService.recordRequired({
      actorType: AuditActorType.USER,
      actorUserId: actorId,
      action: 'assessment.category.created',
      targetType: 'AssessmentCategory',
      outcome: AuditOutcome.SUCCESS,
      metadata: { categoryId: category.id },
    });

    return {
      ...category,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    };
  }

  async updateCategory(id: string, input: UpdateAssessmentCategoryInput, actorId: string): Promise<AssessmentCategoryManagementItem> {
    const parsed = updateAssessmentCategorySchema.safeParse(input);
    if (!parsed.success) throw new BadRequestException('INVALID_CATEGORY_INPUT');
    const validData = parsed.data;

    const category = await this.prisma.assessmentCategory.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('ASSESSMENT_CATEGORY_NOT_FOUND');

    if (validData.slug && validData.slug !== category.slug) {
      const existing = await this.prisma.assessmentCategory.findUnique({ where: { slug: validData.slug } });
      if (existing) throw new ConflictException('ASSESSMENT_CATEGORY_SLUG_CONFLICT');
    }

    const updated = await this.prisma.assessmentCategory.update({
      where: { id },
      data: {
        ...validData,
      },
    });

    await this.auditService.recordRequired({
      actorType: AuditActorType.USER,
      actorUserId: actorId,
      action: 'assessment.category.updated',
      targetType: 'AssessmentCategory',
      outcome: AuditOutcome.SUCCESS,
      metadata: { categoryId: category.id, changedFieldNames: Object.keys(input) },
    });

    return {
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async activateCategory(id: string, actorId: string): Promise<AssessmentCategoryManagementItem> {
    const updated = await this.prisma.assessmentCategory.update({
      where: { id },
      data: { isActive: true },
    }).catch(() => {
      throw new NotFoundException('ASSESSMENT_CATEGORY_NOT_FOUND');
    });

    await this.auditService.recordRequired({
      actorType: AuditActorType.USER,
      actorUserId: actorId,
      action: 'assessment.category.activated',
      targetType: 'AssessmentCategory',
      outcome: AuditOutcome.SUCCESS,
      metadata: { categoryId: id },
    });

    return {
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async deactivateCategory(id: string, actorId: string): Promise<AssessmentCategoryManagementItem> {
    const updated = await this.prisma.assessmentCategory.update({
      where: { id },
      data: { isActive: false },
    }).catch(() => {
      throw new NotFoundException('ASSESSMENT_CATEGORY_NOT_FOUND');
    });

    await this.auditService.recordRequired({
      actorType: AuditActorType.USER,
      actorUserId: actorId,
      action: 'assessment.category.deactivated',
      targetType: 'AssessmentCategory',
      outcome: AuditOutcome.SUCCESS,
      metadata: { categoryId: id },
    });

    return {
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async reorderCategories(input: ReorderAssessmentCategoriesInput, actorId: string): Promise<void> {
    const parsed = reorderAssessmentCategoriesSchema.safeParse(input);
    if (!parsed.success) throw new BadRequestException('INVALID_REORDER_INPUT');
    const validData = parsed.data;

    await this.prisma.$transaction(async (tx) => {
      for (let i = 0; i < validData.categoryIds.length; i++) {
        await tx.assessmentCategory.update({
          where: { id: validData.categoryIds[i] },
          data: { sortOrder: i + 1 },
        });
      }
    });

    await this.auditService.recordRequired({
      actorType: AuditActorType.USER,
      actorUserId: actorId,
      action: 'assessment.category.reordered',
      targetType: 'AssessmentCategory',
      outcome: AuditOutcome.SUCCESS,
      metadata: { count: input.categoryIds.length },
    });
  }
}
