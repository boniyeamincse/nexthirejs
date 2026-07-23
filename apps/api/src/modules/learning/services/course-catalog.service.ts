import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { AuditService } from '../../audit/audit.service';
import { AuditActorType, AuditOutcome } from '@nexthire/types';
import { CourseRepository } from '../repositories/course.repository';
import { CourseCategoryRepository } from '../repositories/course-category.repository';
import { courseCatalogQuerySchema } from '@nexthire/validation';
import type { CourseCatalogQueryInput } from '@nexthire/validation';
import type {
  CourseCatalogItem,
  CourseCatalogDetail,
  PaginatedCourseCatalogResult,
} from '@nexthire/types';
import { CourseDifficulty, CourseEnrollmentStatus, LessonContentType } from '@nexthire/types';
import { PrismaService } from '../../../database/prisma.service';
import { LEARNING_ERROR_CODES } from '@nexthire/constants';

@Injectable()
export class CourseCatalogService {
  private readonly logger = new Logger(CourseCatalogService.name);

  constructor(
    private readonly courseRepository: CourseRepository,
    private readonly categoryRepository: CourseCategoryRepository,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async listCatalog(
    userId: string,
    query: CourseCatalogQueryInput,
  ): Promise<PaginatedCourseCatalogResult> {
    const parsed = courseCatalogQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new BadRequestException(LEARNING_ERROR_CODES.COURSE_CATALOG_QUERY_INVALID);
    }

    const filters = parsed.data;

    const where: Record<string, unknown> = {
      status: 'PUBLISHED',
      visibility: 'CANDIDATE_CATALOG',
      category: { isActive: true },
    };

    if (filters.category) {
      where.category = { ...(where.category as Record<string, unknown>), slug: filters.category };
    }
    if (filters.difficulty) {
      where.difficulty = filters.difficulty;
    }
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { summary: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 12;
    const skip = (page - 1) * pageSize;

    const [items, totalItems, activeCategories] = await Promise.all([
      this.courseRepository.findPublishedCatalog(
        where as never,
        [{ category: { sortOrder: 'asc' } }, { title: 'asc' }, { id: 'asc' }],
        skip,
        pageSize,
      ),
      this.courseRepository.countPublishedCatalog(where as never),
      this.categoryRepository.findActive(),
    ]);

    const difficultyValues: CourseDifficulty[] = [
      CourseDifficulty.BEGINNER,
      CourseDifficulty.INTERMEDIATE,
      CourseDifficulty.ADVANCED,
      CourseDifficulty.EXPERT,
    ];

    void this.auditService.recordBestEffort({
      actorType: AuditActorType.USER,
      actorUserId: userId,
      action: 'learning.catalog.viewed',
      targetType: 'Course',
      outcome: AuditOutcome.SUCCESS,
      metadata: {
        page,
        pageSize,
        resultCount: items.length,
        hasSearch: !!filters.search,
        filterCategory: filters.category,
        filterDifficulty: filters.difficulty,
      },
    });

    const catalogItems: CourseCatalogItem[] = items.map((item) => ({
      id: item.id,
      slug: item.slug,
      title: item.title,
      summary: item.summary,
      category: item.category,
      difficulty: item.difficulty as CourseDifficulty,
      estimatedDurationMinutes: item.estimatedDurationMinutes,
      moduleCount: item.moduleCount,
      lessonCount: item.lessonCount,
      publishedAt: item.publishedAt?.toISOString() ?? null,
    }));

    return {
      items: catalogItems,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize),
      },
      filters: {
        categories: activeCategories,
        difficulties: difficultyValues,
      },
    };
  }

  async getDetail(userId: string, identifier: string): Promise<CourseCatalogDetail> {
    const course = await this.courseRepository.findPublishedByIdOrSlug(identifier);

    if (!course) {
      throw new NotFoundException(LEARNING_ERROR_CODES.COURSE_NOT_FOUND);
    }

    const enrollment = await this.prisma.courseEnrollment.findUnique({
      where: { candidateId_courseId: { candidateId: userId, courseId: course.id } },
      select: { id: true, status: true, progressPercentage: true },
    });

    void this.auditService.recordBestEffort({
      actorType: AuditActorType.USER,
      actorUserId: userId,
      action: 'learning.catalog_item.viewed',
      targetType: 'Course',
      targetId: course.id,
      outcome: AuditOutcome.SUCCESS,
      metadata: { courseId: course.id, categoryId: course.categoryId },
    });

    return {
      id: course.id,
      slug: course.slug,
      title: course.title,
      summary: course.summary,
      description: course.description,
      category: course.category,
      difficulty: course.difficulty as CourseDifficulty,
      estimatedDurationMinutes: course.estimatedDurationMinutes,
      moduleCount: course.moduleCount,
      lessonCount: course.lessonCount,
      publishedAt: course.publishedAt?.toISOString() ?? null,
      modules: course.modules.map((courseModule) => ({
        id: courseModule.id,
        title: courseModule.title,
        description: courseModule.description,
        sortOrder: courseModule.sortOrder,
        lessons: courseModule.lessons.map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          contentType: lesson.contentType as LessonContentType,
          durationMinutes: lesson.durationMinutes,
          sortOrder: lesson.sortOrder,
        })),
      })),
      enrollment: {
        enrolled: !!enrollment,
        enrollmentId: enrollment?.id ?? null,
        status: (enrollment?.status as CourseEnrollmentStatus) ?? null,
        progressPercentage: enrollment?.progressPercentage ?? null,
      },
    };
  }
}
