import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { CourseCategoryRepository } from '../../repositories/course-category.repository';
import { PrismaService } from '../../../../database/prisma.service';
import { AuditService } from '../../../audit/audit.service';
import {
  CreateCourseCategoryInput,
  UpdateCourseCategoryInput,
  CourseCategoryManagementItem,
  AuditActorType,
  AuditOutcome,
} from '@nexthire/types';
import { createCourseCategorySchema, updateCourseCategorySchema } from '@nexthire/validation';
import { LEARNING_ERROR_CODES } from '@nexthire/constants';

@Injectable()
export class CourseCategoryManagementService {
  constructor(
    private readonly categoryRepo: CourseCategoryRepository,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async listCategories(): Promise<CourseCategoryManagementItem[]> {
    const categories = await this.prisma.courseCategory.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return categories.map((c) => ({
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

  async createCategory(
    input: CreateCourseCategoryInput,
    actorId: string,
  ): Promise<CourseCategoryManagementItem> {
    const parsed = createCourseCategorySchema.safeParse(input);
    if (!parsed.success)
      throw new BadRequestException(LEARNING_ERROR_CODES.COURSE_CATEGORY_NOT_FOUND);
    const validData = parsed.data;

    const existing = await this.prisma.courseCategory.findUnique({
      where: { slug: validData.slug },
    });
    if (existing)
      throw new ConflictException(LEARNING_ERROR_CODES.COURSE_CATEGORY_SLUG_ALREADY_EXISTS);

    const category = await this.prisma.courseCategory.create({
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
      action: 'learning.category.created',
      targetType: 'CourseCategory',
      targetId: category.id,
      outcome: AuditOutcome.SUCCESS,
      metadata: { categoryId: category.id },
    });

    return {
      ...category,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    };
  }

  async updateCategory(
    id: string,
    input: UpdateCourseCategoryInput,
    actorId: string,
  ): Promise<CourseCategoryManagementItem> {
    const parsed = updateCourseCategorySchema.safeParse(input);
    if (!parsed.success)
      throw new BadRequestException(LEARNING_ERROR_CODES.COURSE_CATEGORY_NOT_FOUND);
    const validData = parsed.data;

    const category = await this.prisma.courseCategory.findUnique({ where: { id } });
    if (!category) throw new NotFoundException(LEARNING_ERROR_CODES.COURSE_CATEGORY_NOT_FOUND);

    if (validData.slug && validData.slug !== category.slug) {
      const existing = await this.prisma.courseCategory.findUnique({
        where: { slug: validData.slug },
      });
      if (existing)
        throw new ConflictException(LEARNING_ERROR_CODES.COURSE_CATEGORY_SLUG_ALREADY_EXISTS);
    }

    const updated = await this.prisma.courseCategory.update({
      where: { id },
      data: { ...validData },
    });

    await this.auditService.recordRequired({
      actorType: AuditActorType.USER,
      actorUserId: actorId,
      action: 'learning.category.updated',
      targetType: 'CourseCategory',
      targetId: category.id,
      outcome: AuditOutcome.SUCCESS,
      metadata: { categoryId: category.id, changedFieldNames: Object.keys(input) },
    });

    return {
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async activateCategory(id: string, actorId: string): Promise<CourseCategoryManagementItem> {
    const updated = await this.prisma.courseCategory
      .update({ where: { id }, data: { isActive: true } })
      .catch(() => {
        throw new NotFoundException(LEARNING_ERROR_CODES.COURSE_CATEGORY_NOT_FOUND);
      });

    await this.auditService.recordRequired({
      actorType: AuditActorType.USER,
      actorUserId: actorId,
      action: 'learning.category.activated',
      targetType: 'CourseCategory',
      targetId: id,
      outcome: AuditOutcome.SUCCESS,
      metadata: { categoryId: id },
    });

    return {
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async deactivateCategory(id: string, actorId: string): Promise<CourseCategoryManagementItem> {
    const updated = await this.prisma.courseCategory
      .update({ where: { id }, data: { isActive: false } })
      .catch(() => {
        throw new NotFoundException(LEARNING_ERROR_CODES.COURSE_CATEGORY_NOT_FOUND);
      });

    await this.auditService.recordRequired({
      actorType: AuditActorType.USER,
      actorUserId: actorId,
      action: 'learning.category.deactivated',
      targetType: 'CourseCategory',
      targetId: id,
      outcome: AuditOutcome.SUCCESS,
      metadata: { categoryId: id },
    });

    return {
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }
}
