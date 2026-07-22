import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AssessmentAnalyticsRepository } from '../repositories/assessment-analytics.repository';
import { LeaderboardIdentityService } from './leaderboard-identity.service';
import { AuditService } from '../../../audit/audit.service';
import { AuditActorType } from '@nexthire/types';
import { ASSESSMENT_ERROR_CODES } from '@nexthire/constants';
import type { CategoryLeaderboardResponse, CategoryLeaderboardEntry, MyLeaderboardRank, CategoryLeaderboardQuery } from '@nexthire/types';

@Injectable()
export class CategoryLeaderboardService {
  private readonly logger = new Logger(CategoryLeaderboardService.name);

  constructor(
    private readonly repository: AssessmentAnalyticsRepository,
    private readonly identityService: LeaderboardIdentityService,
    private readonly auditService: AuditService,
  ) {}

  async getLeaderboard(
    categoryIdOrSlug: string,
    currentUserId: string,
    query: CategoryLeaderboardQuery,
  ): Promise<CategoryLeaderboardResponse> {
    const category = await this.repository.findCategoryBySlugOrId(categoryIdOrSlug);
    if (!category) {
      throw new NotFoundException(ASSESSMENT_ERROR_CODES.CATEGORY_LEADERBOARD_NOT_FOUND);
    }

    const assessments = await this.repository.findCategoryAssessments(category.id);
    if (assessments.length === 0) {
      return {
        categoryName: category.name,
        entries: [],
        pagination: { page: query.page ?? 1, pageSize: query.pageSize ?? 25, totalItems: 0, totalPages: 0 },
        myRank: { rank: 0, eligible: false },
      };
    }

    const assessmentIds = assessments.map(a => a.id);
    const optedInCandidates = await this.repository.findOptedInCandidates();
    const optedInUserIds = optedInCandidates.map(c => c.userId);
    const isCurrentCandidateOptedIn = optedInUserIds.includes(currentUserId);

    const allAttempts = await this.repository.findOptedInCandidateAttemptsForAssessments(assessmentIds, optedInUserIds);

    // Group by candidate and compute aggregate
    const candidateData = this.computeCandidateAggregates(allAttempts, assessmentIds);

    // Sort by ranking rules
    const sorted = this.sortCandidates(candidateData);

    // Paginate
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;
    const totalItems = sorted.length;
    const totalPages = Math.ceil(totalItems / pageSize) || 0;
    const skip = (page - 1) * pageSize;
    const pageItems = sorted.slice(skip, skip + pageSize);

    const optedInMap = new Map(optedInCandidates.map(c => [c.userId, c]));
    const entries: CategoryLeaderboardEntry[] = pageItems.map((c, idx) => {
      const optedIn = optedInMap.get(c.candidateId);
      const displayName = optedIn
        ? this.identityService.resolveDisplayName(c.candidateId, {
            leaderboardDisplayName: optedIn?.displayName ?? null,
            fullName: optedIn?.fullName ?? null,
          })
        : 'Unknown';

      return {
        rank: skip + idx + 1,
        displayName: displayName as unknown as string,
        avatarUrl: null,
        averagePercentage: c.averagePercentage,
        bestPercentage: c.bestPercentage,
        completedAssessmentCount: c.completedCount,
        passedAssessmentCount: c.passedCount,
        passRate: c.passRate,
        isCurrentCandidate: c.candidateId === currentUserId,
      };
    });

    let myRank: MyLeaderboardRank | null = null;
    if (isCurrentCandidateOptedIn) {
      const myIdx = sorted.findIndex(c => c.candidateId === currentUserId);
      const hasAttempt = allAttempts.some(a => a.candidateId === currentUserId);
      myRank = {
        rank: myIdx >= 0 ? myIdx + 1 : 0,
        eligible: hasAttempt,
      };
    } else {
      myRank = { rank: 0, eligible: false };
    }

    await this.auditService.recordBestEffort({
      actorType: AuditActorType.USER,
      actorUserId: currentUserId,
      action: 'assessment.category_leaderboard.viewed',
      targetType: 'AssessmentCategory',
      targetId: category.id,
      metadata: {
        categoryId: category.id,
        page,
        pageSize,
        resultCount: entries.length,
        myRank: myRank?.rank,
      },
    });

    return {
      categoryName: category.name,
      entries,
      pagination: { page, pageSize, totalItems, totalPages },
      myRank,
    };
  }

  private computeCandidateAggregates(attempts: any[], assessmentIds: string[]) {
    const candidateMap = new Map<string, {
      bestAttempts: Map<string, any>;
      assessmentsWithAttempts: Set<string>;
    }>();

    for (const a of attempts) {
      if (!candidateMap.has(a.candidateId)) {
        candidateMap.set(a.candidateId, {
          bestAttempts: new Map(),
          assessmentsWithAttempts: new Set(),
        });
      }
      const data = candidateMap.get(a.candidateId)!;
      data.assessmentsWithAttempts.add(a.assessmentId);

      const existing = data.bestAttempts.get(a.assessmentId);
      if (!existing || this.isBetterAttempt(a, existing)) {
        data.bestAttempts.set(a.assessmentId, a);
      }
    }

    return Array.from(candidateMap.entries()).map(([candidateId, data]) => {
      const bestAttempts = Array.from(data.bestAttempts.values());
      const percentages = bestAttempts.map(a => Number(a.scorePercentage ?? 0));
      const avg = percentages.length > 0 ? percentages.reduce((s, p) => s + p, 0) / percentages.length : 0;
      const passed = bestAttempts.filter(a => a.resultStatus === 'PASSED').length;

      return {
        candidateId,
        averagePercentage: Math.round(avg * 100) / 100,
        bestPercentage: percentages.length > 0 ? Math.max(...percentages) : 0,
        completedCount: data.assessmentsWithAttempts.size,
        passedCount: passed,
        passRate: percentages.length > 0 ? Math.round((passed / percentages.length) * 100 * 100) / 100 : 0,
        latestSubmission: Math.max(...bestAttempts.map(a => a.submittedAt?.getTime() ?? 0)),
      };
    });
  }

  private sortCandidates(candidates: any[]) {
    return candidates.sort((a, b) => {
      if (a.averagePercentage !== b.averagePercentage) return b.averagePercentage - a.averagePercentage;
      if (a.completedCount !== b.completedCount) return b.completedCount - a.completedCount;
      if (a.passRate !== b.passRate) return b.passRate - a.passRate;
      if (a.bestPercentage !== b.bestPercentage) return b.bestPercentage - a.bestPercentage;
      if (a.latestSubmission !== b.latestSubmission) return a.latestSubmission - b.latestSubmission;
      return a.candidateId < b.candidateId ? -1 : 1;
    });
  }

  private isBetterAttempt(a: any, b: any): boolean {
    const aPct = Number(a.scorePercentage ?? 0);
    const bPct = Number(b.scorePercentage ?? 0);
    if (aPct !== bPct) return aPct > bPct;
    const aEarned = Number(a.scoreEarned ?? 0);
    const bEarned = Number(b.scoreEarned ?? 0);
    if (aEarned !== bEarned) return aEarned > bEarned;
    const aUnanswered = a.unansweredCount ?? 0;
    const bUnanswered = b.unansweredCount ?? 0;
    if (aUnanswered !== bUnanswered) return aUnanswered < bUnanswered;
    const aSubmitted = a.submittedAt?.getTime() ?? 0;
    const bSubmitted = b.submittedAt?.getTime() ?? 0;
    if (aSubmitted !== bSubmitted) return aSubmitted < bSubmitted;
    return a.id < b.id;
  }
}
