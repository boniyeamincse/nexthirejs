import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException, Logger } from '@nestjs/common';
import { CandidateEducationRepository } from '../repositories/candidate-education.repository';
import { CreateEducationRecordInput, UpdateEducationRecordInput, ReorderEducationRecordsInput, educationRecordSchema, updateEducationRecordSchema, reorderEducationRecordsSchema } from '@nexthire/validation';
import { CandidateProfileCompletionService } from './candidate-profile-completion.service';
import { CandidateProfileRepository } from '../repositories/candidate-profile.repository';
import { CandidatePreferencesRepository } from '../repositories/candidate-preferences.repository';
import { CandidateWorkExperienceRepository } from '../repositories/candidate-work-experience.repository';
import { AuditService } from '../../audit/audit.service';
import { AuditActorType, AuditOutcome } from '@nexthire/types';

@Injectable()
export class CandidateEducationService {
  private readonly logger = new Logger(CandidateEducationService.name);

  constructor(
    private readonly educationRepository: CandidateEducationRepository,
    private readonly workExpRepository: CandidateWorkExperienceRepository,
    private readonly profileRepository: CandidateProfileRepository,
    private readonly preferencesRepository: CandidatePreferencesRepository,
    private readonly completionService: CandidateProfileCompletionService,
    private readonly auditService: AuditService,
  ) {}

  async listRecords(userId: string) {
    try {
      const records = await this.educationRepository.findByUserId(userId);
      const completion = await this.recalculateCompletion(userId);

      return {
        records: records.map(this.mapRecordToResponse),
        completion,
      };
    } catch (error) {
      this.logger.error(`Error listing education records for user ${userId}`, error instanceof Error ? error.stack : error);
      throw new InternalServerErrorException('Failed to retrieve education records');
    }
  }

  async createRecord(userId: string, input: any) {
    try {
      const parseResult = educationRecordSchema.safeParse(input);
      if (!parseResult.success) {
        throw new BadRequestException('CANDIDATE_EDUCATION_VALIDATION_FAILED');
      }
      const validatedData = parseResult.data;

      const count = await this.educationRepository.countByUserId(userId);
      if (count >= 20) {
        throw new BadRequestException('CANDIDATE_EDUCATION_LIMIT_REACHED');
      }

      const sortOrder = count;
      const record = await this.educationRepository.create(userId, validatedData, sortOrder);
      const completion = await this.recalculateCompletion(userId);

      await this.auditService.recordRequired({
        actorType: AuditActorType.USER,
        actorUserId: userId,
        action: 'candidate.education.created',
        targetType: 'EducationRecord',
        targetId: record.id,
        outcome: AuditOutcome.SUCCESS,
        metadata: {
          recordId: record.id,
          recordCountBefore: count,
          recordCountAfter: count + 1,
        }
      });

      return {
        record: this.mapRecordToResponse(record),
        completion,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Error creating education record for user ${userId}`, error instanceof Error ? error.stack : error);
      throw new InternalServerErrorException('Failed to create education record');
    }
  }

  async updateRecord(userId: string, recordId: string, input: any) {
    try {
      const parseResult = updateEducationRecordSchema.safeParse(input);
      if (!parseResult.success) {
        throw new BadRequestException('CANDIDATE_EDUCATION_VALIDATION_FAILED');
      }
      const validatedData = parseResult.data;

      const existing = await this.educationRepository.findByIdAndUserId(recordId, userId);
      if (!existing) {
        throw new NotFoundException('CANDIDATE_EDUCATION_NOT_FOUND');
      }

      const record = await this.educationRepository.update(recordId, validatedData);
      const completion = await this.recalculateCompletion(userId);

      const changedFieldNames = Object.keys(validatedData);

      await this.auditService.recordRequired({
        actorType: AuditActorType.USER,
        actorUserId: userId,
        action: 'candidate.education.updated',
        targetType: 'EducationRecord',
        targetId: record.id,
        outcome: AuditOutcome.SUCCESS,
        metadata: {
          recordId: record.id,
          changedFieldNames,
        }
      });

      return {
        record: this.mapRecordToResponse(record),
        completion,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Error updating education record ${recordId} for user ${userId}`, error instanceof Error ? error.stack : error);
      throw new InternalServerErrorException('Failed to update education record');
    }
  }

  async deleteRecord(userId: string, recordId: string) {
    try {
      const existing = await this.educationRepository.findByIdAndUserId(recordId, userId);
      if (!existing) {
        throw new NotFoundException('CANDIDATE_EDUCATION_NOT_FOUND');
      }

      const countBefore = await this.educationRepository.countByUserId(userId);
      await this.educationRepository.delete(recordId);
      
      // Normalize sort order is nice to have, but recalculateCompletion handles everything.
      // Assuming naive hard delete for now.

      await this.recalculateCompletion(userId); // Updates DB

      await this.auditService.recordRequired({
        actorType: AuditActorType.USER,
        actorUserId: userId,
        action: 'candidate.education.deleted',
        targetType: 'EducationRecord',
        targetId: recordId,
        outcome: AuditOutcome.SUCCESS,
        metadata: {
          recordId,
          recordCountBefore: countBefore,
          recordCountAfter: countBefore - 1,
        }
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Error deleting education record ${recordId} for user ${userId}`, error instanceof Error ? error.stack : error);
      throw new InternalServerErrorException('Failed to delete education record');
    }
  }

  async reorderRecords(userId: string, input: any) {
    try {
      const parseResult = reorderEducationRecordsSchema.safeParse(input);
      if (!parseResult.success) {
        throw new BadRequestException('CANDIDATE_EDUCATION_VALIDATION_FAILED');
      }
      const validatedData = parseResult.data;

      const records = await this.educationRepository.findByUserId(userId);
      const ownedIds = new Set(records.map(r => r.id));

      for (const id of validatedData.orderedIds) {
        if (!ownedIds.has(id)) {
          throw new BadRequestException('Cannot reorder records that do not belong to you or do not exist');
        }
      }

      const updates = validatedData.orderedIds.map((id, index) => ({ id, sortOrder: index }));
      await this.educationRepository.updateSortOrder(updates);

      await this.auditService.recordRequired({
        actorType: AuditActorType.USER,
        actorUserId: userId,
        action: 'candidate.education.reordered',
        targetType: 'CandidateProfile',
        targetId: userId,
        outcome: AuditOutcome.SUCCESS,
        metadata: {}
      });
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Error reordering education records for user ${userId}`, error instanceof Error ? error.stack : error);
      throw new InternalServerErrorException('Failed to reorder education records');
    }
  }

  private async recalculateCompletion(userId: string) {
    const profile = await this.profileRepository.findByUserId(userId);
    const preferences = await this.preferencesRepository.findByUserId(userId);
    const educationRecords = await this.educationRepository.findByUserId(userId);
    const workExperienceRecords = await this.workExpRepository.findByUserId(userId);

    const profileInput = profile ? {
      fullName: profile.fullName,
      professionalHeadline: profile.professionalHeadline,
      professionalSummary: profile.professionalSummary,
      dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.toISOString() : undefined,
    } : null;

    const preferencesInput = preferences ? {
      countryCode: preferences.country.code,
      currentCity: preferences.currentCity,
      preferredJobRoles: preferences.preferredJobRoles,
      preferredWorkModes: preferences.preferredWorkModes as any,
      preferredEmploymentTypes: preferences.preferredEmploymentTypes as any,
    } : null;

    const completion = this.completionService.calculateCompletion(profileInput, preferencesInput, educationRecords, workExperienceRecords);
    
    if (profile) {
      await this.profileRepository.upsertProfile(userId, {
        fullName: profile.fullName,
        professionalHeadline: profile.professionalHeadline,
        professionalSummary: profile.professionalSummary,
        dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.toISOString() : undefined,
      }, completion.percentage);
    } else {
      await this.profileRepository.upsertProfile(userId, {
        fullName: 'Unknown',
      }, completion.percentage);
    }

    return completion;
  }

  private mapRecordToResponse(record: any) {
    return {
      id: record.id,
      educationLevel: record.educationLevel,
      institutionName: record.institutionName,
      qualification: record.qualification,
      fieldOfStudy: record.fieldOfStudy,
      startDate: record.startDate.toISOString(),
      endDate: record.endDate ? record.endDate.toISOString() : null,
      currentlyStudying: record.currentlyStudying,
      grade: record.grade,
      description: record.description,
      sortOrder: record.sortOrder,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }
}
