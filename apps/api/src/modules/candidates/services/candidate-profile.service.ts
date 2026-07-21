import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { CandidateProfileRepository } from '../repositories/candidate-profile.repository';
import { CandidateProfileCompletionService } from './candidate-profile-completion.service';
import { candidateProfileBasicsSchema, CandidateProfileBasicsInput } from '@nexthire/validation';
import { CandidateProfileBasics, AuditActorType, AuditOutcome } from '@nexthire/types';
import { AuditService } from '../../audit/audit.service';

@Injectable()
export class CandidateProfileService {
  constructor(
    private readonly repository: CandidateProfileRepository,
    private readonly completionService: CandidateProfileCompletionService,
    private readonly auditService: AuditService,
  ) {}

  async getProfile(userId: string): Promise<{ profile: CandidateProfileBasics | null, completion: any }> {
    const record = await this.repository.findByUserId(userId);

    if (!record) {
      return {
        profile: null,
        completion: this.completionService.calculateCompletion(null),
      };
    }

    const inputData: Partial<CandidateProfileBasicsInput> = {
      fullName: record.fullName,
      professionalHeadline: record.professionalHeadline,
      professionalSummary: record.professionalSummary,
      dateOfBirth: record.dateOfBirth ? record.dateOfBirth.toISOString() : undefined,
    };

    const completion = this.completionService.calculateCompletion(inputData);
    
    // Explicitly audit profile view (best effort)
    void this.auditService.recordBestEffort({
      actorType: AuditActorType.USER,
      actorUserId: userId,
      action: 'candidate.profile.viewed',
      targetType: 'CandidateProfile',
      targetId: record.id,
      outcome: AuditOutcome.SUCCESS,
    }).catch(() => {});

    return {
      profile: this.mapToResponse(record, record.user.email, completion),
      completion,
    };
  }

  async upsertProfile(userId: string, data: any): Promise<CandidateProfileBasics> {
    const parseResult = candidateProfileBasicsSchema.safeParse(data);
    if (!parseResult.success) {
      throw new BadRequestException('CANDIDATE_PROFILE_VALIDATION_FAILED');
    }

    const validatedData = parseResult.data;
    
    const existingProfile = await this.repository.findByUserId(userId);
    const completionBefore = existingProfile 
      ? this.completionService.calculateCompletion({
          fullName: existingProfile.fullName,
          professionalHeadline: existingProfile.professionalHeadline,
          professionalSummary: existingProfile.professionalSummary,
          dateOfBirth: existingProfile.dateOfBirth ? existingProfile.dateOfBirth.toISOString() : undefined,
        })
      : this.completionService.calculateCompletion(null);

    const completionAfter = this.completionService.calculateCompletion(validatedData);

    try {
      const result = await this.repository.upsertProfile(userId, validatedData, completionAfter.percentage);
      
      const changedFieldNames = existingProfile 
        ? Object.keys(validatedData).filter(key => {
            const newVal = (validatedData as any)[key];
            let oldVal: any = existingProfile[key as keyof typeof existingProfile];
            if (oldVal instanceof Date) oldVal = oldVal.toISOString();
            return newVal !== oldVal;
          })
        : Object.keys(validatedData);

      const action = existingProfile ? 'candidate.profile.updated' : 'candidate.profile.created';
      
      await this.auditService.recordRequired({
        actorType: AuditActorType.USER,
        actorUserId: userId,
        action,
        targetType: 'CandidateProfile',
        targetId: result.id,
        outcome: AuditOutcome.SUCCESS,
        metadata: {
          completionPercentageBefore: completionBefore.percentage,
          completionPercentageAfter: completionAfter.percentage,
          changedFieldNames,
        }
      });

      return this.mapToResponse(result, result.user.email, completionAfter);
    } catch (error) {
      if ((error as any).code === 'P2002') {
         throw new ConflictException('CANDIDATE_PROFILE_CONFLICT');
      }
      throw error; // Will be mapped to 500 by global filter
    }
  }

  private mapToResponse(record: any, email: string, completion: any): CandidateProfileBasics {
    return {
      id: record.id,
      userId: record.userId,
      email,
      fullName: record.fullName,
      professionalHeadline: record.professionalHeadline,
      professionalSummary: record.professionalSummary,
      dateOfBirth: record.dateOfBirth ? record.dateOfBirth.toISOString() : null,
      completion,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }
}
