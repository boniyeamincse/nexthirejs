import { AuditActorType, AuditOutcome } from '@nexthire/types';
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { AuditService } from '../../../audit/audit.service';
import { CreateCourseInput, UpdateCourseInput } from '@nexthire/types';
import { createCourseSchema, updateCourseSchema } from '@nexthire/validation';
import { CourseStatus } from '@nexthire/types';
import { LEARNING_ERROR_CODES } from '@nexthire/constants';

@Injectable()
export class CourseAuthoringService {
  private readonly logger = new Logger(CourseAuthoringService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async createCourse(actorUserId: string, requestId: string, input: CreateCourseInput) {
    const validated = createCourseSchema.safeParse(input);
    if (!validated.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: validated.error.errors,
      });
    }

    const { categoryId, slug } = validated.data;

    const category = await this.prisma.courseCategory.findUnique({ where: { id: categoryId } });
    if (!category) {
      throw new NotFoundException(LEARNING_ERROR_CODES.COURSE_CATEGORY_NOT_FOUND);
    }
    if (!category.isActive) {
      throw new BadRequestException(LEARNING_ERROR_CODES.COURSE_CATEGORY_INACTIVE);
    }

    const existing = await this.prisma.course.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException(LEARNING_ERROR_CODES.COURSE_SLUG_ALREADY_EXISTS);
    }

    const course = await this.prisma.course.create({
      data: {
        ...validated.data,
        status: CourseStatus.DRAFT,
        moduleCount: 0,
        lessonCount: 0,
        publicationVersion: 0,
        createdById: actorUserId,
        updatedById: actorUserId,
      },
    });

    await this.audit.recordRequired({
      actorType: AuditActorType.USER,
      outcome: AuditOutcome.SUCCESS,
      action: 'learning.course.created',
      actorUserId,
      requestId,
      targetId: course.id,
      targetType: 'Course',
      metadata: { title: course.title, slug: course.slug, categoryId: course.categoryId },
    });

    return course;
  }

  async updateCourse(
    actorUserId: string,
    requestId: string,
    courseId: string,
    input: UpdateCourseInput,
  ) {
    const validated = updateCourseSchema.safeParse(input);
    if (!validated.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: validated.error.errors,
      });
    }

    const existing = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!existing) {
      throw new NotFoundException(LEARNING_ERROR_CODES.COURSE_NOT_FOUND);
    }

    if (existing.status === CourseStatus.PUBLISHED) {
      const blockedKeys = ['categoryId', 'title', 'slug', 'difficulty'];
      for (const key of blockedKeys) {
        if (validated.data[key as keyof UpdateCourseInput] !== undefined) {
          throw new BadRequestException(LEARNING_ERROR_CODES.COURSE_INVALID_TRANSITION);
        }
      }
    }

    if (validated.data.categoryId && validated.data.categoryId !== existing.categoryId) {
      const category = await this.prisma.courseCategory.findUnique({
        where: { id: validated.data.categoryId },
      });
      if (!category) throw new NotFoundException(LEARNING_ERROR_CODES.COURSE_CATEGORY_NOT_FOUND);
      if (!category.isActive)
        throw new BadRequestException(LEARNING_ERROR_CODES.COURSE_CATEGORY_INACTIVE);
    }

    if (validated.data.slug && validated.data.slug !== existing.slug) {
      const slugExists = await this.prisma.course.findUnique({
        where: { slug: validated.data.slug },
      });
      if (slugExists) throw new ConflictException(LEARNING_ERROR_CODES.COURSE_SLUG_ALREADY_EXISTS);
    }

    const updated = await this.prisma.course.update({
      where: { id: courseId },
      data: { ...validated.data, updatedById: actorUserId },
    });

    await this.audit.recordRequired({
      actorType: AuditActorType.USER,
      outcome: AuditOutcome.SUCCESS,
      action: 'learning.course.updated',
      actorUserId,
      requestId,
      targetId: courseId,
      targetType: 'Course',
      metadata: { changedFields: Object.keys(validated.data) },
    });

    return updated;
  }

  async getCourseDetail(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        modules: {
          orderBy: { sortOrder: 'asc' },
          include: {
            lessons: { orderBy: { sortOrder: 'asc' } },
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException(LEARNING_ERROR_CODES.COURSE_NOT_FOUND);
    }

    return course;
  }

  async listCourses() {
    return this.prisma.course.findMany({
      orderBy: { updatedAt: 'desc' },
      include: { category: { select: { id: true, name: true } } },
    });
  }
}
