import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '../../../../generated/prisma/client';
import { AssessmentResultRepository } from '../repositories/assessment-result.repository';
import { AssessmentResultMapperService } from './assessment-result-mapper.service';
import { AuditService } from '../../../audit/audit.service';
import { AuditActorType } from '@nexthire/types';
import type {
  AssessmentAttemptResultStatus,
  AssessmentAttemptFinalizationReason,
  AssessmentType,
  AssessmentDifficulty,
  AssessmentResultHistoryResponse,
} from '@nexthire/types';

export interface HistoryQueryParams {
  page: number;
  pageSize: number;
  search?: string;
  resultStatus?: AssessmentAttemptResultStatus;
  finalizationReason?: AssessmentAttemptFinalizationReason;
  assessmentType?: AssessmentType;
  difficulty?: AssessmentDifficulty;
  dateFrom?: string;
  dateTo?: string;
}

@Injectable()
export class AssessmentResultHistoryService {
  private readonly logger = new Logger(AssessmentResultHistoryService.name);

  constructor(
    private readonly repository: AssessmentResultRepository,
    private readonly mapper: AssessmentResultMapperService,
    private readonly auditService: AuditService,
  ) {}

  async listHistory(candidateId: string, query: HistoryQueryParams): Promise<AssessmentResultHistoryResponse> {
    const where = this.buildWhereClause(candidateId, query);

    const totalItems = await this.repository.countCandidateAttempts(candidateId, where.where);
    const totalPages = Math.ceil(totalItems / query.pageSize) || 0;
    const skip = (query.page - 1) * query.pageSize;

    const orderBy: Prisma.AssessmentAttemptOrderByWithRelationInput = {
      submittedAt: { sort: 'desc', nulls: 'last' },
    };

    const attempts = await this.repository.findCandidateAttempts(
      candidateId,
      skip,
      query.pageSize,
      orderBy,
      where.where,
    );

    const attemptsWithData = attempts as unknown as Prisma.AssessmentAttemptGetPayload<{
      include: {
        questions: { include: { options: true; answer: true }; orderBy: { sortOrder: 'asc' } };
        sections: { orderBy: { sortOrder: 'asc' } };
      };
    }>[];

    const items = attemptsWithData.map((a) => this.mapper.toHistoryItem(a as any, null));

    await this.auditService.recordBestEffort({
      actorType: AuditActorType.USER,
      actorUserId: candidateId,
      action: 'assessment.result_history.viewed',
      targetType: 'AssessmentAttempt',
      metadata: {
        page: query.page,
        pageSize: query.pageSize,
        resultCount: items.length,
      },
    });

    return {
      items,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        totalItems,
        totalPages,
      },
      filters: {
        resultStatuses: ['PASSED', 'FAILED'] as AssessmentAttemptResultStatus[],
        finalizationReasons: ['CANDIDATE_SUBMITTED', 'DEADLINE_REACHED'] as AssessmentAttemptFinalizationReason[],
        assessmentTypes: ['PRACTICE', 'CERTIFICATION', 'SCREENING', 'SKILL_CHECK'] as AssessmentType[],
        difficulties: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'] as AssessmentDifficulty[],
      },
    };
  }

  private buildWhereClause(candidateId: string, query: HistoryQueryParams): {
    where: Prisma.AssessmentAttemptWhereInput;
  } {
    const andConditions: Prisma.AssessmentAttemptWhereInput[] = [];

    // Only finalized attempts
    andConditions.push({
      status: { in: ['SUBMITTED', 'EXPIRED'] },
    });

    // Must have scoring completed
    andConditions.push({
      scoringCompletedAt: { not: null },
    });

    if (query.resultStatus) {
      andConditions.push({ resultStatus: query.resultStatus });
    }

    if (query.finalizationReason) {
      andConditions.push({ finalizationReason: query.finalizationReason });
    }

    if (query.search) {
      andConditions.push({
        OR: [
          { assessmentTitleSnapshot: { contains: query.search, mode: 'insensitive' } },
          { assessmentSlugSnapshot: { contains: query.search, mode: 'insensitive' } },
        ],
      });
    }

    if (query.dateFrom) {
      andConditions.push({
        submittedAt: { gte: new Date(query.dateFrom) },
      });
    }

    if (query.dateTo) {
      const dateTo = new Date(query.dateTo);
      dateTo.setHours(23, 59, 59, 999);
      andConditions.push({
        submittedAt: { lte: dateTo },
      });
    }

    return {
      where: { AND: andConditions },
    };
  }
}
