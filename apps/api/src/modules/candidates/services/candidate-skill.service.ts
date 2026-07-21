import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException, Logger } from '@nestjs/common';
import { CandidateSkillRepository } from '../repositories/candidate-skill.repository';
import { CandidateProfileCompletionService } from './candidate-profile-completion.service';
import { CandidateProfileRepository } from '../repositories/candidate-profile.repository';
import { CandidatePreferencesRepository } from '../repositories/candidate-preferences.repository';
import { CandidateEducationRepository } from '../repositories/candidate-education.repository';
import { CandidateWorkExperienceRepository } from '../repositories/candidate-work-experience.repository';
import { AuditService } from '../../audit/audit.service';
import { AuditActorType, AuditOutcome } from '@nexthire/types';
import { candidateSkillSchema, updateCandidateSkillSchema, reorderCandidateSkillsSchema } from '@nexthire/validation';

@Injectable()
export class CandidateSkillService {
  private readonly logger = new Logger(CandidateSkillService.name);
  private readonly MAX_SKILLS = 50;

  constructor(
    private readonly skillRepository: CandidateSkillRepository,
    private readonly profileRepository: CandidateProfileRepository,
    private readonly preferencesRepository: CandidatePreferencesRepository,
    private readonly educationRepository: CandidateEducationRepository,
    private readonly workExpRepository: CandidateWorkExperienceRepository,
    private readonly completionService: CandidateProfileCompletionService,
    private readonly auditService: AuditService,
  ) {}

  async listRecords(userId: string) {
    try {
      const records = await this.skillRepository.findByUserId(userId);
      const completion = await this.recalculateCompletion(userId);

      await this.auditService.recordRequired({
        actorType: AuditActorType.USER,
        actorUserId: userId,
        action: 'candidate.skill.viewed',
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
      this.logger.error(`Error listing skills for user ${userId}`, error instanceof Error ? error.stack : error);
      throw new InternalServerErrorException('Failed to retrieve skills');
    }
  }

  async createRecord(userId: string, input: any) {
    try {
      const parseResult = candidateSkillSchema.safeParse(input);
      if (!parseResult.success) {
        throw new BadRequestException('CANDIDATE_SKILL_VALIDATION_FAILED');
      }
      const validatedData = parseResult.data;

      const normalizedName = validatedData.name.trim().toLowerCase();
      const existing = await this.skillRepository.findByNormalizedNameAndUserId(normalizedName, userId);
      if (existing) {
        throw new BadRequestException('CANDIDATE_SKILL_DUPLICATE');
      }

      const count = await this.skillRepository.countByUserId(userId);
      if (count >= this.MAX_SKILLS) {
        throw new BadRequestException('CANDIDATE_SKILL_LIMIT_REACHED');
      }

      const sortOrder = count;
      const record = await this.skillRepository.create(userId, validatedData, normalizedName, sortOrder);
      const completion = await this.recalculateCompletion(userId);

      await this.auditService.recordRequired({
        actorType: AuditActorType.USER,
        actorUserId: userId,
        action: 'candidate.skill.created',
        targetType: 'CandidateSkill',
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
      this.logger.error(`Error creating skill for user ${userId}`, error instanceof Error ? error.stack : error);
      throw new InternalServerErrorException('Failed to create skill');
    }
  }

  async updateRecord(userId: string, recordId: string, input: any) {
    try {
      const parseResult = updateCandidateSkillSchema.safeParse(input);
      if (!parseResult.success) {
        throw new BadRequestException('CANDIDATE_SKILL_VALIDATION_FAILED');
      }
      const validatedData = parseResult.data;

      const existing = await this.skillRepository.findByIdAndUserId(recordId, userId);
      if (!existing) {
        throw new NotFoundException('CANDIDATE_SKILL_NOT_FOUND');
      }

      if (validatedData.name) {
        const normalizedName = validatedData.name.trim().toLowerCase();
        const duplicate = await this.skillRepository.findByNormalizedNameAndUserId(normalizedName, userId);
        if (duplicate && duplicate.id !== recordId) {
          throw new BadRequestException('CANDIDATE_SKILL_DUPLICATE');
        }
      }

      const normalizedName = validatedData.name ? validatedData.name.trim().toLowerCase() : existing.normalizedName;
      const record = await this.skillRepository.update(recordId, validatedData, normalizedName);
      const completion = await this.recalculateCompletion(userId);

      const changedFieldNames = Object.keys(validatedData);

      await this.auditService.recordRequired({
        actorType: AuditActorType.USER,
        actorUserId: userId,
        action: 'candidate.skill.updated',
        targetType: 'CandidateSkill',
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
      this.logger.error(`Error updating skill ${recordId} for user ${userId}`, error instanceof Error ? error.stack : error);
      throw new InternalServerErrorException('Failed to update skill');
    }
  }

  async deleteRecord(userId: string, recordId: string) {
    try {
      const existing = await this.skillRepository.findByIdAndUserId(recordId, userId);
      if (!existing) {
        throw new NotFoundException('CANDIDATE_SKILL_NOT_FOUND');
      }

      const countBefore = await this.skillRepository.countByUserId(userId);
      await this.skillRepository.delete(recordId);
      const completion = await this.recalculateCompletion(userId);

      await this.auditService.recordRequired({
        actorType: AuditActorType.USER,
        actorUserId: userId,
        action: 'candidate.skill.deleted',
        targetType: 'CandidateSkill',
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
      this.logger.error(`Error deleting skill ${recordId} for user ${userId}`, error instanceof Error ? error.stack : error);
      throw new InternalServerErrorException('Failed to delete skill');
    }
  }

  async reorderRecords(userId: string, input: any) {
    try {
      const parseResult = reorderCandidateSkillsSchema.safeParse(input);
      if (!parseResult.success) {
        throw new BadRequestException('CANDIDATE_SKILL_VALIDATION_FAILED');
      }
      const validatedData = parseResult.data;

      const records = await this.skillRepository.findByUserId(userId);
      const ownedIds = new Set(records.map(r => r.id));

      for (const id of validatedData.orderedIds) {
        if (!ownedIds.has(id)) {
          throw new BadRequestException('Cannot reorder records that do not belong to you or do not exist');
        }
      }

      const updates = validatedData.orderedIds.map((id, index) => ({ id, sortOrder: index }));
      await this.skillRepository.updateSortOrder(updates);
      const completion = await this.recalculateCompletion(userId);

      await this.auditService.recordRequired({
        actorType: AuditActorType.USER,
        actorUserId: userId,
        action: 'candidate.skill.reordered',
        targetType: 'CandidateProfile',
        targetId: userId,
        outcome: AuditOutcome.SUCCESS,
        metadata: {},
      });

      return { completion };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Error reordering skills for user ${userId}`, error instanceof Error ? error.stack : error);
      throw new InternalServerErrorException('Failed to reorder skills');
    }
  }

  private async recalculateCompletion(userId: string) {
    const profile = await this.profileRepository.findByUserId(userId);
    const preferences = await this.preferencesRepository.findByUserId(userId);
    const educationRecords = await this.educationRepository.findByUserId(userId);
    const workExperienceRecords = await this.workExpRepository.findByUserId(userId);
    const skills = await this.skillRepository.findByUserId(userId);
    const languages = await this.skillRepository.findByUserId(userId);

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

    const completion = this.completionService.calculateCompletion(profileInput, preferencesInput, educationRecords, workExperienceRecords, skills, languages);
    
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
      name: record.name,
      level: record.level,
      yearsOfExperience: record.yearsOfExperience ? Number(record.yearsOfExperience) : null,
      sortOrder: record.sortOrder,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }
}
