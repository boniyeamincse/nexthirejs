import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/auth.guard';
import type { AuthenticatedRequest } from '../../auth/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequireRoles } from '../../../common/decorators/roles.decorator';
import { MfaRequiredGuard } from '../../auth/mfa/mfa-required.guard';
import { ExpertApplicationReviewService } from '../services/expert-application-review.service';
import { resolveClientIp } from '../shared/client-ip.util';
import { EXPERT_RATE_LIMITS } from '@nexthire/constants';

const HOUR_MS = 3_600_000;

@ApiTags('Expert Application Review')
@ApiBearerAuth('access-token')
@Controller('v1/manage/experts')
@UseGuards(AuthGuard, RolesGuard, MfaRequiredGuard)
@RequireRoles('expert_application_reviewer')
export class ExpertApplicationAdminController {
  constructor(
    private readonly reviewService: ExpertApplicationReviewService,
    private readonly configService: ConfigService,
  ) {}

  private clientIp(req: AuthenticatedRequest): string | undefined {
    return resolveClientIp(req, this.configService.get<string>('TRUSTED_PROXY_IPS'));
  }

  @Get('applications')
  @Throttle({ default: { limit: 120, ttl: HOUR_MS } })
  @ApiOperation({ summary: 'List expert applications in the review queue' })
  @ApiResponse({ status: 200, description: 'Paginated application queue' })
  async list(@Query() query: unknown) {
    return this.reviewService.list(query);
  }

  @Get('documents')
  @Throttle({ default: { limit: EXPERT_RATE_LIMITS.DOCUMENT_ACCESS_PER_HOUR, ttl: HOUR_MS } })
  @Header('Cache-Control', 'no-store')
  @Header('X-Content-Type-Options', 'nosniff')
  @ApiOperation({ summary: 'Fetch a verification document via a signed token' })
  @ApiResponse({ status: 200, description: 'Document stream' })
  @ApiResponse({ status: 404, description: 'Invalid/expired token or document not found' })
  async getDocument(
    @Query('key') key: string,
    @Query('expires') expires: string,
    @Query('signature') signature: string,
    @Res() res: Response,
  ): Promise<void> {
    if (!key || !expires || !signature) {
      throw new BadRequestException('EXPERT_SIGNED_URL_INVALID');
    }
    const { buffer, mimeType, fileName } = await this.reviewService.resolveSignedDocument(
      key,
      Number(expires),
      signature,
    );
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileName)}"`);
    res.send(buffer);
  }

  @Get('applications/:applicationId')
  @Throttle({ default: { limit: 120, ttl: HOUR_MS } })
  @ApiOperation({ summary: 'Get full application detail with signed document URLs' })
  @ApiResponse({ status: 200, description: 'Application detail' })
  @ApiResponse({ status: 404, description: 'EXPERT_APPLICATION_NOT_FOUND' })
  async detail(@Req() req: AuthenticatedRequest, @Param('applicationId') applicationId: string) {
    return this.reviewService.getDetail(req.principal.userId, applicationId);
  }

  @Post('applications/:applicationId/approve')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: EXPERT_RATE_LIMITS.REVIEW_DECISION_PER_HOUR, ttl: HOUR_MS } })
  @ApiOperation({ summary: 'Approve an application and grant the expert role' })
  @ApiResponse({ status: 200, description: 'Application approved' })
  @ApiResponse({ status: 409, description: 'Invalid transition / already approved' })
  async approve(
    @Req() req: AuthenticatedRequest,
    @Param('applicationId') applicationId: string,
    @Body() body: unknown,
  ) {
    return this.reviewService.approve(req.principal.userId, applicationId, body, {
      ipAddress: this.clientIp(req),
    });
  }

  @Post('applications/:applicationId/reject')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: EXPERT_RATE_LIMITS.REVIEW_DECISION_PER_HOUR, ttl: HOUR_MS } })
  @ApiOperation({ summary: 'Reject an application with a reason code' })
  @ApiResponse({ status: 200, description: 'Application rejected' })
  @ApiResponse({ status: 400, description: 'EXPERT_REVIEW_DECISION_INVALID' })
  async reject(
    @Req() req: AuthenticatedRequest,
    @Param('applicationId') applicationId: string,
    @Body() body: unknown,
  ) {
    return this.reviewService.reject(req.principal.userId, applicationId, body, {
      ipAddress: this.clientIp(req),
    });
  }

  @Post('applications/:applicationId/request-changes')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: EXPERT_RATE_LIMITS.REVIEW_DECISION_PER_HOUR, ttl: HOUR_MS } })
  @ApiOperation({ summary: 'Request changes from the applicant' })
  @ApiResponse({ status: 200, description: 'Changes requested' })
  @ApiResponse({ status: 400, description: 'EXPERT_REVIEW_DECISION_INVALID' })
  async requestChanges(
    @Req() req: AuthenticatedRequest,
    @Param('applicationId') applicationId: string,
    @Body() body: unknown,
  ) {
    return this.reviewService.requestChanges(req.principal.userId, applicationId, body, {
      ipAddress: this.clientIp(req),
    });
  }
}
