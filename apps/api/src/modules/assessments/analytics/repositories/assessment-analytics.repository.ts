import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { Prisma } from '../../../../generated/prisma/client';

@Injectable()
export class AssessmentAnalyticsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findFinalizedAttemptsByCandidate(
    candidateId: string,
    filters?: {
      dateFrom?: Date;
      dateTo?: Date;
      assessmentType?: string;
      difficulty?: string;
      categoryId?: string;
    },
  ) {
    const where: Prisma.AssessmentAttemptWhereInput = {
      candidateId,
      status: { in: ['SUBMITTED', 'EXPIRED'] },
      scoringCompletedAt: { not: null },
    };

    if (filters?.dateFrom || filters?.dateTo) {
      where.submittedAt = {};
      if (filters.dateFrom) where.submittedAt.gte = filters.dateFrom;
      if (filters.dateTo) {
        const end = new Date(filters.dateTo);
        end.setHours(23, 59, 59, 999);
        where.submittedAt.lte = end;
      }
    }

    return this.prisma.assessmentAttempt.findMany({
      where: {
        ...where,
        ...(filters?.assessmentType ? { assessment: { type: filters.assessmentType as any } } : {}),
        ...(filters?.difficulty ? { assessment: { difficulty: filters.difficulty as any } } : {}),
        ...(filters?.categoryId ? { assessment: { categoryId: filters.categoryId } } : {}),
      },
      include: {
        assessment: { select: { id: true, title: true, slug: true, type: true, difficulty: true, categoryId: true, category: { select: { id: true, name: true } } } },
        questions: { select: { id: true, typeSnapshot: true, pointsSnapshot: true } },
        answers: { select: { id: true, awardedPoints: true, isCorrect: true } },
      },
      orderBy: { submittedAt: { sort: 'desc', nulls: 'last' } },
    });
  }

  async findOptedInCandidates() {
    const privacies = await this.prisma.candidateProfilePrivacy.findMany({
      where: { leaderboardParticipationEnabled: true },
      select: { userId: true, leaderboardDisplayName: true, user: { select: { status: true, candidateProfile: { select: { fullName: true } } } } },
    });
    return privacies.filter(p => p.user.status === 'ACTIVE').map(p => ({
      userId: p.userId,
      displayName: p.leaderboardDisplayName || null,
      fullName: p.user.candidateProfile?.fullName || null,
    }));
  }

  async countCandidateFinalizedAttempts(candidateId: string): Promise<number> {
    return this.prisma.assessmentAttempt.count({
      where: { candidateId, status: { in: ['SUBMITTED', 'EXPIRED'] }, scoringCompletedAt: { not: null } },
    });
  }

  async getCandidateBestAttempt(assessmentId: string, candidateId: string) {
    return this.prisma.assessmentAttempt.findFirst({
      where: {
        assessmentId,
        candidateId,
        status: { in: ['SUBMITTED', 'EXPIRED'] },
        scoringCompletedAt: { not: null },
      },
      orderBy: [
        { scorePercentage: { sort: 'desc', nulls: 'last' } },
        { scoreEarned: { sort: 'desc', nulls: 'last' } },
        { unansweredCount: { sort: 'asc', nulls: 'last' } },
        { submittedAt: { sort: 'asc', nulls: 'last' } },
      ],
    });
  }

  async getAttemptById(attemptId: string) {
    return this.prisma.assessmentAttempt.findFirst({
      where: { id: attemptId },
      include: {
        assessment: { select: { id: true, title: true, slug: true, type: true, difficulty: true, categoryId: true, category: { select: { id: true, name: true } } } },
      },
    });
  }

  async getLeaderboardSettings(userId: string) {
    return this.prisma.candidateProfilePrivacy.findUnique({
      where: { userId },
      select: { leaderboardParticipationEnabled: true, leaderboardDisplayName: true, leaderboardEnabledAt: true },
    });
  }

  async updateLeaderboardSettings(userId: string, data: { leaderboardParticipationEnabled: boolean; leaderboardDisplayName?: string | null; leaderboardEnabledAt?: Date | null }) {
    return this.prisma.candidateProfilePrivacy.upsert({
      where: { userId },
      create: { userId, ...data, policyVersion: 'v1' },
      update: data,
      select: { leaderboardParticipationEnabled: true, leaderboardDisplayName: true, leaderboardEnabledAt: true },
    });
  }

  async findAssessmentBySlugOrId(slugOrId: string) {
    const result = await this.prisma.assessment.findFirst({
      where: { slug: slugOrId, status: { in: ['PUBLISHED', 'ARCHIVED'] } },
      select: { id: true, title: true, slug: true, categoryId: true },
    });
    if (result) return result;
    return this.prisma.assessment.findFirst({
      where: { id: slugOrId, status: { in: ['PUBLISHED', 'ARCHIVED'] } },
      select: { id: true, title: true, slug: true, categoryId: true },
    });
  }

  async findCategoryBySlugOrId(slugOrId: string) {
    const result = await this.prisma.assessmentCategory.findFirst({
      where: { slug: slugOrId, isActive: true },
      select: { id: true, name: true, slug: true },
    });
    if (result) return result;
    return this.prisma.assessmentCategory.findFirst({
      where: { id: slugOrId, isActive: true },
      select: { id: true, name: true, slug: true },
    });
  }

  async findAssessmentAttemptsForLeaderboard(assessmentId: string, optedInUserIds: string[], skip: number, take: number) {
    const attempts = await this.prisma.assessmentAttempt.findMany({
      where: {
        assessmentId,
        candidateId: { in: optedInUserIds },
        status: { in: ['SUBMITTED', 'EXPIRED'] },
        scoringCompletedAt: { not: null },
      },
      include: {
        candidate: { select: { id: true, candidateProfile: { select: { fullName: true } } } },
      },
      orderBy: [
        { scorePercentage: { sort: 'desc', nulls: 'last' } },
        { scoreEarned: { sort: 'desc', nulls: 'last' } },
        { unansweredCount: { sort: 'asc', nulls: 'last' } },
        { submittedAt: { sort: 'asc', nulls: 'last' } },
      ],
    });

    return attempts;
  }

  async countAssessmentAttemptsForLeaderboard(assessmentId: string, optedInUserIds: string[]) {
    const candidates = await this.prisma.assessmentAttempt.groupBy({
      by: ['candidateId'],
      where: {
        assessmentId,
        candidateId: { in: optedInUserIds },
        status: { in: ['SUBMITTED', 'EXPIRED'] },
        scoringCompletedAt: { not: null },
      },
      _count: true,
    });
    return candidates.length;
  }

  async findCategoryAssessments(categoryId: string) {
    return this.prisma.assessment.findMany({
      where: { categoryId, status: { in: ['PUBLISHED', 'ARCHIVED'] } },
      select: { id: true },
    });
  }

  async findOptedInCandidateAttemptsForAssessments(assessmentIds: string[], optedInUserIds: string[]) {
    return this.prisma.assessmentAttempt.findMany({
      where: {
        assessmentId: { in: assessmentIds },
        candidateId: { in: optedInUserIds },
        status: { in: ['SUBMITTED', 'EXPIRED'] },
        scoringCompletedAt: { not: null },
      },
      include: {
        candidate: { select: { id: true, candidateProfile: { select: { fullName: true } } } },
      },
      orderBy: [
        { scorePercentage: { sort: 'desc', nulls: 'last' } },
        { scoreEarned: { sort: 'desc', nulls: 'last' } },
        { unansweredCount: { sort: 'asc', nulls: 'last' } },
        { submittedAt: { sort: 'asc', nulls: 'last' } },
      ],
    });
  }

  async getMyBestAttemptForAssessment(assessmentId: string, candidateId: string) {
    return this.prisma.assessmentAttempt.findFirst({
      where: {
        assessmentId,
        candidateId,
        status: { in: ['SUBMITTED', 'EXPIRED'] },
        scoringCompletedAt: { not: null },
      },
      orderBy: [
        { scorePercentage: { sort: 'desc', nulls: 'last' } },
        { scoreEarned: { sort: 'desc', nulls: 'last' } },
        { unansweredCount: { sort: 'asc', nulls: 'last' } },
        { submittedAt: { sort: 'asc', nulls: 'last' } },
      ],
      select: {
        id: true,
        scoreEarned: true,
        scorePossible: true,
        scorePercentage: true,
        unansweredCount: true,
        startedAt: true,
        submittedAt: true,
        durationMinutesSnapshot: true,
      },
    });
  }
}
