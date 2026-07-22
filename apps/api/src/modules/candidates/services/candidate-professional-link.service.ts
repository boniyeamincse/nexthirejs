import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { CandidateProfessionalLinkRepository } from '../repositories/candidate-professional-link.repository';
import { CandidateAchievementRepository } from '../repositories/candidate-achievement.repository';
import { CandidateProfileCompletionService } from './candidate-profile-completion.service';
import { CandidateProfileRepository } from '../repositories/candidate-profile.repository';
import { CandidatePreferencesRepository } from '../repositories/candidate-preferences.repository';
import { CandidateEducationRepository } from '../repositories/candidate-education.repository';
import { CandidateWorkExperienceRepository } from '../repositories/candidate-work-experience.repository';
import { CandidateSkillRepository } from '../repositories/candidate-skill.repository';
import { CandidateLanguageRepository } from '../repositories/candidate-language.repository';
import { CandidateCertificationRepository } from '../repositories/candidate-certification.repository';
import { CandidateTrainingRepository } from '../repositories/candidate-training.repository';
import { AuditService } from '../../audit/audit.service';
import { AuditActorType, AuditOutcome } from '@nexthire/types';
import {
  candidateProfessionalLinkSchema,
  updateCandidateProfessionalLinkSchema,
  reorderCandidateProfessionalLinksSchema,
} from '@nexthire/validation';
import { UrlNormalizer } from '../../../common/url/url-normalizer';

@Injectable()
export class CandidateProfessionalLinkService {
  private readonly logger = new Logger(CandidateProfessionalLinkService.name);
  private readonly MAX_RECORDS = 10;

  constructor(
    private readonly linkRepository: CandidateProfessionalLinkRepository,
    private readonly achievementRepository: CandidateAchievementRepository,
    private readonly profileRepository: CandidateProfileRepository,
    private readonly preferencesRepository: CandidatePreferencesRepository,
    private readonly educationRepository: CandidateEducationRepository,
    private readonly workExpRepository: CandidateWorkExperienceRepository,
    private readonly skillRepository: CandidateSkillRepository,
    private readonly languageRepository: CandidateLanguageRepository,
    private readonly certificationRepository: CandidateCertificationRepository,
    private readonly trainingRepository: CandidateTrainingRepository,
    private readonly completionService: CandidateProfileCompletionService,
    private readonly auditService: AuditService,
  ) {}

  async listRecords(userId: string) {
    try {
      const records = await this.linkRepository.findByUserId(userId);
      const completion = await this.recalculateCompletion(userId);

      await this.auditService.recordRequired({
        actorType: AuditActorType.USER,
        actorUserId: userId,
        action: 'candidate.professional_link.viewed',
        targetType: 'CandidateProfile',
        targetId: userId,
        outcome: AuditOutcome.SUCCESS,
        metadata: { recordCount: records.length },
      });

      return {
        records: records.map(this.mapRecordToResponse),
        completion,
      };
    } catch (error) {
      this.logger.error(
        `Error listing professional links for user ${userId}`,
        error instanceof Error ? error.stack : error,
      );
      throw new InternalServerErrorException('Failed to retrieve professional links');
    }
  }

  async createRecord(userId: string, input: any) {
    try {
      const parseResult = candidateProfessionalLinkSchema.safeParse(input);
      if (!parseResult.success) {
        throw new BadRequestException('CANDIDATE_PROFESSIONAL_LINK_VALIDATION_FAILED');
      }
      const validatedData = parseResult.data;

      const count = await this.linkRepository.countByUserId(userId);
      if (count >= this.MAX_RECORDS) {
        throw new BadRequestException('CANDIDATE_PROFESSIONAL_LINK_LIMIT_REACHED');
      }

      let normalizedUrlResult;
      try {
        normalizedUrlResult = UrlNormalizer.normalize(validatedData.url);
      } catch (urlError: any) {
        throw new BadRequestException('CANDIDATE_PROFESSIONAL_LINK_VALIDATION_FAILED');
      }

      const existing = await this.linkRepository.findDuplicate(
        userId,
        normalizedUrlResult.normalizedUrl,
      );
      if (existing) {
        throw new ConflictException('CANDIDATE_PROFESSIONAL_LINK_DUPLICATE');
      }

      const sortOrder = count;
      const record = await this.linkRepository.create(
        userId,
        {
          ...validatedData,
          url: normalizedUrlResult.displayUrl,
          normalizedUrl: normalizedUrlResult.normalizedUrl,
        },
        sortOrder,
      );
      const completion = await this.recalculateCompletion(userId);

      await this.auditService.recordRequired({
        actorType: AuditActorType.USER,
        actorUserId: userId,
        action: 'candidate.professional_link.created',
        targetType: 'CandidateProfessionalLink',
        targetId: record.id,
        outcome: AuditOutcome.SUCCESS,
        metadata: {
          recordId: record.id,
          recordCountBefore: count,
          recordCountAfter: count + 1,
          linkType: validatedData.type,
        },
      });

      return {
        record: this.mapRecordToResponse(record),
        completion,
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ConflictException) throw error;
      this.logger.error(
        `Error creating professional link for user ${userId}`,
        error instanceof Error ? error.stack : error,
      );
      throw new InternalServerErrorException('Failed to create professional link');
    }
  }

  async updateRecord(userId: string, recordId: string, input: any) {
    try {
      const parseResult = updateCandidateProfessionalLinkSchema.safeParse(input);
      if (!parseResult.success) {
        throw new BadRequestException('CANDIDATE_PROFESSIONAL_LINK_VALIDATION_FAILED');
      }
      const validatedData = parseResult.data;

      const existing = await this.linkRepository.findByIdAndUserId(recordId, userId);
      if (!existing) {
        throw new NotFoundException('CANDIDATE_PROFESSIONAL_LINK_NOT_FOUND');
      }

      const updateData: any = { ...validatedData };

      if (validatedData.url) {
        let normalizedUrlResult;
        try {
          normalizedUrlResult = UrlNormalizer.normalize(validatedData.url);
        } catch (urlError: any) {
          throw new BadRequestException('CANDIDATE_PROFESSIONAL_LINK_VALIDATION_FAILED');
        }

        const duplicate = await this.linkRepository.findDuplicate(
          userId,
          normalizedUrlResult.normalizedUrl,
          recordId,
        );
        if (duplicate) {
          throw new ConflictException('CANDIDATE_PROFESSIONAL_LINK_DUPLICATE');
        }

        updateData.url = normalizedUrlResult.displayUrl;
        updateData.normalizedUrl = normalizedUrlResult.normalizedUrl;
      }

      const record = await this.linkRepository.update(recordId, updateData);
      const completion = await this.recalculateCompletion(userId);

      const changedFieldNames = Object.keys(validatedData);

      await this.auditService.recordRequired({
        actorType: AuditActorType.USER,
        actorUserId: userId,
        action: 'candidate.professional_link.updated',
        targetType: 'CandidateProfessionalLink',
        targetId: record.id,
        outcome: AuditOutcome.SUCCESS,
        metadata: {
          recordId: record.id,
          changedFieldNames,
          linkType: validatedData.type || existing.type,
        },
      });

      return {
        record: this.mapRecordToResponse(record),
        completion,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      )
        throw error;
      this.logger.error(
        `Error updating professional link ${recordId} for user ${userId}`,
        error instanceof Error ? error.stack : error,
      );
      throw new InternalServerErrorException('Failed to update professional link');
    }
  }

  async deleteRecord(userId: string, recordId: string) {
    try {
      const existing = await this.linkRepository.findByIdAndUserId(recordId, userId);
      if (!existing) {
        throw new NotFoundException('CANDIDATE_PROFESSIONAL_LINK_NOT_FOUND');
      }

      const countBefore = await this.linkRepository.countByUserId(userId);
      await this.linkRepository.delete(recordId);
      const completion = await this.recalculateCompletion(userId);

      await this.auditService.recordRequired({
        actorType: AuditActorType.USER,
        actorUserId: userId,
        action: 'candidate.professional_link.deleted',
        targetType: 'CandidateProfessionalLink',
        targetId: recordId,
        outcome: AuditOutcome.SUCCESS,
        metadata: {
          recordId,
          linkType: existing.type,
          recordCountBefore: countBefore,
          recordCountAfter: countBefore - 1,
        },
      });

      return { completion };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(
        `Error deleting professional link ${recordId} for user ${userId}`,
        error instanceof Error ? error.stack : error,
      );
      throw new InternalServerErrorException('Failed to delete professional link');
    }
  }

  async reorderRecords(userId: string, input: any) {
    try {
      const parseResult = reorderCandidateProfessionalLinksSchema.safeParse(input);
      if (!parseResult.success) {
        throw new BadRequestException('CANDIDATE_PROFESSIONAL_LINK_VALIDATION_FAILED');
      }
      const validatedData = parseResult.data;

      const records = await this.linkRepository.findByUserId(userId);
      const ownedIds = new Set(records.map((r) => r.id));

      for (const id of validatedData.orderedIds) {
        if (!ownedIds.has(id)) {
          throw new BadRequestException(
            'Cannot reorder records that do not belong to you or do not exist',
          );
        }
      }

      const updates = validatedData.orderedIds.map((id, index) => ({ id, sortOrder: index }));
      await this.linkRepository.updateSortOrder(updates);
      const completion = await this.recalculateCompletion(userId);

      await this.auditService.recordRequired({
        actorType: AuditActorType.USER,
        actorUserId: userId,
        action: 'candidate.professional_link.reordered',
        targetType: 'CandidateProfile',
        targetId: userId,
        outcome: AuditOutcome.SUCCESS,
        metadata: {},
      });

      return { completion };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(
        `Error reordering professional links for user ${userId}`,
        error instanceof Error ? error.stack : error,
      );
      throw new InternalServerErrorException('Failed to reorder professional links');
    }
  }

  private async recalculateCompletion(userId: string) {
    const profile = await this.profileRepository.findByUserId(userId);
    const preferences = await this.preferencesRepository.findByUserId(userId);
    const educationRecords = await this.educationRepository.findByUserId(userId);
    const workExperienceRecords = await this.workExpRepository.findByUserId(userId);
    const skills = await this.skillRepository.findByUserId(userId);
    const languages = await this.languageRepository.findByUserId(userId);
    const certifications = await this.certificationRepository.findByUserId(userId);
    const training = await this.trainingRepository.findByUserId(userId);
    const achievements = await this.achievementRepository.findByUserId(userId);
    const links = await this.linkRepository.findByUserId(userId);

    const profileInput = profile
      ? {
          fullName: profile.fullName,
          professionalHeadline: profile.professionalHeadline,
          professionalSummary: profile.professionalSummary,
          dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.toISOString() : undefined,
        }
      : null;

    const preferencesInput = preferences
      ? {
          countryCode: preferences.country.code,
          currentCity: preferences.currentCity,
          preferredJobRoles: preferences.preferredJobRoles,
          preferredWorkModes: preferences.preferredWorkModes as any,
          preferredEmploymentTypes: preferences.preferredEmploymentTypes as any,
        }
      : null;

    const completion = this.completionService.calculateCompletion(
      profileInput,
      preferencesInput,
      educationRecords,
      workExperienceRecords,
      skills,
      languages,
      certifications,
      training,
      achievements,
      links,
    );

    if (profile) {
      await this.profileRepository.upsertProfile(
        userId,
        {
          fullName: profile.fullName,
          professionalHeadline: profile.professionalHeadline,
          professionalSummary: profile.professionalSummary,
          dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.toISOString() : undefined,
        },
        completion.percentage,
      );
    } else {
      await this.profileRepository.upsertProfile(
        userId,
        {
          fullName: 'Unknown',
        },
        completion.percentage,
      );
    }

    return completion;
  }

  private mapRecordToResponse(record: any) {
    return {
      id: record.id,
      type: record.type,
      label: record.label,
      url: record.url,
      sortOrder: record.sortOrder,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }
}
