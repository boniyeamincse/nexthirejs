import { Injectable, BadRequestException, ForbiddenException, InternalServerErrorException, Logger } from '@nestjs/common';
import { CandidateProfilePrivacyRepository } from './candidate-profile-privacy.repository';
import { CandidatePrivacyPolicyService } from './candidate-privacy-policy.service';
import { candidateProfilePrivacySchema } from '@nexthire/validation';
import { AuditActorType, AuditOutcome, SUPPORTED_SECTIONS, CANDIDATE_PRIVACY_POLICY_VERSION } from '@nexthire/types';
import type { CandidateProfilePrivacyResult, CandidateProfilePrivacyInput } from '@nexthire/types';
import { AuditService } from '../../audit/audit.service';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class CandidateProfilePrivacyService {
  private readonly logger = new Logger(CandidateProfilePrivacyService.name);

  constructor(
    private readonly repository: CandidateProfilePrivacyRepository,
    private readonly policyService: CandidatePrivacyPolicyService,
    private readonly auditService: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  async getSettings(userId: string): Promise<CandidateProfilePrivacyResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { status: true },
    });

    if (!user || user.status === 'DELETED') {
      throw new ForbiddenException('AUTH_ACCOUNT_UNAVAILABLE');
    }

    const record = await this.repository.findByUserId(userId);

    if (!record) {
      await this.auditService.recordBestEffort({
        actorType: AuditActorType.USER,
        actorUserId: userId,
        action: 'candidate.privacy.viewed',
        targetType: 'CandidateProfilePrivacy',
        targetId: userId,
        outcome: AuditOutcome.SUCCESS,
        metadata: {
          settingsSource: 'DEFAULT',
          policyVersion: CANDIDATE_PRIVACY_POLICY_VERSION,
        },
      }).catch(() => {});

      return this.policyService.getDefaultSettings();
    }

    void this.auditService.recordBestEffort({
      actorType: AuditActorType.USER,
      actorUserId: userId,
      action: 'candidate.privacy.viewed',
      targetType: 'CandidateProfilePrivacy',
      targetId: record.id,
      outcome: AuditOutcome.SUCCESS,
      metadata: {
        settingsSource: 'PERSISTED',
        policyVersion: record.policyVersion,
      },
    }).catch(() => {});

    return this.policyService.toResult(record);
  }

  async updateSettings(userId: string, data: CandidateProfilePrivacyInput): Promise<CandidateProfilePrivacyResult> {
    const parseResult = candidateProfilePrivacySchema.safeParse(data);
    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0];
      if (firstError?.path[0] === 'sections') {
        const sectionPath = firstError.path[1];
        if (sectionPath && !SUPPORTED_SECTIONS.includes(sectionPath as any)) {
          throw new BadRequestException('CANDIDATE_PRIVACY_SECTION_UNSUPPORTED');
        }
        throw new BadRequestException('CANDIDATE_PRIVACY_SECTION_MISSING');
      }
      throw new BadRequestException('CANDIDATE_PRIVACY_VALIDATION_FAILED');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { status: true },
    });

    if (!user || user.status === 'DELETED') {
      throw new ForbiddenException('AUTH_ACCOUNT_UNAVAILABLE');
    }

    if (user.status === 'SUSPENDED') {
      throw new ForbiddenException('AUTH_ACCOUNT_UNAVAILABLE');
    }

    const existingRecord = await this.repository.findByUserId(userId);

    const changedSectionNames: string[] = [];
    if (existingRecord) {
      for (const section of SUPPORTED_SECTIONS) {
        const dbField = this.sectionToDbField(section);
        const oldVal = (existingRecord as any)[dbField];
        const newVal = data.sections[section];
        if (oldVal !== newVal) {
          changedSectionNames.push(section);
        }
      }
    } else {
      changedSectionNames.push(...SUPPORTED_SECTIONS);
    }

    try {
      const result = await this.repository.upsert(userId, data);

      await this.auditService.recordRequired({
        actorType: AuditActorType.USER,
        actorUserId: userId,
        action: 'candidate.privacy.updated',
        targetType: 'CandidateProfilePrivacy',
        targetId: result.id,
        outcome: AuditOutcome.SUCCESS,
        metadata: {
          settingsSource: existingRecord ? 'PERSISTED_UPDATED' : 'PERSISTED_CREATED',
          policyVersion: CANDIDATE_PRIVACY_POLICY_VERSION,
          oldDiscoverability: existingRecord?.overallDiscoverability ?? null,
          newDiscoverability: data.overallDiscoverability,
          changedSectionNames,
          changedSectionCount: changedSectionNames.length,
        },
      });

      return this.policyService.toResult(result);
    } catch (error: any) {
      if (error instanceof BadRequestException || error instanceof ForbiddenException) throw error;
      this.logger.error(`Failed to update privacy settings for user ${userId}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to update privacy settings');
    }
  }

  private sectionToDbField(section: string): string {
    const map: Record<string, string> = {
      BASIC_PROFILE: 'basicProfile',
      LOCATION_AND_PREFERENCES: 'locationAndPreferences',
      EDUCATION: 'education',
      WORK_EXPERIENCE: 'workExperience',
      SKILLS_AND_LANGUAGES: 'skillsAndLanguages',
      CERTIFICATIONS_AND_TRAINING: 'certificationsAndTraining',
      ACHIEVEMENTS_AND_LINKS: 'achievementsAndLinks',
    };
    return map[section] || section;
  }
}
