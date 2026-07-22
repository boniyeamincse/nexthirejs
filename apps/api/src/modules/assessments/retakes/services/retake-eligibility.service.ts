import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { ASSESSMENT_ERROR_CODES } from '@nexthire/constants';
import { NotFoundException } from '@nestjs/common';
import type { AssessmentRetakeEligibility, AssessmentRetakeEligibilityReason } from '@nexthire/types';

@Injectable()
export class RetakeEligibilityService {
  private readonly logger = new Logger(RetakeEligibilityService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getEligibility(
    candidateId: string,
    assessmentIdOrSlug: string,
  ): Promise<AssessmentRetakeEligibility> {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const assessment = await this.prisma.assessment.findFirst({
      where: uuidRegex.test(assessmentIdOrSlug)
        ? { id: assessmentIdOrSlug }
        : { slug: assessmentIdOrSlug },
      select: {
        id: true,
        status: true,
        availability: true,
        retakeEnabled: true,
        maximumAttempts: true,
        retakeCooldownHours: true,
      },
    });

    if (!assessment) {
      throw new NotFoundException(ASSESSMENT_ERROR_CODES.ASSESSMENT_NOT_FOUND);
    }

    const eligibleCheck = assessment.status === 'PUBLISHED' && assessment.availability === 'AVAILABLE';
    if (!eligibleCheck) {
      return this.buildResponse(assessment.id, 'ASSESSMENT_UNAVAILABLE', 0, null, null, null, null, null);
    }

    // Check for active attempt
    const activeAttempt = await this.prisma.assessmentAttempt.findFirst({
      where: { candidateId, assessmentId: assessment.id, status: 'IN_PROGRESS' },
      select: { id: true },
    });

    if (activeAttempt) {
      return this.buildResponse(assessment.id, 'ACTIVE_ATTEMPT_EXISTS', 0, null, null, null, null, null);
    }

    // Count finalized attempts and get best/latest scores
    const finalizedAttempts = await this.prisma.assessmentAttempt.findMany({
      where: {
        candidateId,
        assessmentId: assessment.id,
        status: { in: ['SUBMITTED', 'EXPIRED'] },
        scoringCompletedAt: { not: null },
      },
      select: { scorePercentage: true, submittedAt: true },
      orderBy: { submittedAt: { sort: 'desc', nulls: 'last' } },
    });

    const attemptsUsed = finalizedAttempts.length;
    const bestPct: number | null = attemptsUsed > 0
      ? Math.max(...finalizedAttempts.map(a => Number(a.scorePercentage ?? 0)))
      : null;
    const latestPct: number | null = attemptsUsed > 0
      ? Number(finalizedAttempts[0]!.scorePercentage ?? 0)
      : null;

    // First attempt available
    if (attemptsUsed === 0) {
      return this.buildResponse(assessment.id, 'FIRST_ATTEMPT_AVAILABLE', 0, assessment.maximumAttempts, null, null, bestPct, latestPct);
    }

    // Retake disabled
    if (!assessment.retakeEnabled) {
      return this.buildResponse(assessment.id, 'RETAKE_DISABLED', attemptsUsed, assessment.maximumAttempts, null, null, bestPct, latestPct);
    }

    // Check limit
    if (assessment.maximumAttempts !== null && attemptsUsed >= assessment.maximumAttempts) {
      return this.buildResponse(assessment.id, 'ATTEMPT_LIMIT_REACHED', attemptsUsed, assessment.maximumAttempts, null, null, bestPct, latestPct);
    }

    // Check cooldown
    if (assessment.retakeCooldownHours > 0) {
      const lastFinalized = finalizedAttempts[0];
      if (lastFinalized?.submittedAt) {
        const cooldownEnd = new Date(lastFinalized.submittedAt.getTime() + assessment.retakeCooldownHours * 3600000);
        const now = new Date();

        if (cooldownEnd > now) {
          return this.buildResponse(
            assessment.id,
            'COOLDOWN_ACTIVE',
            attemptsUsed,
            assessment.maximumAttempts,
            cooldownEnd.toISOString(),
            cooldownEnd.toISOString(),
            bestPct,
            latestPct,
          );
        }
      }
    }

    // Retake available
    const remaining = assessment.maximumAttempts !== null ? assessment.maximumAttempts - attemptsUsed : null;
    return this.buildResponse(assessment.id, 'RETAKE_AVAILABLE', attemptsUsed, assessment.maximumAttempts, null, null, bestPct, latestPct, remaining);
  }

  private buildResponse(
    assessmentId: string,
    reason: AssessmentRetakeEligibilityReason,
    attemptsUsed: number,
    maximumAttempts: number | null,
    cooldownEndsAt: string | null,
    nextEligibleAt: string | null,
    bestPercentage: number | null,
    latestPercentage: number | null,
    attemptsRemaining: number | null = null,
  ): AssessmentRetakeEligibility {
    const eligible = ['FIRST_ATTEMPT_AVAILABLE', 'RETAKE_AVAILABLE'].includes(reason);
    return {
      assessmentId,
      eligible,
      reason,
      attemptsUsed,
      maximumAttempts,
      attemptsRemaining: attemptsRemaining ?? (maximumAttempts !== null ? Math.max(0, maximumAttempts - attemptsUsed) : null),
      cooldownEndsAt,
      nextEligibleAt: nextEligibleAt ?? cooldownEndsAt,
      bestPercentage,
      latestPercentage,
    };
  }
}
