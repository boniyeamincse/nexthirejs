import { Controller, Get, Put, Param, Req, UseGuards, HttpCode, HttpStatus, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from '../../../auth/auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { RequireRoles } from '../../../../common/decorators/roles.decorator';
import { RetakeEligibilityService } from '../services/retake-eligibility.service';
import { RetakePolicyService } from '../services/retake-policy.service';
import { AuditService } from '../../../audit/audit.service';
import { AuditActorType } from '@nexthire/types';
import type { AuthenticatedRequest } from '../../../auth/auth.guard';

@ApiTags('Assessment Retakes')
@Controller('v1')
export class RetakeController {
  constructor(
    private readonly eligibilityService: RetakeEligibilityService,
    private readonly retakePolicyService: RetakePolicyService,
    private readonly auditService: AuditService,
  ) {}

  @Get('assessments/:assessmentIdOrSlug/retake-eligibility')
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRoles('candidate')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get retake eligibility for an assessment' })
  @ApiResponse({ status: 200, description: 'Retake eligibility info' })
  async getRetakeEligibility(
    @Req() req: AuthenticatedRequest,
    @Param('assessmentIdOrSlug') assessmentIdOrSlug: string,
  ) {
    const result = await this.eligibilityService.getEligibility(req.principal.userId, assessmentIdOrSlug);

    await this.auditService.recordBestEffort({
      actorType: AuditActorType.USER,
      actorUserId: req.principal.userId,
      action: 'assessment.retake_eligibility.viewed',
      targetType: 'Assessment',
      targetId: result.assessmentId,
      metadata: {
        assessmentId: result.assessmentId,
        retakeReason: result.reason,
        attemptsUsed: result.attemptsUsed,
        maximumAttempts: result.maximumAttempts,
      },
    });

    return result;
  }

  @Put('manage/assessments/:assessmentId/retake-certificate-policy')
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRoles('assessment_manager', 'assessment_publish')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update retake and certificate policy' })
  @ApiResponse({ status: 200, description: 'Policy updated' })
  async updateRetakeCertificatePolicy(
    @Req() req: AuthenticatedRequest,
    @Param('assessmentId') assessmentId: string,
    @Body() input: any,
  ) {
    const result = await this.retakePolicyService.updatePolicy(assessmentId, input);

    await this.auditService.recordBestEffort({
      actorType: AuditActorType.USER,
      actorUserId: req.principal.userId,
      action: 'assessment.retake_certificate_policy.updated',
      targetType: 'Assessment',
      targetId: assessmentId,
      metadata: {
        assessmentId,
        retakeEnabled: result.retakeEnabled,
        maximumAttempts: result.maximumAttempts,
        cooldownHours: result.retakeCooldownHours,
        certificateEnabled: result.certificateEnabled,
      },
    });

    return result;
  }
}
