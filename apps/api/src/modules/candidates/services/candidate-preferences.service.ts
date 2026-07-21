import { Injectable, BadRequestException } from '@nestjs/common';
import { CandidatePreferencesRepository } from '../repositories/candidate-preferences.repository';
import { CandidateProfileRepository } from '../repositories/candidate-profile.repository';
import { CandidateProfileCompletionService } from './candidate-profile-completion.service';
import { candidatePreferenceSchema, CandidatePreferenceInput } from '@nexthire/validation';
import { CandidatePreferenceResult, AuditActorType, AuditOutcome } from '@nexthire/types';
import { AuditService } from '../../audit/audit.service';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class CandidatePreferencesService {
  constructor(
    private readonly repository: CandidatePreferencesRepository,
    private readonly profileRepository: CandidateProfileRepository,
    private readonly completionService: CandidateProfileCompletionService,
    private readonly auditService: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  async getPreferences(userId: string): Promise<{ preferences: CandidatePreferenceResult | null, availableOptions: any }> {
    const record = await this.repository.findByUserId(userId);
    const profile = await this.profileRepository.findByUserId(userId);

    const availableOptions = {
      workModes: ['ONSITE', 'HYBRID', 'REMOTE'],
      employmentTypes: ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE'],
    };

    if (!record) {
      return {
        preferences: null,
        availableOptions,
      };
    }

    const completion = this.completionService.calculateCompletion(profile, {
      countryCode: record.country.code,
      currentCity: record.currentCity,
      preferredJobRoles: record.preferredJobRoles,
      preferredWorkModes: record.preferredWorkModes as any,
      preferredEmploymentTypes: record.preferredEmploymentTypes as any,
    });

    void this.auditService.recordBestEffort({
      actorType: AuditActorType.USER,
      actorUserId: userId,
      action: 'candidate.preferences.viewed',
      targetType: 'CandidatePreference',
      targetId: record.id,
      outcome: AuditOutcome.SUCCESS,
    }).catch(() => {});

    return {
      preferences: this.mapToResponse(record, completion),
      availableOptions,
    };
  }

  async upsertPreferences(userId: string, data: any): Promise<CandidatePreferenceResult> {
    const parseResult = candidatePreferenceSchema.safeParse(data);
    if (!parseResult.success) {
      throw new BadRequestException('CANDIDATE_PREFERENCE_VALIDATION_FAILED');
    }

    const validatedData = parseResult.data;

    const country = await this.prisma.country.findUnique({
      where: { code: validatedData.countryCode, isActive: true },
    });

    if (!country) {
      throw new BadRequestException('COUNTRY_NOT_SUPPORTED');
    }

    const existingProfile = await this.profileRepository.findByUserId(userId);
    const existingPreferences = await this.repository.findByUserId(userId);

    const completionBefore = this.completionService.calculateCompletion(
      existingProfile, 
      existingPreferences ? {
        countryCode: existingPreferences.country.code,
        currentCity: existingPreferences.currentCity,
        preferredJobRoles: existingPreferences.preferredJobRoles,
        preferredWorkModes: existingPreferences.preferredWorkModes as any,
        preferredEmploymentTypes: existingPreferences.preferredEmploymentTypes as any,
      } : null
    );

    const completionAfter = this.completionService.calculateCompletion(existingProfile, validatedData);

    const result = await this.repository.upsertPreferences(userId, validatedData, country.id);

    // Update profile completion score
    if (existingProfile) {
      await this.profileRepository.upsertProfile(userId, {
        fullName: existingProfile.fullName,
        professionalHeadline: existingProfile.professionalHeadline,
        professionalSummary: existingProfile.professionalSummary,
        dateOfBirth: existingProfile.dateOfBirth ? existingProfile.dateOfBirth.toISOString() : undefined,
      }, completionAfter.percentage);
    } else {
      await this.profileRepository.upsertProfile(userId, {
        fullName: '',
      }, completionAfter.percentage);
    }

    const action = existingPreferences ? 'candidate.preferences.updated' : 'candidate.preferences.created';
    
    await this.auditService.recordRequired({
      actorType: AuditActorType.USER,
      actorUserId: userId,
      action,
      targetType: 'CandidatePreference',
      targetId: result.id,
      outcome: AuditOutcome.SUCCESS,
      metadata: {
        countryChanged: existingPreferences ? existingPreferences.countryId !== country.id : true,
        preferredJobRoleCount: validatedData.preferredJobRoles.length,
        preferredWorkModeCount: validatedData.preferredWorkModes.length,
        preferredEmploymentTypeCount: validatedData.preferredEmploymentTypes.length,
        completionPercentageBefore: completionBefore.percentage,
        completionPercentageAfter: completionAfter.percentage,
      }
    });

    return this.mapToResponse(result, completionAfter);
  }

  private mapToResponse(record: any, completion: any): CandidatePreferenceResult {
    return {
      id: record.id,
      country: {
        code: record.country.code,
        name: record.country.name,
        defaultCurrency: record.country.defaultCurrency,
        defaultTimezone: record.country.defaultTimezone,
      },
      currentCity: record.currentCity,
      preferredJobRoles: record.preferredJobRoles,
      preferredWorkModes: record.preferredWorkModes,
      preferredEmploymentTypes: record.preferredEmploymentTypes,
      completion,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }
}
