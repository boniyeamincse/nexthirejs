import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '../../auth/auth.guard';
import type { AuthenticatedRequest } from '../../auth/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequireRoles } from '../../../common/decorators/roles.decorator';
import { ExpertApplicationService } from '../services/expert-application.service';
import { ExpertDocumentService } from '../services/expert-document.service';
import type { UploadedFileLike } from '../services/expert-document.service';
import { resolveClientIp } from '../shared/client-ip.util';
import { EXPERT_LIMITS, EXPERT_RATE_LIMITS } from '@nexthire/constants';

const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;
/** Hard multer ceiling; the 10MB business rule is enforced in the service. */
const MULTER_MAX_BYTES = EXPERT_LIMITS.MAX_DOCUMENT_SIZE_BYTES * 2;

@ApiTags('Expert Application')
@ApiBearerAuth('access-token')
@Controller('experts/me/application')
@UseGuards(AuthGuard, RolesGuard)
@RequireRoles('candidate')
export class ExpertApplicationController {
  constructor(
    private readonly applicationService: ExpertApplicationService,
    private readonly documentService: ExpertDocumentService,
    private readonly configService: ConfigService,
  ) {}

  private clientIp(req: AuthenticatedRequest): string | undefined {
    return resolveClientIp(req, this.configService.get<string>('TRUSTED_PROXY_IPS'));
  }

  @Get()
  @ApiOperation({ summary: 'Get the current expert application (or null)' })
  @ApiResponse({ status: 200, description: 'Active application with readiness' })
  async getApplication(@Req() req: AuthenticatedRequest) {
    return this.applicationService.getMyApplication(req.principal.userId);
  }

  @Post()
  @Throttle({ default: { limit: EXPERT_RATE_LIMITS.PROFILE_UPDATE_PER_HOUR, ttl: HOUR_MS } })
  @ApiOperation({ summary: 'Create a draft expert application' })
  @ApiResponse({ status: 201, description: 'Draft application created' })
  @ApiResponse({ status: 409, description: 'EXPERT_APPLICATION_ALREADY_ACTIVE' })
  async createApplication(@Req() req: AuthenticatedRequest) {
    return this.applicationService.createApplication(req.principal.userId);
  }

  @Get('readiness')
  @ApiOperation({ summary: 'Check whether the application is ready to submit' })
  @ApiResponse({ status: 200, description: 'Readiness report with blockers' })
  async getReadiness(@Req() req: AuthenticatedRequest) {
    return this.applicationService.getReadiness(req.principal.userId);
  }

  @Post('submit')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: EXPERT_RATE_LIMITS.APPLICATION_SUBMIT_PER_DAY, ttl: DAY_MS } })
  @ApiOperation({ summary: 'Submit the application for review' })
  @ApiResponse({ status: 200, description: 'Application submitted' })
  @ApiResponse({ status: 400, description: 'EXPERT_APPLICATION_NOT_READY' })
  @ApiResponse({ status: 403, description: 'MFA_REQUIRED_BY_POLICY' })
  async submit(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    return this.applicationService.submit(req.principal.userId, body, {
      ipAddress: this.clientIp(req),
    });
  }

  @Post('withdraw')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: EXPERT_RATE_LIMITS.PROFILE_UPDATE_PER_HOUR, ttl: HOUR_MS } })
  @ApiOperation({ summary: 'Withdraw the active application' })
  @ApiResponse({ status: 200, description: 'Application withdrawn' })
  async withdraw(@Req() req: AuthenticatedRequest) {
    return this.applicationService.withdraw(req.principal.userId);
  }

  @Get('documents')
  @ApiOperation({ summary: 'List verification documents for the active application' })
  @ApiResponse({ status: 200, description: 'Document list' })
  async listDocuments(@Req() req: AuthenticatedRequest) {
    return this.documentService.listMyDocuments(req.principal.userId);
  }

  @Post('documents')
  @Throttle({ default: { limit: EXPERT_RATE_LIMITS.DOCUMENT_UPLOAD_PER_HOUR, ttl: HOUR_MS } })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MULTER_MAX_BYTES, files: 1 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a verification document (PDF/JPEG/PNG, max 10MB)' })
  @ApiResponse({ status: 201, description: 'Document stored' })
  @ApiResponse({ status: 413, description: 'EXPERT_VERIFICATION_DOCUMENT_TOO_LARGE' })
  @ApiResponse({ status: 415, description: 'EXPERT_VERIFICATION_DOCUMENT_TYPE_UNSUPPORTED' })
  async uploadDocument(
    @Req() req: AuthenticatedRequest,
    @Body() body: { type?: string },
    @UploadedFile() file: UploadedFileLike | undefined,
  ) {
    return this.documentService.upload(req.principal.userId, { type: body?.type }, file, {
      ipAddress: this.clientIp(req),
    });
  }

  @Delete('documents/:documentId')
  @Throttle({ default: { limit: EXPERT_RATE_LIMITS.DOCUMENT_UPLOAD_PER_HOUR, ttl: HOUR_MS } })
  @ApiOperation({ summary: 'Remove a verification document' })
  @ApiResponse({ status: 200, description: 'Document removed' })
  @ApiResponse({ status: 404, description: 'EXPERT_VERIFICATION_DOCUMENT_NOT_FOUND' })
  async removeDocument(@Req() req: AuthenticatedRequest, @Param('documentId') documentId: string) {
    return this.documentService.remove(req.principal.userId, documentId);
  }
}
