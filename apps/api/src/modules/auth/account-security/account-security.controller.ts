import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequireRoles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { AccountSecurityService } from './account-security.service';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedPrincipal } from '../interfaces/authenticated-principal.interface';
import type { CandidateAccountSecuritySummary } from '@nexthire/types';
import { AuditActorType, AuditOutcome } from '@nexthire/types';

@ApiTags('Account Security')
@Controller({ path: 'candidates/me/account-security', version: '1' })
@UseGuards(AuthGuard, RolesGuard)
@RequireRoles('candidate')
@ApiBearerAuth()
export class AccountSecurityController {
  constructor(
    private readonly accountSecurityService: AccountSecurityService,
    private readonly auditService: AuditService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get account security summary for the current candidate' })
  @ApiResponse({ status: 200, description: 'Account security summary retrieved' })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  @ApiResponse({ status: 403, description: 'Candidate role required' })
  async getSummary(
    @CurrentUser() principal: AuthenticatedPrincipal,
  ): Promise<CandidateAccountSecuritySummary> {
    const summary = await this.accountSecurityService.getSummary(
      principal.userId,
      principal.sessionId!,
    );

    await this.auditService.recordBestEffort({
      action: 'candidate.account_security.viewed',
      actorType: AuditActorType.USER,
      actorUserId: principal.userId,
      targetType: 'user',
      targetId: principal.userId,
      outcome: AuditOutcome.SUCCESS,
    });

    return summary;
  }
}
