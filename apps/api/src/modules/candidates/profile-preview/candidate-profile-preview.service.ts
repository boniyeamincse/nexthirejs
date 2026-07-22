import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { AuditActorType, AuditOutcome } from '@nexthire/types';
import type {
  CandidateProfilePrivacyResult,
  PublicCandidateProfile,
  OwnerProfilePreview,
  PublicEducationRecord,
  PublicWorkExperienceRecord,
  PublicSkillRecord,
  PublicLanguageRecord,
  PublicCertificationRecord,
  PublicTrainingRecord,
  PublicAchievementRecord,
  PublicProfessionalLinkRecord,
  CandidateDiscoverability,
  CandidateSectionVisibility,
} from '@nexthire/types';
import { PrismaService } from '../../../database/prisma.service';
import { CandidatePrivacyDecisionService } from '../privacy/candidate-privacy-decision.service';
import type { ViewerContext } from '../privacy/candidate-privacy-decision.service';
import { CandidatePrivacyPolicyService } from '../privacy/candidate-privacy-policy.service';
import { CandidateProfileCompletionService } from '../services/candidate-profile-completion.service';
import { CandidateShareTokenService } from '../share-token/candidate-share-token.service';
import { AuditService } from '../../audit/audit.service';

const PRIVACY_TO_DISPLAY_SECTIONS: Record<string, string[]> = {
  BASIC_PROFILE: ['BASIC_PROFILE'],
  LOCATION_AND_PREFERENCES: ['LOCATION_AND_PREFERENCES'],
  EDUCATION: ['EDUCATION'],
  WORK_EXPERIENCE: ['WORK_EXPERIENCE'],
  SKILLS_AND_LANGUAGES: ['SKILLS', 'LANGUAGES'],
  CERTIFICATIONS_AND_TRAINING: ['CERTIFICATIONS', 'TRAINING'],
  ACHIEVEMENTS_AND_LINKS: ['ACHIEVEMENTS', 'PROFESSIONAL_LINKS'],
};

const ALL_DISPLAY_SECTIONS = [
  'BASIC_PROFILE',
  'LOCATION_AND_PREFERENCES',
  'EDUCATION',
  'WORK_EXPERIENCE',
  'SKILLS',
  'LANGUAGES',
  'CERTIFICATIONS',
  'TRAINING',
  'ACHIEVEMENTS',
  'PROFESSIONAL_LINKS',
];

@Injectable()
export class CandidateProfilePreviewService {
  private readonly logger = new Logger(CandidateProfilePreviewService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly decisionService: CandidatePrivacyDecisionService,
    private readonly policyService: CandidatePrivacyPolicyService,
    private readonly completionService: CandidateProfileCompletionService,
    private readonly shareTokenService: CandidateShareTokenService,
    private readonly auditService: AuditService,
  ) {}

  async getOwnerPreview(userId: string): Promise<OwnerProfilePreview> {
    const user = await this.loadUserWithStatus(userId);
    if (!user || user.status === 'SUSPENDED' || user.status === 'DELETED') {
      throw new ForbiddenException('AUTH_ACCOUNT_UNAVAILABLE');
    }

    const profileData = await this.loadFullProfile(userId);

    const privacyRecord = await this.prisma.candidateProfilePrivacy.findUnique({
      where: { userId },
    });

    const privacySettings = privacyRecord
      ? this.policyService.toResult(privacyRecord)
      : this.policyService.getDefaultSettings();

    const profile = this.buildPublicProfile(user, profileData, privacySettings, 'OWNER');

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

    this.auditService
      .recordBestEffort({
        actorType: AuditActorType.USER,
        actorUserId: userId,
        action: 'candidate.profile_preview.viewed',
        targetType: 'CandidateProfile',
        targetId: profileData.candidateProfile?.id ?? userId,
        outcome: AuditOutcome.SUCCESS,
        metadata: { viewerContext: 'OWNER' },
      })
      .catch(() => {});

    const sectionVisibility: Record<string, string> = {};
    for (const [privacySection, displayNames] of Object.entries(PRIVACY_TO_DISPLAY_SECTIONS)) {
      const visibility =
        privacySettings.sections[privacySection as keyof typeof privacySettings.sections] ??
        'HIDDEN';
      for (const name of displayNames) {
        sectionVisibility[name] = visibility;
      }
    }

    return {
      profile,
      privacySummary: {
        overallVisibility: privacySettings.overallDiscoverability,
        sectionVisibility,
        shareLinkEnabled: this.decisionService.canShareByLink(privacySettings),
      },
      completion: {
        percentage: completion.percentage,
        version: completion.version,
      },
    };
  }

  async getExternalProfileByPublicId(publicId: string): Promise<PublicCandidateProfile | null> {
    const user = await this.loadUserWithStatus(publicId);
    if (!user || user.status === 'SUSPENDED' || user.status === 'DELETED') {
      return null;
    }

    const privacyRecord = await this.prisma.candidateProfilePrivacy.findUnique({
      where: { userId: publicId },
    });

    const privacySettings = privacyRecord
      ? this.policyService.toResult(privacyRecord)
      : this.policyService.getDefaultSettings();

    if (!this.decisionService.canPlatformDiscoverCandidate(privacySettings)) {
      return null;
    }

    const profileData = await this.loadFullProfile(publicId);

    const profile = this.buildPublicProfile(
      user,
      profileData,
      privacySettings,
      'PLATFORM_AUTHENTICATED',
    );

    this.auditService
      .recordBestEffort({
        actorType: AuditActorType.ANONYMOUS,
        action: 'candidate.public_profile.viewed',
        targetType: 'CandidateProfile',
        targetId: profileData.candidateProfile?.id ?? publicId,
        outcome: AuditOutcome.SUCCESS,
        metadata: { viewerContext: 'PLATFORM_AUTHENTICATED' },
      })
      .catch(() => {});

    return profile;
  }

  async getExternalProfileByShareToken(rawToken: string): Promise<PublicCandidateProfile | null> {
    const userId = await this.shareTokenService.validateToken(rawToken);
    if (!userId) {
      return null;
    }

    const user = await this.loadUserWithStatus(userId);
    if (!user || user.status === 'SUSPENDED' || user.status === 'DELETED') {
      return null;
    }

    const privacyRecord = await this.prisma.candidateProfilePrivacy.findUnique({
      where: { userId },
    });

    const privacySettings = privacyRecord
      ? this.policyService.toResult(privacyRecord)
      : this.policyService.getDefaultSettings();

    if (!this.decisionService.canShareByLink(privacySettings)) {
      return null;
    }

    const profileData = await this.loadFullProfile(userId);

    const profile = this.buildPublicProfile(user, profileData, privacySettings, 'LINK_HOLDER');

    this.auditService
      .recordBestEffort({
        actorType: AuditActorType.ANONYMOUS,
        action: 'candidate.public_profile.viewed',
        targetType: 'CandidateProfile',
        targetId: profileData.candidateProfile?.id ?? userId,
        outcome: AuditOutcome.SUCCESS,
        metadata: { viewerContext: 'LINK_HOLDER' },
      })
      .catch(() => {});

    return profile;
  }

  private async loadUserWithStatus(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, status: true, updatedAt: true },
    });
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

  private buildPublicProfile(
    user: { id: string; status: string; updatedAt: Date },
    profileData: any,
    privacySettings: CandidateProfilePrivacyResult,
    viewerContext: ViewerContext,
  ): PublicCandidateProfile {
    const visibleSections = this.getVisibleSectionNames(privacySettings, viewerContext);

    const basicVisible = visibleSections.includes('BASIC_PROFILE');
    const locationVisible = visibleSections.includes('LOCATION_AND_PREFERENCES');
    const educationVisible = visibleSections.includes('EDUCATION');
    const experienceVisible = visibleSections.includes('WORK_EXPERIENCE');
    const skillsVisible = visibleSections.includes('SKILLS');
    const languagesVisible = visibleSections.includes('LANGUAGES');
    const certificationsVisible = visibleSections.includes('CERTIFICATIONS');
    const trainingVisible = visibleSections.includes('TRAINING');
    const achievementsVisible = visibleSections.includes('ACHIEVEMENTS');
    const linksVisible = visibleSections.includes('PROFESSIONAL_LINKS');

    return {
      profileId: profileData.candidateProfile?.id ?? user.id,
      displayName: basicVisible ? (profileData.candidateProfile?.fullName ?? '') : '',
      professionalHeadline: basicVisible
        ? (profileData.candidateProfile?.professionalHeadline ?? null)
        : null,
      professionalSummary: basicVisible
        ? (profileData.candidateProfile?.professionalSummary ?? null)
        : null,
      location: locationVisible
        ? {
            city: profileData.candidatePreference?.currentCity ?? null,
            countryName: profileData.candidatePreference?.country?.name ?? null,
          }
        : null,
      preferredJobRoles: locationVisible
        ? (profileData.candidatePreference?.preferredJobRoles ?? [])
        : [],
      preferredWorkModes: locationVisible
        ? (profileData.candidatePreference?.preferredWorkModes ?? [])
        : [],
      preferredEmploymentTypes: locationVisible
        ? (profileData.candidatePreference?.preferredEmploymentTypes ?? [])
        : [],
      education: this.toPublicEducation(profileData.educationRecords, educationVisible),
      experience: this.toPublicExperience(profileData.workExperienceRecords, experienceVisible),
      skills: this.toPublicSkills(profileData.skills, skillsVisible),
      languages: this.toPublicLanguages(profileData.languages, languagesVisible),
      certifications: this.toPublicCertifications(
        profileData.certifications,
        certificationsVisible,
      ),
      training: this.toPublicTraining(profileData.training, trainingVisible),
      achievements: this.toPublicAchievements(profileData.achievements, achievementsVisible),
      professionalLinks: this.toPublicProfessionalLinks(
        profileData.professionalLinks,
        linksVisible,
      ),
      visibleSections,
      updatedAt: user.updatedAt?.toISOString() ?? new Date().toISOString(),
    };
  }

  private getVisibleSectionNames(
    privacySettings: CandidateProfilePrivacyResult,
    viewerContext: ViewerContext,
  ): string[] {
    if (viewerContext === 'OWNER') {
      return [...ALL_DISPLAY_SECTIONS];
    }

    const visible: string[] = [];
    for (const [privacySection, displaySections] of Object.entries(PRIVACY_TO_DISPLAY_SECTIONS)) {
      const canRead = this.decisionService.canExternalViewerReadSection(
        privacySettings,
        privacySection as any,
        viewerContext,
      );
      if (canRead) {
        visible.push(...displaySections);
      }
    }
    return visible;
  }

  private toPublicEducation(records: any[], visible: boolean): PublicEducationRecord[] {
    if (!visible || !records) return [];
    return records.map((r) => ({
      id: r.id,
      educationLevel: r.educationLevel,
      institutionName: r.institutionName,
      qualification: r.qualification,
      fieldOfStudy: r.fieldOfStudy ?? null,
      startDate: this.toDateString(r.startDate),
      endDate: r.endDate ? this.toDateString(r.endDate) : null,
      currentlyStudying: r.currentlyStudying,
      grade: r.grade ?? null,
      description: r.description ?? null,
    }));
  }

  private toPublicExperience(records: any[], visible: boolean): PublicWorkExperienceRecord[] {
    if (!visible || !records) return [];
    return records.map((r) => ({
      id: r.id,
      companyName: r.companyName,
      jobTitle: r.jobTitle,
      employmentType: r.employmentType,
      location: r.location ?? null,
      isRemote: r.isRemote,
      startDate: this.toDateString(r.startDate),
      endDate: r.endDate ? this.toDateString(r.endDate) : null,
      currentlyWorking: r.currentlyWorking,
      responsibilities: r.responsibilities ?? null,
      achievements: r.achievements ?? null,
    }));
  }

  private toPublicSkills(records: any[], visible: boolean): PublicSkillRecord[] {
    if (!visible || !records) return [];
    return records.map((r) => ({
      id: r.id,
      name: r.name,
      level: r.level,
      yearsOfExperience: r.yearsOfExperience ? Number(r.yearsOfExperience) : null,
    }));
  }

  private toPublicLanguages(records: any[], visible: boolean): PublicLanguageRecord[] {
    if (!visible || !records) return [];
    return records.map((r) => ({
      id: r.id,
      name: r.name,
      speaking: r.speaking,
      reading: r.reading,
      writing: r.writing,
    }));
  }

  private toPublicCertifications(records: any[], visible: boolean): PublicCertificationRecord[] {
    if (!visible || !records) return [];
    return records.map((r) => ({
      id: r.id,
      name: r.name,
      issuer: r.issuer,
      issueDate: this.toDateString(r.issueDate),
      doesNotExpire: r.doesNotExpire,
      expiryDate: r.expiryDate ? this.toDateString(r.expiryDate) : null,
      credentialUrl: r.credentialUrl ?? null,
    }));
  }

  private toPublicTraining(records: any[], visible: boolean): PublicTrainingRecord[] {
    if (!visible || !records) return [];
    return records.map((r) => ({
      id: r.id,
      title: r.title,
      provider: r.provider,
      completionDate: this.toDateString(r.completionDate),
      durationHours: r.durationHours ? Number(r.durationHours) : null,
      description: r.description ?? null,
    }));
  }

  private toPublicAchievements(records: any[], visible: boolean): PublicAchievementRecord[] {
    if (!visible || !records) return [];
    return records.map((r) => ({
      id: r.id,
      title: r.title,
      issuer: r.issuer ?? null,
      achievedAt: r.achievedAt ? this.toDateString(r.achievedAt) : null,
      description: r.description ?? null,
    }));
  }

  private toPublicProfessionalLinks(
    records: any[],
    visible: boolean,
  ): PublicProfessionalLinkRecord[] {
    if (!visible || !records) return [];
    return records.map((r) => ({
      id: r.id,
      type: r.type,
      label: r.label ?? null,
      url: r.url,
    }));
  }

  private toDateString(date: Date | string | null | undefined): string {
    if (!date) return '';
    if (typeof date === 'string') return date;
    return date.toISOString();
  }
}
