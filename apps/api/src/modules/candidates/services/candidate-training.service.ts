import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { CandidateTrainingRepository } from '../repositories/candidate-training.repository';
import { CandidateCertificationRepository } from '../repositories/candidate-certification.repository';
import { CandidateAchievementRepository } from '../repositories/candidate-achievement.repository';
import { CandidateProfessionalLinkRepository } from '../repositories/candidate-professional-link.repository';
import { CandidateProfileCompletionService } from './candidate-profile-completion.service';
import { CandidateProfileRepository } from '../repositories/candidate-profile.repository';
import { CandidatePreferencesRepository } from '../repositories/candidate-preferences.repository';
import { CandidateEducationRepository } from '../repositories/candidate-education.repository';
import { CandidateWorkExperienceRepository } from '../repositories/candidate-work-experience.repository';
import { CandidateSkillRepository } from '../repositories/candidate-skill.repository';
import { CandidateLanguageRepository } from '../repositories/candidate-language.repository';
import { AuditService } from '../../audit/audit.service';
import { AuditActorType, AuditOutcome } from '@nexthire/types';
import {
  candidateTrainingSchema,
  updateCandidateTrainingSchema,
  reorderCandidateTrainingSchema,
} from '@nexthire/validation';

@Injectable()
export class CandidateTrainingService {
  private readonly logger = new Logger(CandidateTrainingService.name);
  private readonly MAX_RECORDS = 30;

  constructor(
    private readonly trainingRepository: CandidateTrainingRepository,
    private readonly certificationRepository: CandidateCertificationRepository,
    private readonly profileRepository: CandidateProfileRepository,
    private readonly preferencesRepository: CandidatePreferencesRepository,
    private readonly educationRepository: CandidateEducationRepository,
    private readonly workExpRepository: CandidateWorkExperienceRepository,
    private readonly skillRepository: CandidateSkillRepository,
    private readonly languageRepository: CandidateLanguageRepository,
    private readonly achievementRepository: CandidateAchievementRepository,
    private readonly linkRepository: CandidateProfessionalLinkRepository,
    private readonly completionService: CandidateProfileCompletionService,
    private readonly auditService: AuditService,
  ) {}

  async listRecords(userId: string) {
    try {
      const records = await this.trainingRepository.findByUserId(userId);
      const completion = await this.recalculateCompletion(userId);

      await this.auditService.recordRequired({
        actorType: AuditActorType.USER,
        actorUserId: userId,
        action: 'candidate.training.viewed',
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
        `Error listing training for user ${userId}`,
        error instanceof Error ? error.stack : error,
      );
      throw new InternalServerErrorException('Failed to retrieve training records');
    }
  }

  async createRecord(userId: string, input: any) {
    try {
      const parseResult = candidateTrainingSchema.safeParse(input);
      if (!parseResult.success) {
        throw new BadRequestException('CANDIDATE_TRAINING_VALIDATION_FAILED');
      }
      const validatedData = parseResult.data;

      const count = await this.trainingRepository.countByUserId(userId);
      if (count >= this.MAX_RECORDS) {
        throw new BadRequestException('CANDIDATE_TRAINING_LIMIT_REACHED');
      }

      const sortOrder = count;
      const record = await this.trainingRepository.create(userId, validatedData, sortOrder);
      const completion = await this.recalculateCompletion(userId);

      await this.auditService.recordRequired({
        actorType: AuditActorType.USER,
        actorUserId: userId,
        action: 'candidate.training.created',
        targetType: 'CandidateTraining',
        targetId: record.id,
        outcome: AuditOutcome.SUCCESS,
        metadata: {
          recordId: record.id,
          recordCountBefore: count,
          recordCountAfter: count + 1,
        },
      });

      return {
        record: this.mapRecordToResponse(record),
        completion,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(
        `Error creating training for user ${userId}`,
        error instanceof Error ? error.stack : error,
      );
      throw new InternalServerErrorException('Failed to create training record');
    }
  }

  async updateRecord(userId: string, recordId: string, input: any) {
    try {
      const parseResult = updateCandidateTrainingSchema.safeParse(input);
      if (!parseResult.success) {
        throw new BadRequestException('CANDIDATE_TRAINING_VALIDATION_FAILED');
      }
      const validatedData = parseResult.data;

      const existing = await this.trainingRepository.findByIdAndUserId(recordId, userId);
      if (!existing) {
        throw new NotFoundException('CANDIDATE_TRAINING_NOT_FOUND');
      }

      const record = await this.trainingRepository.update(recordId, validatedData);
      const completion = await this.recalculateCompletion(userId);

      const changedFieldNames = Object.keys(validatedData);

      await this.auditService.recordRequired({
        actorType: AuditActorType.USER,
        actorUserId: userId,
        action: 'candidate.training.updated',
        targetType: 'CandidateTraining',
        targetId: record.id,
        outcome: AuditOutcome.SUCCESS,
        metadata: {
          recordId: record.id,
          changedFieldNames,
        },
      });

      return {
        record: this.mapRecordToResponse(record),
        completion,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      this.logger.error(
        `Error updating training ${recordId} for user ${userId}`,
        error instanceof Error ? error.stack : error,
      );
      throw new InternalServerErrorException('Failed to update training record');
    }
  }

  async deleteRecord(userId: string, recordId: string) {
    try {
      const existing = await this.trainingRepository.findByIdAndUserId(recordId, userId);
      if (!existing) {
        throw new NotFoundException('CANDIDATE_TRAINING_NOT_FOUND');
      }

      const countBefore = await this.trainingRepository.countByUserId(userId);
      await this.trainingRepository.delete(recordId);
      const completion = await this.recalculateCompletion(userId);

      await this.auditService.recordRequired({
        actorType: AuditActorType.USER,
        actorUserId: userId,
        action: 'candidate.training.deleted',
        targetType: 'CandidateTraining',
        targetId: recordId,
        outcome: AuditOutcome.SUCCESS,
        metadata: {
          recordId,
          recordCountBefore: countBefore,
          recordCountAfter: countBefore - 1,
        },
      });

      return { completion };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(
        `Error deleting training ${recordId} for user ${userId}`,
        error instanceof Error ? error.stack : error,
      );
      throw new InternalServerErrorException('Failed to delete training record');
    }
  }

  async reorderRecords(userId: string, input: any) {
    try {
      const parseResult = reorderCandidateTrainingSchema.safeParse(input);
      if (!parseResult.success) {
        throw new BadRequestException('CANDIDATE_TRAINING_VALIDATION_FAILED');
      }
      const validatedData = parseResult.data;

      const records = await this.trainingRepository.findByUserId(userId);
      const ownedIds = new Set(records.map((r) => r.id));

      for (const id of validatedData.orderedIds) {
        if (!ownedIds.has(id)) {
          throw new BadRequestException(
            'Cannot reorder records that do not belong to you or do not exist',
          );
        }
      }

      const updates = validatedData.orderedIds.map((id, index) => ({ id, sortOrder: index }));
      await this.trainingRepository.updateSortOrder(updates);
      const completion = await this.recalculateCompletion(userId);

      await this.auditService.recordRequired({
        actorType: AuditActorType.USER,
        actorUserId: userId,
        action: 'candidate.training.reordered',
        targetType: 'CandidateProfile',
        targetId: userId,
        outcome: AuditOutcome.SUCCESS,
        metadata: {},
      });

      return { completion };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(
        `Error reordering training for user ${userId}`,
        error instanceof Error ? error.stack : error,
      );
      throw new InternalServerErrorException('Failed to reorder training records');
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
      title: record.title,
      provider: record.provider,
      completionDate: record.completionDate.toISOString(),
      durationHours: record.durationHours ? Number(record.durationHours) : null,
      description: record.description,
      sortOrder: record.sortOrder,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }
}
