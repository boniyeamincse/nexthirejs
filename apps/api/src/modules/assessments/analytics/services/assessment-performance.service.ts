import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { AssessmentAnalyticsRepository } from '../repositories/assessment-analytics.repository';
import { AssessmentPerformanceAggregationService } from './assessment-performance-aggregation.service';
import { AuditService } from '../../../audit/audit.service';
import { AuditActorType } from '@nexthire/types';
import { ASSESSMENT_ERROR_CODES } from '@nexthire/constants';
import type { AssessmentPerformanceReport, AssessmentPerformanceQuery } from '@nexthire/types';

@Injectable()
export class AssessmentPerformanceService {
  private readonly logger = new Logger(AssessmentPerformanceService.name);

  constructor(
    private readonly repository: AssessmentAnalyticsRepository,
    private readonly aggregation: AssessmentPerformanceAggregationService,
    private readonly auditService: AuditService,
  ) {}

  async getReport(candidateId: string, query: AssessmentPerformanceQuery): Promise<AssessmentPerformanceReport> {
    const filters: any = {};
    if (query.dateFrom) filters.dateFrom = new Date(query.dateFrom);
    if (query.dateTo) filters.dateTo = new Date(query.dateTo);
    if (query.assessmentType) filters.assessmentType = query.assessmentType;
    if (query.difficulty) filters.difficulty = query.difficulty;
    if (query.category) filters.categoryId = query.category;

    const attempts = await this.repository.findFinalizedAttemptsByCandidate(candidateId, filters);

    const report: AssessmentPerformanceReport = {
      summary: this.aggregation.computeSummary(attempts),
      trend: this.aggregation.computeTrend(attempts),
      byCategory: this.aggregation.computeCategoryBreakdown(attempts),
      byType: this.aggregation.computeTypeBreakdown(attempts),
      byDifficulty: this.aggregation.computeDifficultyBreakdown(attempts),
      recentActivity: this.aggregation.computeRecentActivity(attempts),
    };

    const filterNames: string[] = [];
    if (query.dateFrom) filterNames.push('dateFrom');
    if (query.dateTo) filterNames.push('dateTo');
    if (query.assessmentType) filterNames.push('assessmentType');
    if (query.difficulty) filterNames.push('difficulty');
    if (query.category) filterNames.push('category');

    let dateRangeDays: number | undefined;
    if (query.dateFrom && query.dateTo) {
      dateRangeDays = Math.round((new Date(query.dateTo).getTime() - new Date(query.dateFrom).getTime()) / (1000 * 60 * 60 * 24));
    }

    await this.auditService.recordBestEffort({
      actorType: AuditActorType.USER,
      actorUserId: candidateId,
      action: 'assessment.performance_report.viewed',
      targetType: 'AssessmentAttempt',
      metadata: {
        resultCount: attempts.length,
        filterNames,
        dateRangeDays,
      },
    });

    return report;
  }
}
