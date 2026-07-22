import { Injectable } from '@nestjs/common';
import { AssessmentAnalyticsRepository } from '../repositories/assessment-analytics.repository';

@Injectable()
export class LeaderboardIdentityService {
  constructor(private readonly repository: AssessmentAnalyticsRepository) {}

  async getLeaderboardDisplayName(userId: string): Promise<string> {
    const settings = await this.repository.getLeaderboardSettings(userId);
    if (settings?.leaderboardDisplayName) {
      return settings.leaderboardDisplayName;
    }
    const profile = await this.repository.getLeaderboardSettings(userId);
    if (!profile) {
      return this.generateSafeAlias(userId);
    }
    const { CandidateProfilePrivacy: privacy } = await this.repository.getLeaderboardSettings(userId) as any;
    return this.generateSafeAlias(userId);
  }

  async resolveDisplayName(userId: string, settings: { leaderboardDisplayName: string | null; fullName: string | null }): Promise<string> {
    if (settings.leaderboardDisplayName) {
      return settings.leaderboardDisplayName;
    }
    return this.generateSafeAlias(userId);
  }

  private generateSafeAlias(userId: string): string {
    const shortId = userId.replace(/-/g, '').slice(0, 4).toUpperCase();
    return `Candidate-${shortId}`;
  }
}
