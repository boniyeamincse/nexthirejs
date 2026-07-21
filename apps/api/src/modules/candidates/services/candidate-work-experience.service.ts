import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { CandidateWorkExperienceRepository } from '../repositories/candidate-work-experience.repository';
import {
  workExperienceRecordSchema,
  updateWorkExperienceRecordSchema,
  reorderWorkExperienceRecordsSchema,
} from '@nexthire/validation';
import { CandidateProfileCompletionService } from './candidate-profile-completion.service';
import { CandidateProfileRepository } from '../repositories/candidate-profile.repository';
import { CandidatePreferencesRepository } from '../repositories/candidate-preferences.repository';
import { CandidateEducationRepository } from '../repositories/candidate-education.repository';
import { AuditService } from '../../audit/audit.service';
import { AuditActorType, AuditOutcome } from '@nexthire/types';

@Injectable()
export class CandidateWorkExperienceService {
  private readonly logger = new Logger(CandidateWorkExperienceService.name);

  constructor(
    private readonly workExpRepository: CandidateWorkExperienceRepository,
    private readonly educationRepository: CandidateEducationRepository,
    private readonly profileRepository: CandidateProfileRepository,
    private readonly preferencesRepository: CandidatePreferencesRepository,
    private readonly completionService: CandidateProfileCompletionService,
    private readonly auditService: AuditService,
  ) {}

  async listRecords(userId: string) {
    try {
      const records = await this.workExpRepository.findByUserId(userId);
      const completion = await this.recalculateCompletion(userId);

      await this.auditService.recordRequired({
        actorType: AuditActorType.USER,
        actorUserId: userId,
        action: 'candidate.experience.viewed',
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
      this.logger.error(`Error listing work experience records for user ${userId}`, error instanceof Error ? error.stack : error);
      throw new InternalServerErrorException('Failed to retrieve work experience records');
    }
  }

  async createRecord(userId: string, input: any) {
    try {
      const parseResult = workExperienceRecordSchema.safeParse(input);
      if (!parseResult.success) {
        throw new BadRequestException('CANDIDATE_EXPERIENCE_VALIDATION_FAILED');
      }
      const validatedData = parseResult.data;

      const count = await this.workExpRepository.countByUserId(userId);
      if (count >= 30) {
        throw new BadRequestException('CANDIDATE_EXPERIENCE_LIMIT_REACHED');
      }

      const sortOrder = count;
      const record = await this.workExpRepository.create(userId, validatedData, sortOrder);
      const completion = await this.recalculateCompletion(userId);

      await this.auditService.recordRequired({
        actorType: AuditActorType.USER,
        actorUserId: userId,
        action: 'candidate.experience.created',
        targetType: 'WorkExperienceRecord',
        targetId: record.id,
        outcome: AuditOutcome.SUCCESS,
        metadata: {
          recordId: record.id,
          recordCountBefore: count,
          recordCountAfter: count + 1,
          completionPercentageAfter: completion.percentage,
        },
      });

      return {
        record: this.mapRecordToResponse(record),
        completion,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Error creating work experience record for user ${userId}`, error instanceof Error ? error.stack : error);
      throw new InternalServerErrorException('Failed to create work experience record');
    }
  }

  async updateRecord(userId: string, recordId: string, input: any) {
    try {
      const parseResult = updateWorkExperienceRecordSchema.safeParse(input);
      if (!parseResult.success) {
        throw new BadRequestException('CANDIDATE_EXPERIENCE_VALIDATION_FAILED');
      }
      const validatedData = parseResult.data;

      const existing = await this.workExpRepository.findByIdAndUserId(recordId, userId);
      if (!existing) {
        throw new NotFoundException('CANDIDATE_EXPERIENCE_NOT_FOUND');
      }

      const record = await this.workExpRepository.update(recordId, validatedData);
      const completion = await this.recalculateCompletion(userId);

      const changedFieldNames = Object.keys(validatedData);

      await this.auditService.recordRequired({
        actorType: AuditActorType.USER,
        actorUserId: userId,
        action: 'candidate.experience.updated',
        targetType: 'WorkExperienceRecord',
        targetId: record.id,
        outcome: AuditOutcome.SUCCESS,
        metadata: {
          recordId: record.id,
          changedFieldNames,
          completionPercentageAfter: completion.percentage,
        },
      });

      return {
        record: this.mapRecordToResponse(record),
        completion,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Error updating work experience record ${recordId} for user ${userId}`, error instanceof Error ? error.stack : error);
      throw new InternalServerErrorException('Failed to update work experience record');
    }
  }

  async deleteRecord(userId: string, recordId: string) {
    try {
      const existing = await this.workExpRepository.findByIdAndUserId(recordId, userId);
      if (!existing) {
        throw new NotFoundException('CANDIDATE_EXPERIENCE_NOT_FOUND');
      }

      const countBefore = await this.workExpRepository.countByUserId(userId);
      await this.workExpRepository.delete(recordId);

      const completion = await this.recalculateCompletion(userId);

      await this.auditService.recordRequired({
        actorType: AuditActorType.USER,
        actorUserId: userId,
        action: 'candidate.experience.deleted',
        targetType: 'WorkExperienceRecord',
        targetId: recordId,
        outcome: AuditOutcome.SUCCESS,
        metadata: {
          recordId,
          recordCountBefore: countBefore,
          recordCountAfter: countBefore - 1,
          completionPercentageAfter: completion.percentage,
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Error deleting work experience record ${recordId} for user ${userId}`, error instanceof Error ? error.stack : error);
      throw new InternalServerErrorException('Failed to delete work experience record');
    }
  }

  async reorderRecords(userId: string, input: any) {
    try {
      const parseResult = reorderWorkExperienceRecordsSchema.safeParse(input);
      if (!parseResult.success) {
        throw new BadRequestException('CANDIDATE_EXPERIENCE_VALIDATION_FAILED');
      }
      const validatedData = parseResult.data;

      const records = await this.workExpRepository.findByUserId(userId);
      const ownedIds = new Set(records.map((r) => r.id));

      for (const id of validatedData.orderedIds) {
        if (!ownedIds.has(id)) {
          throw new BadRequestException('Cannot reorder records that do not belong to you or do not exist');
        }
      }

      const updates = validatedData.orderedIds.map((id, index) => ({ id, sortOrder: index }));
      await this.workExpRepository.updateSortOrder(updates);

      await this.auditService.recordRequired({
        actorType: AuditActorType.USER,
        actorUserId: userId,
        action: 'candidate.experience.reordered',
        targetType: 'CandidateProfile',
        targetId: userId,
        outcome: AuditOutcome.SUCCESS,
        metadata: {},
      });

      const updatedRecords = await this.workExpRepository.findByUserId(userId);
      const completion = await this.recalculateCompletion(userId);
      return { records: updatedRecords.map(this.mapRecordToResponse), completion };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Error reordering work experience records for user ${userId}`, error instanceof Error ? error.stack : error);
      throw new InternalServerErrorException('Failed to reorder work experience records');
    }
  }

  private async recalculateCompletion(userId: string) {
    const profile = await this.profileRepository.findByUserId(userId);
    const preferences = await this.preferencesRepository.findByUserId(userId);
    const educationRecords = await this.educationRepository.findByUserId(userId);
    const workExperienceRecords = await this.workExpRepository.findByUserId(userId);

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
    }

    return completion;
  }

  private mapRecordToResponse(record: any) {
    return {
      id: record.id,
      companyName: record.companyName,
      jobTitle: record.jobTitle,
      employmentType: record.employmentType,
      location: record.location,
      isRemote: record.isRemote,
      startDate: record.startDate.toISOString(),
      endDate: record.endDate ? record.endDate.toISOString() : null,
      currentlyWorking: record.currentlyWorking,
      responsibilities: record.responsibilities,
      achievements: record.achievements,
      sortOrder: record.sortOrder,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }
}
