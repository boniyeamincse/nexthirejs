import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AssessmentAnalyticsRepository } from '../repositories/assessment-analytics.repository';
import { LeaderboardIdentityService } from './leaderboard-identity.service';
import { AuditService } from '../../../audit/audit.service';
import { AuditActorType } from '@nexthire/types';
import { ASSESSMENT_ERROR_CODES } from '@nexthire/constants';
import type { AssessmentLeaderboardResponse, AssessmentLeaderboardEntry, MyLeaderboardRank, AssessmentLeaderboardQuery } from '@nexthire/types';

@Injectable()
export class AssessmentLeaderboardService {
  private readonly logger = new Logger(AssessmentLeaderboardService.name);

  constructor(
    private readonly repository: AssessmentAnalyticsRepository,
    private readonly identityService: LeaderboardIdentityService,
    private readonly auditService: AuditService,
  ) {}

  async getLeaderboard(
    assessmentIdOrSlug: string,
    currentUserId: string,
    query: AssessmentLeaderboardQuery,
  ): Promise<AssessmentLeaderboardResponse> {
    const assessment = await this.repository.findAssessmentBySlugOrId(assessmentIdOrSlug);
    if (!assessment) {
      throw new NotFoundException(ASSESSMENT_ERROR_CODES.ASSESSMENT_LEADERBOARD_NOT_FOUND);
    }

    const optedInCandidates = await this.repository.findOptedInCandidates();
    const optedInUserIds = optedInCandidates.map(c => c.userId);

    const isCurrentCandidateOptedIn = optedInUserIds.includes(currentUserId);

    const totalItems = await this.repository.countAssessmentAttemptsForLeaderboard(assessment.id, optedInUserIds);
    const totalPages = Math.ceil(totalItems / (query.pageSize ?? 25)) || 0;
    const skip = ((query.page ?? 1) - 1) * (query.pageSize ?? 25);

    const attempts = await this.repository.findAssessmentAttemptsForLeaderboard(
      assessment.id,
      optedInUserIds,
      skip,
      query.pageSize ?? 25,
    );

    const bestAttempts = this.selectBestAttempts(attempts);

    const optedInMap = new Map(optedInCandidates.map(c => [c.userId, c]));
    const entries: AssessmentLeaderboardEntry[] = bestAttempts.map((a, idx) => {
      const optedIn = optedInMap.get(a.candidateId);
      const displayName = optedIn
        ? this.identityService.resolveDisplayName(a.candidateId, {
            leaderboardDisplayName: optedIn?.displayName ?? null,
            fullName: optedIn?.fullName ?? null,
          })
        : 'Unknown';

      return {
        rank: skip + idx + 1,
        displayName: displayName as unknown as string,
        avatarUrl: null,
        percentage: Number(a.scorePercentage ?? 0),
        scoreEarned: Number(a.scoreEarned ?? 0),
        scorePossible: Number(a.scorePossible ?? 0),
        unansweredCount: a.unansweredCount ?? 0,
        durationSeconds: this.computeDurationSeconds(a.startedAt, a.submittedAt),
        submittedAt: a.submittedAt?.toISOString() ?? '',
        isCurrentCandidate: a.candidateId === currentUserId,
      };
    });

    let myRank: MyLeaderboardRank | null = null;
    if (isCurrentCandidateOptedIn) {
      const myBest = await this.repository.getMyBestAttemptForAssessment(assessment.id, currentUserId);
      if (myBest) {
        const rank = await this.computeMyRank(assessment.id, currentUserId, optedInUserIds);
        myRank = { rank, eligible: true };
      } else {
        myRank = { rank: 0, eligible: false };
      }
    } else {
      myRank = { rank: 0, eligible: false };
    }

    await this.auditService.recordBestEffort({
      actorType: AuditActorType.USER,
      actorUserId: currentUserId,
      action: 'assessment.leaderboard.viewed',
      targetType: 'Assessment',
      targetId: assessment.id,
      metadata: {
        assessmentId: assessment.id,
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 25,
        resultCount: entries.length,
        myRank: myRank?.rank,
      },
    });

    return {
      assessmentTitle: assessment.title,
      assessmentSlug: assessment.slug,
      entries,
      pagination: {
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 25,
        totalItems,
        totalPages,
      },
      myRank,
    };
  }

  private selectBestAttempts(attempts: any[]) {
    const bestMap = new Map<string, any>();
    for (const a of attempts) {
      const existing = bestMap.get(a.candidateId);
      if (!existing || this.isBetterAttempt(a, existing)) {
        bestMap.set(a.candidateId, a);
      }
    }
    return Array.from(bestMap.values());
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
    const aDuration = this.computeDurationSeconds(a.startedAt, a.submittedAt);
    const bDuration = this.computeDurationSeconds(b.startedAt, b.submittedAt);
    if (aDuration !== bDuration) return aDuration < bDuration;
    const aSubmitted = a.submittedAt?.getTime() ?? 0;
    const bSubmitted = b.submittedAt?.getTime() ?? 0;
    if (aSubmitted !== bSubmitted) return aSubmitted < bSubmitted;
    return a.id < b.id;
  }

  private async computeMyRank(assessmentId: string, currentUserId: string, optedInUserIds: string[]): Promise<number> {
    const allAttempts = await this.repository.findAssessmentAttemptsForLeaderboard(
      assessmentId,
      optedInUserIds,
      0,
      10000,
    );
    const bestAttempts = this.selectBestAttempts(allAttempts);
    const sorted = bestAttempts.sort((a, b) => this.isBetterAttempt(a, b) ? -1 : 1);
    const idx = sorted.findIndex(a => a.candidateId === currentUserId);
    return idx >= 0 ? idx + 1 : 0;
  }

  private computeDurationSeconds(startedAt: Date, submittedAt: Date | null): number {
    if (!submittedAt) return 0;
    return Math.round((submittedAt.getTime() - startedAt.getTime()) / 1000);
  }
}
