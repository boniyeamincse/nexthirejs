import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { AuditActorType, AuditOutcome } from '@nexthire/types';
import { CandidateProfileCompletionDashboard } from '@nexthire/types';
import { PrismaService } from '../../../database/prisma.service';
import { CandidateProfileCompletionService } from '../services/candidate-profile-completion.service';
import { ProfileSectionStatusService } from './profile-section-status.service';
import { ProfileCompletionActionService } from './profile-completion-action.service';
import { AuditService } from '../../audit/audit.service';

@Injectable()
export class ProfileCompletionDashboardService {
  private readonly logger = new Logger(ProfileCompletionDashboardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly completionService: CandidateProfileCompletionService,
    private readonly sectionStatusService: ProfileSectionStatusService,
    private readonly actionService: ProfileCompletionActionService,
    private readonly auditService: AuditService,
  ) {}

  async getDashboard(userId: string): Promise<CandidateProfileCompletionDashboard> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, status: true, updatedAt: true },
    });

    if (!user || user.status === 'SUSPENDED' || user.status === 'DELETED') {
      throw new ForbiddenException('AUTH_ACCOUNT_UNAVAILABLE');
    }

    const profileData = await this.loadFullProfile(userId);

    const profileForCompletion = profileData.candidateProfile
      ? {
          ...profileData.candidateProfile,
          dateOfBirth: profileData.candidateProfile.dateOfBirth
            ? profileData.candidateProfile.dateOfBirth.toISOString()
            : null,
        }
      : null;

    const preferenceForCompletion = profileData.candidatePreference
      ? {
          ...profileData.candidatePreference,
          countryCode: profileData.candidatePreference.country?.code ?? undefined,
        }
      : null;

    const completion = this.completionService.calculateCompletion(
      profileForCompletion as any,
      preferenceForCompletion as any,
      profileData.educationRecords,
      profileData.workExperienceRecords,
      profileData.skills,
      profileData.languages,
      profileData.certifications,
      profileData.training,
      profileData.achievements,
      profileData.professionalLinks,
    );

    const sections = await this.sectionStatusService.getAllSectionStatuses(userId);
    const actions = this.actionService.getActions(userId, profileData, completion.missingFields);

    const completedSections = sections.filter((s) => s.status === 'COMPLETED').length;
    const inProgressSections = sections.filter((s) => s.status === 'IN_PROGRESS').length;
    const notStartedSections = sections.filter((s) => s.status === 'NOT_STARTED').length;

    this.auditService
      .recordBestEffort({
        actorType: AuditActorType.USER,
        actorUserId: userId,
        action: 'candidate.profile_completion.viewed',
        targetType: 'CandidateProfile',
        targetId: profileData.candidateProfile?.id ?? userId,
        outcome: AuditOutcome.SUCCESS,
        metadata: {
          viewerContext: 'OWNER',
          completionPercentage: completion.percentage,
          completionVersion: completion.version,
          completedSectionCount: completedSections,
          inProgressSectionCount: inProgressSections,
          notStartedSectionCount: notStartedSections,
        },
      })
      .catch(() => {});

    return {
      completion: {
        percentage: completion.percentage,
        earnedPoints: completion.percentage,
        totalPoints: 100 as const,
        version: completion.version,
        updatedAt: user.updatedAt?.toISOString() ?? new Date().toISOString(),
      },
      summary: {
        completedSections,
        inProgressSections,
        notStartedSections,
        totalSections: sections.length,
      },
      sections,
      nextActions: actions,
    };
  }

  private async loadFullProfile(userId: string) {
    const [
      candidateProfile,
      candidatePreference,
      educationRecords,
      workExperienceRecords,
      skills,
      languages,
      certifications,
      training,
      achievements,
      professionalLinks,
    ] = await Promise.all([
      this.prisma.candidateProfile.findUnique({ where: { userId } }),
      this.prisma.candidatePreference.findUnique({
        where: { userId },
        include: { country: true },
      }),
      this.prisma.educationRecord.findMany({
        where: { userId },
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.workExperienceRecord.findMany({
        where: { userId },
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.candidateSkill.findMany({
        where: { userId },
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.candidateLanguage.findMany({
        where: { userId },
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.candidateCertification.findMany({
        where: { userId },
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.candidateTraining.findMany({
        where: { userId },
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.candidateAchievement.findMany({
        where: { userId },
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.candidateProfessionalLink.findMany({
        where: { userId },
        orderBy: { sortOrder: 'asc' },
      }),
    ]);

    return {
      candidateProfile,
      candidatePreference,
      educationRecords,
      workExperienceRecords,
      skills,
      languages,
      certifications,
      training,
      achievements,
      professionalLinks,
    };
  }
}
