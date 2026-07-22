import { Injectable } from '@nestjs/common';
import type { AssessmentAttempt } from '../../../../generated/prisma/client';
import type {
  AssessmentAttemptResultStatus,
  AssessmentPerformanceSummary,
  AssessmentPerformanceTrendPoint,
  AssessmentPerformanceBreakdownItem,
  AssessmentAttemptHistoryActivityItem,
} from '@nexthire/types';

interface AttemptWithRelations extends AssessmentAttempt {
  assessment?: {
    id: string;
    title: string;
    slug: string;
    type: string;
    difficulty: string;
    categoryId: string;
    category?: { id: string; name: string } | null;
  } | null;
  questions?: { id: string; typeSnapshot: string; pointsSnapshot: any }[];
  answers?: { id: string; awardedPoints: any; isCorrect: boolean | null }[];
}

@Injectable()
export class AssessmentPerformanceAggregationService {

  computeSummary(attempts: AttemptWithRelations[]): AssessmentPerformanceSummary {
    if (attempts.length === 0) {
      return {
        totalFinalizedAttempts: 0,
        uniqueAssessmentsCompleted: 0,
        averagePercentage: 0,
        bestPercentage: 0,
        latestPercentage: 0,
        passedCount: 0,
        failedCount: 0,
        passRate: 0,
        totalQuestionsAnswered: 0,
        totalCorrect: 0,
        totalIncorrect: 0,
        totalUnanswered: 0,
      };
    }

    const percentages = attempts.map(a => Number(a.scorePercentage ?? 0));
    const averagePercentage = percentages.reduce((sum, p) => sum + p, 0) / percentages.length;
    const bestPercentage = percentages.length > 0 ? Math.max(...percentages) : 0;
    const latestPercentage = percentages.length > 0 ? percentages[0]! : 0;

    const passedCount = attempts.filter(a => a.resultStatus === ('PASSED' as AssessmentAttemptResultStatus)).length;
    const failedCount = attempts.filter(a => a.resultStatus === ('FAILED' as AssessmentAttemptResultStatus)).length;
    const passRate = (passedCount / attempts.length) * 100;

    const uniqueAssessments = new Set(attempts.map(a => a.assessmentId));
    const totalCorrect = attempts.reduce((sum, a) => sum + (a.correctCount ?? 0), 0);
    const totalIncorrect = attempts.reduce((sum, a) => sum + (a.incorrectCount ?? 0), 0);
    const totalUnanswered = attempts.reduce((sum, a) => sum + (a.unansweredCount ?? 0), 0);
    const totalQuestionsAnswered = totalCorrect + totalIncorrect;

    return {
      totalFinalizedAttempts: attempts.length,
      uniqueAssessmentsCompleted: uniqueAssessments.size,
      averagePercentage: Math.round(averagePercentage * 100) / 100,
      bestPercentage,
      latestPercentage,
      passedCount,
      failedCount,
      passRate: Math.round(passRate * 100) / 100,
      totalQuestionsAnswered,
      totalCorrect,
      totalIncorrect,
      totalUnanswered,
    };
  }

  computeTrend(attempts: AttemptWithRelations[]): AssessmentPerformanceTrendPoint[] {
    return attempts.slice(0, 20).map(a => ({
      attemptId: a.id,
      assessmentTitle: a.assessment?.title ?? a.assessmentTitleSnapshot,
      submittedAt: a.submittedAt?.toISOString() ?? '',
      percentage: Number(a.scorePercentage ?? 0),
      resultStatus: (a.resultStatus === 'PASSED' ? 'PASSED' : 'FAILED') as AssessmentAttemptResultStatus,
    }));
  }

  computeCategoryBreakdown(attempts: AttemptWithRelations[]): AssessmentPerformanceBreakdownItem[] {
    const categoryMap = new Map<string, { name: string; attempts: AttemptWithRelations[] }>();

    for (const a of attempts) {
      const catId = a.assessment?.categoryId ?? 'unknown';
      const catName = a.assessment?.category?.name ?? 'Unknown';
      if (!categoryMap.has(catId)) {
        categoryMap.set(catId, { name: catName, attempts: [] });
      }
      categoryMap.get(catId)!.attempts.push(a);
    }

    return Array.from(categoryMap.entries()).map(([key, data]) => {
      const percentages = data.attempts.map(a => Number(a.scorePercentage ?? 0));
      const avg = percentages.reduce((s, p) => s + p, 0) / data.attempts.length;
      const passed = data.attempts.filter(a => a.resultStatus === 'PASSED').length;
      const failed = data.attempts.filter(a => a.resultStatus === 'FAILED').length;
      return {
        key,
        label: data.name,
        attemptCount: data.attempts.length,
        averagePercentage: Math.round(avg * 100) / 100,
        bestPercentage: Math.max(...percentages),
        passedCount: passed,
        failedCount: failed,
        passRate: data.attempts.length > 0 ? Math.round((passed / data.attempts.length) * 100 * 100) / 100 : 0,
      };
    });
  }

  computeTypeBreakdown(attempts: AttemptWithRelations[]): AssessmentPerformanceBreakdownItem[] {
    return this.computeBreakdownByField(attempts, 'type', a => a.assessment?.type ?? 'UNKNOWN');
  }

  computeDifficultyBreakdown(attempts: AttemptWithRelations[]): AssessmentPerformanceBreakdownItem[] {
    return this.computeBreakdownByField(attempts, 'difficulty', a => a.assessment?.difficulty ?? 'UNKNOWN');
  }

  private computeBreakdownByField(
    attempts: AttemptWithRelations[],
    field: string,
    extractKey: (a: AttemptWithRelations) => string,
  ): AssessmentPerformanceBreakdownItem[] {
    const map = new Map<string, AttemptWithRelations[]>();
    for (const a of attempts) {
      const key = extractKey(a);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    }

    return Array.from(map.entries()).map(([key, items]) => {
      const percentages = items.map(a => Number(a.scorePercentage ?? 0));
      const avg = percentages.reduce((s, p) => s + p, 0) / items.length;
      const passed = items.filter(a => a.resultStatus === 'PASSED').length;
      return {
        key,
        label: key.charAt(0).toUpperCase() + key.slice(1).toLowerCase(),
        attemptCount: items.length,
        averagePercentage: Math.round(avg * 100) / 100,
        bestPercentage: Math.max(...percentages),
        passedCount: passed,
        failedCount: items.length - passed,
        passRate: Math.round((passed / items.length) * 100 * 100) / 100,
      };
    });
  }

  computeRecentActivity(attempts: AttemptWithRelations[]): AssessmentAttemptHistoryActivityItem[] {
    return attempts.slice(0, 10).map(a => ({
      attemptId: a.id,
      assessmentTitle: a.assessment?.title ?? a.assessmentTitleSnapshot,
      assessmentSlug: a.assessment?.slug ?? a.assessmentSlugSnapshot,
      submittedAt: a.submittedAt?.toISOString() ?? '',
      percentage: Number(a.scorePercentage ?? 0),
      resultStatus: (a.resultStatus === 'PASSED' ? 'PASSED' : 'FAILED') as AssessmentAttemptResultStatus,
    }));
  }
}
