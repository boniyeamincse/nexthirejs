import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/auth.guard';
import type { AuthenticatedRequest } from '../../auth/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequireRoles } from '../../../common/decorators/roles.decorator';
import { CompanyInvitationService } from '../services/company-invitation.service';
import { COMPANY_RATE_LIMITS } from '@nexthire/constants';

const HOUR_MS = 3_600_000;

@ApiTags('Company Invitations')
@ApiBearerAuth('access-token')
@Controller({ path: 'companies/invitations', version: '1' })
@UseGuards(AuthGuard, RolesGuard)
@RequireRoles('candidate')
export class CompanyInvitationsMeController {
  constructor(private readonly invitationService: CompanyInvitationService) {}

  @Get('me')
  @ApiOperation({ summary: 'List pending company invitations addressed to the current user' })
  async listMine(@Req() req: AuthenticatedRequest) {
    return this.invitationService.listMine(req.principal.userId);
  }

  @Post(':invitationId/accept')
  @Throttle({ default: { limit: COMPANY_RATE_LIMITS.INVITATION_ACTION_PER_HOUR, ttl: HOUR_MS } })
  @ApiOperation({ summary: 'Accept a pending company invitation' })
  async accept(@Req() req: AuthenticatedRequest, @Param('invitationId') invitationId: string) {
    return this.invitationService.accept(req.principal.userId, invitationId);
  }

  @Post(':invitationId/decline')
  @Throttle({ default: { limit: COMPANY_RATE_LIMITS.INVITATION_ACTION_PER_HOUR, ttl: HOUR_MS } })
  @ApiOperation({ summary: 'Decline a pending company invitation' })
  async decline(@Req() req: AuthenticatedRequest, @Param('invitationId') invitationId: string) {
    await this.invitationService.decline(req.principal.userId, invitationId);
    return { success: true };
  }
}
