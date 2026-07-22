import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { AuditService } from '../../audit/audit.service';
import { AuditActorType, AuditOutcome } from '@nexthire/types';
import { AssessmentRepository } from '../repositories/assessment.repository';
import { AssessmentCategoryRepository } from '../repositories/assessment-category.repository';
import { assessmentCatalogQuerySchema } from '@nexthire/validation';
import type { AssessmentCatalogQueryInput } from '@nexthire/validation';
import type {
  AssessmentCatalogItem,
  AssessmentCatalogDetail,
  PaginatedAssessmentCatalogResult,
} from '@nexthire/types';
import {
  AssessmentType,
  AssessmentDifficulty,
  AssessmentAvailability,
} from '@nexthire/types';

@Injectable()
export class AssessmentCatalogService {
  private readonly logger = new Logger(AssessmentCatalogService.name);

  constructor(
    private readonly assessmentRepository: AssessmentRepository,
    private readonly categoryRepository: AssessmentCategoryRepository,
    private readonly auditService: AuditService,
  ) {}

  async listCatalog(
    userId: string,
    query: AssessmentCatalogQueryInput,
  ): Promise<PaginatedAssessmentCatalogResult> {
    const parsed = assessmentCatalogQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new BadRequestException('ASSESSMENT_CATALOG_QUERY_INVALID');
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
    if (filters.type) {
      where.type = filters.type;
    }
    if (filters.difficulty) {
      where.difficulty = filters.difficulty;
    }
    if (filters.availability) {
      where.availability = filters.availability;
    }
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { shortDescription: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 12;
    const skip = (page - 1) * pageSize;

    const [items, totalItems, activeCategories] = await Promise.all([
      this.assessmentRepository.findPublishedCatalog(
        where as never,
        [
          { category: { sortOrder: 'asc' } },
          { title: 'asc' },
          { id: 'asc' },
        ],
        skip,
        pageSize,
      ),
      this.assessmentRepository.countPublishedCatalog(where as never),
      this.categoryRepository.findActive(),
    ]);

    const typeValues: AssessmentType[] = [AssessmentType.PRACTICE, AssessmentType.CERTIFICATION, AssessmentType.SCREENING, AssessmentType.SKILL_CHECK];
    const difficultyValues: AssessmentDifficulty[] = [AssessmentDifficulty.BEGINNER, AssessmentDifficulty.INTERMEDIATE, AssessmentDifficulty.ADVANCED, AssessmentDifficulty.EXPERT];
    const availabilityValues: AssessmentAvailability[] = [AssessmentAvailability.AVAILABLE, AssessmentAvailability.COMING_SOON, AssessmentAvailability.UNAVAILABLE];

    void this.auditService.recordRequired({
      actorType: AuditActorType.USER,
      actorUserId: userId,
      action: 'assessment.catalog.viewed',
      targetType: 'Assessment',
      outcome: AuditOutcome.SUCCESS,
      metadata: {
        page,
        pageSize,
        resultCount: items.length,
        hasSearch: !!filters.search,
        filterCategory: filters.category,
        filterType: filters.type,
        filterDifficulty: filters.difficulty,
        filterAvailability: filters.availability,
      },
    });

    return {
      items: items.map((item) => ({
        id: item.id,
        slug: item.slug,
        title: item.title,
        shortDescription: item.shortDescription,
        category: item.category,
        type: item.type as AssessmentType,
        difficulty: item.difficulty as AssessmentDifficulty,
        availability: item.availability as AssessmentAvailability,
        estimatedDurationMinutes: item.estimatedDurationMinutes,
        questionCount: item.questionCount,
        publishedAt: item.publishedAt?.toISOString() ?? null,
      })),
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize),
      },
      filters: {
        categories: activeCategories,
        types: typeValues,
        difficulties: difficultyValues,
        availability: availabilityValues,
      },
    };
  }

  async getDetail(userId: string, identifier: string): Promise<AssessmentCatalogDetail> {
    const assessment = await this.assessmentRepository.findPublishedByIdOrSlug(identifier);

    if (!assessment) {
      void this.auditService.recordRequired({
        actorType: AuditActorType.USER,
        actorUserId: userId,
        action: 'assessment.catalog_item.viewed',
        targetType: 'Assessment',
        targetId: identifier,
        outcome: AuditOutcome.DENIED,
        metadata: { assessmentId: identifier, found: false },
      });
      throw new NotFoundException('ASSESSMENT_NOT_FOUND');
    }

    void this.auditService.recordRequired({
      actorType: AuditActorType.USER,
      actorUserId: userId,
      action: 'assessment.catalog_item.viewed',
      targetType: 'Assessment',
      targetId: assessment.id,
      outcome: AuditOutcome.SUCCESS,
      metadata: {
        assessmentId: assessment.id,
        categoryId: assessment.categoryId,
      },
    });

    return {
      id: assessment.id,
      slug: assessment.slug,
      title: assessment.title,
      shortDescription: assessment.shortDescription,
      description: assessment.description,
      instructions: assessment.instructions,
      category: assessment.category,
      type: assessment.type as AssessmentType,
      difficulty: assessment.difficulty as AssessmentDifficulty,
      availability: assessment.availability as AssessmentAvailability,
      estimatedDurationMinutes: assessment.estimatedDurationMinutes,
      questionCount: assessment.questionCount,
      publishedAt: assessment.publishedAt?.toISOString() ?? null,
    };
  }
}
