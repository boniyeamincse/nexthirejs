import { BadRequestException, Injectable } from '@nestjs/common';
import { ExpertProfileRepository } from '../repositories/expert-profile.repository';
import { AuditService } from '../../audit/audit.service';
import { expertProfileSchema } from '@nexthire/validation';
import { EXPERT_ERROR_CODES } from '@nexthire/constants';
import { AuditActorType, AuditOutcome } from '@nexthire/types';
import type { ExpertProfileResult } from '@nexthire/types';
import { mapProfile } from '../shared/expert-mappers';

/**
 * Manages the expert's own professional profile (get + upsert).
 */
@Injectable()
export class ExpertProfileService {
  constructor(
    private readonly repository: ExpertProfileRepository,
    private readonly auditService: AuditService,
  ) {}

  async getProfile(userId: string): Promise<{ profile: ExpertProfileResult | null }> {
    const record = await this.repository.findByUserId(userId);
    return { profile: record ? mapProfile(record) : null };
  }

  async upsertProfile(userId: string, body: unknown): Promise<ExpertProfileResult> {
    const parsed = expertProfileSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        code: EXPERT_ERROR_CODES.PROFILE_VALIDATION_FAILED,
        details: parsed.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      });
    }

    const countryOk = await this.repository.countryExists(parsed.data.countryId);
    if (!countryOk) {
      throw new BadRequestException({
        code: EXPERT_ERROR_CODES.PROFILE_VALIDATION_FAILED,
        details: [{ field: 'countryId', message: 'Unknown or inactive country' }],
      });
    }

    const existing = await this.repository.findByUserId(userId);
    const result = await this.repository.upsert(userId, parsed.data);

    const changedFields = existing
      ? Object.keys(parsed.data).filter((key) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const nextVal = (parsed.data as any)[key];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const prevVal = (existing as any)[key];
          return JSON.stringify(nextVal ?? null) !== JSON.stringify(prevVal ?? null);
        })
      : Object.keys(parsed.data);

    await this.auditService.recordRequired({
      actorType: AuditActorType.USER,
      actorUserId: userId,
      action: existing ? 'expert.profile.updated' : 'expert.profile.created',
      targetType: 'ExpertProfile',
      targetId: result.id,
      outcome: AuditOutcome.SUCCESS,
      metadata: { changedFieldNames: changedFields },
    });

    return mapProfile(result);
  }
}
