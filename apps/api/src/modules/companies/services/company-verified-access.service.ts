import { ForbiddenException, Injectable } from '@nestjs/common';
import { CompanyMemberRepository } from '../repositories/company-member.repository';
import { CompanyApplicationRepository } from '../repositories/company-application.repository';
import { COMPANY_ERROR_CODES } from '@nexthire/constants';

@Injectable()
export class CompanyVerifiedAccessService {
  constructor(
    private readonly memberRepository: CompanyMemberRepository,
    private readonly applicationRepository: CompanyApplicationRepository,
  ) {}

  /** Any team member (any role) of a verified (APPROVED) company may search/view candidates. */
  async requireVerifiedMember(userId: string): Promise<{ companyId: string; role: string }> {
    const membership = await this.memberRepository.findByUserId(userId);
    if (!membership) {
      throw new ForbiddenException({ code: COMPANY_ERROR_CODES.NOT_A_MEMBER });
    }

    const approved = await this.applicationRepository.isApproved(membership.companyId);
    if (!approved) {
      throw new ForbiddenException({ code: COMPANY_ERROR_CODES.NOT_VERIFIED });
    }

    return membership;
  }
}
