import { Controller, Get, Put, Post, Body, UseGuards, Req, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CandidateShareTokenService } from './candidate-share-token.service';
import { AuthGuard } from '../../auth/auth.guard';
import type { AuthenticatedRequest } from '../../auth/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequireRoles } from '../../../common/decorators/roles.decorator';
import { AuditService } from '../../audit/audit.service';
import { AuditActorType, AuditOutcome } from '@nexthire/types';

@ApiTags('Profile Share Link')
@Controller({
  path: 'candidates/me/profile-share-link',
  version: '1',
})
@UseGuards(AuthGuard, RolesGuard)
@RequireRoles('candidate')
@ApiBearerAuth()
export class CandidateShareTokenController {
  constructor(
    private readonly shareTokenService: CandidateShareTokenService,
    private readonly auditService: AuditService,
  ) {}

  @Post('rotate')
  @ApiOperation({ summary: 'Rotate profile share link token' })
  @ApiResponse({ status: 201, description: 'Token rotated successfully' })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  @ApiResponse({ status: 403, description: 'Candidate role required' })
  async rotate(@Req() req: AuthenticatedRequest) {
    const { rawToken, rotatedAt } = await this.shareTokenService.rotateToken(req.principal.userId);
    const shareUrl = `https://app.nexthire.com/shared-profile/${rawToken}`;

    await this.auditService.recordRequired({
      actorType: AuditActorType.USER,
      actorUserId: req.principal.userId,
      action: 'candidate.profile_share_link.rotated',
      targetType: 'CandidateProfileShareToken',
      targetId: req.principal.userId,
      outcome: AuditOutcome.SUCCESS,
      metadata: { rotatedAt: rotatedAt.toISOString() },
    });

    return { shareUrl, rotatedAt };
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enable or disable profile share link' })
  @ApiResponse({ status: 200, description: 'Share link status updated' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  @ApiResponse({ status: 403, description: 'Candidate role required' })
  async setEnabled(
    @Req() req: AuthenticatedRequest,
    @Body() body: Record<string, unknown>,
  ) {
    if (typeof body?.enabled !== 'boolean') {
      throw new BadRequestException('VALIDATION_FAILED');
    }

    const enabled = body.enabled;
    await this.shareTokenService.setEnabled(req.principal.userId, enabled);

    void this.auditService.recordBestEffort({
      actorType: AuditActorType.USER,
      actorUserId: req.principal.userId,
      action: enabled ? 'candidate.profile_share_link.enabled' : 'candidate.profile_share_link.disabled',
      targetType: 'CandidateProfileShareToken',
      targetId: req.principal.userId,
      outcome: AuditOutcome.SUCCESS,
    }).catch(() => {});

    return { enabled };
  }

  @Get('status')
  @ApiOperation({ summary: 'Get profile share link status' })
  @ApiResponse({ status: 200, description: 'Share link status retrieved' })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  @ApiResponse({ status: 403, description: 'Candidate role required' })
  async getStatus(@Req() req: AuthenticatedRequest) {
    return this.shareTokenService.getStatus(req.principal.userId);
  }
}
