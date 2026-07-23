import { AuditActorType, AuditOutcome } from '@nexthire/types';
import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { AuditService } from '../../../audit/audit.service';
import { CreateCourseModuleInput, UpdateCourseModuleInput } from '@nexthire/types';
import {
  createCourseModuleSchema,
  updateCourseModuleSchema,
  reorderCourseModulesSchema,
} from '@nexthire/validation';
import { CourseStatus } from '@nexthire/types';
import { LEARNING_ERROR_CODES } from '@nexthire/constants';

const MAX_MODULES_PER_COURSE = 30;

@Injectable()
export class CourseModuleService {
  private readonly logger = new Logger(CourseModuleService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private async assertCourseEditable(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { status: true },
    });
    if (!course) throw new NotFoundException(LEARNING_ERROR_CODES.COURSE_NOT_FOUND);
    if (course.status === CourseStatus.PUBLISHED) {
      throw new BadRequestException(LEARNING_ERROR_CODES.COURSE_INVALID_TRANSITION);
    }
    return course;
  }

  async createModule(
    actorUserId: string,
    requestId: string,
    courseId: string,
    input: CreateCourseModuleInput,
  ) {
    const validated = createCourseModuleSchema.safeParse(input);
    if (!validated.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: validated.error.errors,
      });
    }

    await this.assertCourseEditable(courseId);

    const count = await this.prisma.courseModule.count({ where: { courseId } });
    if (count >= MAX_MODULES_PER_COURSE) {
      throw new BadRequestException(LEARNING_ERROR_CODES.COURSE_INVALID_TRANSITION);
    }

    const maxOrderAgg = await this.prisma.courseModule.aggregate({
      where: { courseId },
      _max: { sortOrder: true },
    });
    const currentMax = maxOrderAgg._max.sortOrder ?? 0;

    const courseModule = await this.prisma.$transaction(async (tx) => {
      const created = await tx.courseModule.create({
        data: { ...validated.data, courseId, sortOrder: currentMax + 1 },
      });
      await tx.course.update({ where: { id: courseId }, data: { moduleCount: { increment: 1 } } });
      return created;
    });

    await this.audit.recordRequired({
      actorType: AuditActorType.USER,
      outcome: AuditOutcome.SUCCESS,
      action: 'learning.course_module.created',
      actorUserId,
      requestId,
      targetId: courseId,
      targetType: 'Course',
      metadata: { moduleId: courseModule.id, title: courseModule.title },
    });

    return courseModule;
  }

  async updateModule(
    actorUserId: string,
    requestId: string,
    courseId: string,
    moduleId: string,
    input: UpdateCourseModuleInput,
  ) {
    const validated = updateCourseModuleSchema.safeParse(input);
    if (!validated.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: validated.error.errors,
      });
    }

    await this.assertCourseEditable(courseId);

    const existing = await this.prisma.courseModule.findUnique({ where: { id: moduleId } });
    if (!existing || existing.courseId !== courseId) {
      throw new NotFoundException(LEARNING_ERROR_CODES.COURSE_MODULE_NOT_FOUND);
    }

    const updated = await this.prisma.courseModule.update({
      where: { id: moduleId },
      data: validated.data,
    });

    await this.audit.recordRequired({
      actorType: AuditActorType.USER,
      outcome: AuditOutcome.SUCCESS,
      action: 'learning.course_module.updated',
      actorUserId,
      requestId,
      targetId: courseId,
      targetType: 'Course',
      metadata: { moduleId, changedFields: Object.keys(validated.data) },
    });

    return updated;
  }

  async deleteModule(actorUserId: string, requestId: string, courseId: string, moduleId: string) {
    await this.assertCourseEditable(courseId);

    const existing = await this.prisma.courseModule.findUnique({
      where: { id: moduleId },
      include: { _count: { select: { lessons: true } } },
    });
    if (!existing || existing.courseId !== courseId) {
      throw new NotFoundException(LEARNING_ERROR_CODES.COURSE_MODULE_NOT_FOUND);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.courseModule.delete({ where: { id: moduleId } });
      const moduleCount = await tx.courseModule.count({ where: { courseId } });
      const lessonCount = await tx.lesson.count({ where: { courseModule: { courseId } } });
      await tx.course.update({ where: { id: courseId }, data: { moduleCount, lessonCount } });
    });

    await this.audit.recordRequired({
      actorType: AuditActorType.USER,
      outcome: AuditOutcome.SUCCESS,
      action: 'learning.course_module.deleted',
      actorUserId,
      requestId,
      targetId: courseId,
      targetType: 'Course',
      metadata: { moduleId, lessonsRemoved: existing._count.lessons },
    });
  }

  async reorderModules(
    actorUserId: string,
    requestId: string,
    courseId: string,
    orderedIds: string[],
  ) {
    const validated = reorderCourseModulesSchema.safeParse({ orderedIds });
    if (!validated.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: validated.error.errors,
      });
    }

    await this.assertCourseEditable(courseId);

    const existingModules = await this.prisma.courseModule.findMany({ where: { courseId } });
    if (existingModules.length !== orderedIds.length) {
      throw new BadRequestException(LEARNING_ERROR_CODES.COURSE_MODULE_NOT_FOUND);
    }
    const existingIds = existingModules.map((m) => m.id);
    for (const id of orderedIds) {
      if (!existingIds.includes(id)) {
        throw new BadRequestException(LEARNING_ERROR_CODES.COURSE_MODULE_NOT_FOUND);
      }
    }
    if (new Set(orderedIds).size !== orderedIds.length) {
      throw new BadRequestException(LEARNING_ERROR_CODES.COURSE_INVALID_TRANSITION);
    }

    await this.prisma.$transaction(async (tx) => {
      for (let i = 0; i < orderedIds.length; i++) {
        await tx.courseModule.update({ where: { id: orderedIds[i] }, data: { sortOrder: i + 1 } });
      }
    });

    await this.audit.recordRequired({
      actorType: AuditActorType.USER,
      outcome: AuditOutcome.SUCCESS,
      action: 'learning.course_module.reordered',
      actorUserId,
      requestId,
      targetId: courseId,
      targetType: 'Course',
      metadata: {},
    });
  }
}
