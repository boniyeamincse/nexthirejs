import { Controller, Get, Post, Param, Req, UseGuards, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from '../../../auth/auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { RequireRoles } from '../../../../common/decorators/roles.decorator';
import { CertificateService } from '../services/certificate.service';
import { AssessmentCertificateQuerySchema } from '@nexthire/validation';
import type { AuthenticatedRequest } from '../../../auth/auth.guard';

@ApiTags('Assessment Certificates')
@Controller('v1/candidates/me/certificates')
@UseGuards(AuthGuard, RolesGuard)
@RequireRoles('candidate')
@ApiBearerAuth('access-token')
export class CertificateController {
  constructor(private readonly certificateService: CertificateService) {}

  @Get()
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({ summary: 'List my certificates' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiResponse({ status: 200, description: 'Certificate list' })
  async listCertificates(
    @Req() req: AuthenticatedRequest,
    @Query() query: Record<string, any>,
  ) {
    const parsed = AssessmentCertificateQuerySchema.safeParse(query);
    return this.certificateService.listCertificates(req.principal.userId, parsed.data ?? {});
  }

  @Get(':certificateId')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({ summary: 'Get certificate detail' })
  @ApiResponse({ status: 200, description: 'Certificate detail' })
  async getCertificate(
    @Req() req: AuthenticatedRequest,
    @Param('certificateId') certificateId: string,
  ) {
    return this.certificateService.getCertificateDetail(req.principal.userId, certificateId);
  }

  @Post(':certificateId/download')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 3600000 } })
  @ApiOperation({ summary: 'Download certificate PDF' })
  @ApiResponse({ status: 200, description: 'Download URL' })
  async downloadCertificate(
    @Req() req: AuthenticatedRequest,
    @Param('certificateId') certificateId: string,
  ) {
    return this.certificateService.downloadCertificate(req.principal.userId, certificateId);
  }

  @Post(':certificateId/retry')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 86400000 } })
  @ApiOperation({ summary: 'Retry failed certificate generation' })
  @ApiResponse({ status: 200, description: 'Retry status' })
  async retryCertificate(
    @Req() req: AuthenticatedRequest,
    @Param('certificateId') certificateId: string,
  ) {
    return this.certificateService.retryCertificateGeneration(req.principal.userId, certificateId);
  }
}
