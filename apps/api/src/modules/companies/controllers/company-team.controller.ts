import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/auth.guard';
import type { AuthenticatedRequest } from '../../auth/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequireRoles } from '../../../common/decorators/roles.decorator';
import { CompanyMembershipService } from '../services/company-membership.service';
import { CompanyInvitationService } from '../services/company-invitation.service';
import { COMPANY_RATE_LIMITS } from '@nexthire/constants';

const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

@ApiTags('Company Team')
@ApiBearerAuth('access-token')
@Controller({ path: 'companies/me/team', version: '1' })
@UseGuards(AuthGuard, RolesGuard)
@RequireRoles('candidate')
export class CompanyTeamController {
  constructor(
    private readonly membershipService: CompanyMembershipService,
    private readonly invitationService: CompanyInvitationService,
  ) {}

  @Get('role')
  @ApiOperation({ summary: "Get the current user's role in their company, if any" })
  async getMyRole(@Req() req: AuthenticatedRequest) {
    return this.membershipService.getMyRole(req.principal.userId);
  }

  @Get()
  @ApiOperation({ summary: 'List the current company team roster' })
  async listMembers(@Req() req: AuthenticatedRequest) {
    return this.membershipService.listMembers(req.principal.userId);
  }

  @Patch('members/:memberId')
  @Throttle({ default: { limit: COMPANY_RATE_LIMITS.INVITATION_ACTION_PER_HOUR, ttl: HOUR_MS } })
  @ApiOperation({ summary: "Update a team member's role" })
  async updateMemberRole(
    @Req() req: AuthenticatedRequest,
    @Param('memberId') memberId: string,
    @Body() body: { role: 'ADMIN' | 'RECRUITER' | 'VIEWER' },
  ) {
    return this.membershipService.updateMemberRole(req.principal.userId, memberId, body.role);
  }

  @Delete('members/:memberId')
  @Throttle({ default: { limit: COMPANY_RATE_LIMITS.INVITATION_ACTION_PER_HOUR, ttl: HOUR_MS } })
  @ApiOperation({ summary: 'Remove a team member (or leave, for your own membership)' })
  async removeMember(@Req() req: AuthenticatedRequest, @Param('memberId') memberId: string) {
    await this.membershipService.removeMember(req.principal.userId, memberId);
    return { success: true };
  }

  @Get('invitations')
  @ApiOperation({ summary: 'List invitations sent by the current company' })
  async listInvitations(@Req() req: AuthenticatedRequest) {
    return this.invitationService.listForMyCompany(req.principal.userId);
  }

  @Post('invitations')
  @Throttle({ default: { limit: COMPANY_RATE_LIMITS.INVITATION_SEND_PER_DAY, ttl: DAY_MS } })
  @ApiOperation({ summary: 'Invite an existing NextHire user to the company team' })
  @ApiResponse({
    status: 400,
    description: 'COMPANY_INVITEE_NOT_FOUND / already a member / already pending',
  })
  async invite(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    return this.invitationService.invite(req.principal.userId, body);
  }

  @Delete('invitations/:invitationId')
  @Throttle({ default: { limit: COMPANY_RATE_LIMITS.INVITATION_ACTION_PER_HOUR, ttl: HOUR_MS } })
  @ApiOperation({ summary: 'Revoke a pending invitation' })
  async revokeInvitation(
    @Req() req: AuthenticatedRequest,
    @Param('invitationId') invitationId: string,
  ) {
    await this.invitationService.revoke(req.principal.userId, invitationId);
    return { success: true };
  }
}
