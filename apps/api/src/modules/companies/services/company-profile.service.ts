import { BadRequestException, Injectable } from '@nestjs/common';
import { CompanyRepository } from '../repositories/company.repository';
import { AuditService } from '../../audit/audit.service';
import { companyProfileSchema } from '@nexthire/validation';
import { COMPANY_ERROR_CODES } from '@nexthire/constants';
import { AuditActorType, AuditOutcome } from '@nexthire/types';
import type { CompanyProfileResult } from '@nexthire/types';
import { mapCompanyProfile } from '../shared/company-mappers';

@Injectable()
export class CompanyProfileService {
  constructor(
    private readonly repository: CompanyRepository,
    private readonly auditService: AuditService,
  ) {}

  async getProfile(ownerUserId: string): Promise<{ profile: CompanyProfileResult | null }> {
    const record = await this.repository.findByOwnerUserId(ownerUserId);
    return { profile: record ? mapCompanyProfile(record) : null };
  }

  async upsertProfile(ownerUserId: string, body: unknown): Promise<CompanyProfileResult> {
    const parsed = companyProfileSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        code: COMPANY_ERROR_CODES.PROFILE_VALIDATION_FAILED,
        details: parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      });
    }

    const countryOk = await this.repository.countryExists(parsed.data.headquartersCountryId);
    if (!countryOk) {
      throw new BadRequestException({
        code: COMPANY_ERROR_CODES.PROFILE_VALIDATION_FAILED,
        details: [{ field: 'headquartersCountryId', message: 'Unknown or inactive country' }],
      });
    }

    const existing = await this.repository.findByOwnerUserId(ownerUserId);
    const result = await this.repository.upsert(ownerUserId, parsed.data);

    await this.auditService.recordRequired({
      actorType: AuditActorType.USER,
      actorUserId: ownerUserId,
      action: existing ? 'company.profile.updated' : 'company.profile.created',
      targetType: 'Company',
      targetId: result.id,
      outcome: AuditOutcome.SUCCESS,
    });

    return mapCompanyProfile(result);
  }
}
