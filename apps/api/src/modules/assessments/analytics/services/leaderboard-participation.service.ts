import { Injectable, Logger, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { AssessmentAnalyticsRepository } from '../repositories/assessment-analytics.repository';
import { LeaderboardIdentityService } from './leaderboard-identity.service';
import { AuditService } from '../../../audit/audit.service';
import { AuditActorType } from '@nexthire/types';
import { ASSESSMENT_ERROR_CODES } from '@nexthire/constants';
import type { LeaderboardParticipationSettings, UpdateLeaderboardParticipationInput } from '@nexthire/types';

@Injectable()
export class LeaderboardParticipationService {
  private readonly logger = new Logger(LeaderboardParticipationService.name);

  constructor(
    private readonly repository: AssessmentAnalyticsRepository,
    private readonly identityService: LeaderboardIdentityService,
    private readonly auditService: AuditService,
  ) {}

  async getSettings(userId: string): Promise<LeaderboardParticipationSettings> {
    const privacy = await this.repository.getLeaderboardSettings(userId);
    if (!privacy) {
      return { enabled: false, displayName: null, enabledAt: null };
    }

    await this.auditService.recordBestEffort({
      actorType: AuditActorType.USER,
      actorUserId: userId,
      action: 'assessment.leaderboard_settings.viewed',
      targetType: 'CandidateProfilePrivacy',
      metadata: { enabled: privacy.leaderboardParticipationEnabled },
    });

    return {
      enabled: privacy.leaderboardParticipationEnabled,
      displayName: privacy.leaderboardDisplayName,
      enabledAt: privacy.leaderboardEnabledAt?.toISOString() ?? null,
    };
  }

  async updateSettings(userId: string, input: UpdateLeaderboardParticipationInput): Promise<LeaderboardParticipationSettings> {
    const updateData: {
      leaderboardParticipationEnabled: boolean;
      leaderboardDisplayName?: string | null;
      leaderboardEnabledAt?: Date | null;
    } = {
      leaderboardParticipationEnabled: input.enabled,
    };

    if (input.enabled) {
      updateData.leaderboardEnabledAt = new Date();
    }

    if (input.displayName !== undefined) {
      if (input.displayName !== null) {
        const trimmed = input.displayName.trim();
        if (trimmed.length < 2 || trimmed.length > 80) {
          throw new BadRequestException(ASSESSMENT_ERROR_CODES.LEADERBOARD_SETTINGS_VALIDATION_FAILED);
        }
        updateData.leaderboardDisplayName = trimmed;
      } else {
        updateData.leaderboardDisplayName = null;
      }
    }

    const updated = await this.repository.updateLeaderboardSettings(userId, updateData);

    await this.auditService.recordBestEffort({
      actorType: AuditActorType.USER,
      actorUserId: userId,
      action: 'assessment.leaderboard_settings.updated',
      targetType: 'CandidateProfilePrivacy',
      metadata: { enabled: input.enabled, filterNames: input.displayName ? ['displayName'] : [] },
    });

    return {
      enabled: updated.leaderboardParticipationEnabled,
      displayName: updated.leaderboardDisplayName,
      enabledAt: updated.leaderboardEnabledAt?.toISOString() ?? null,
    };
  }
}
