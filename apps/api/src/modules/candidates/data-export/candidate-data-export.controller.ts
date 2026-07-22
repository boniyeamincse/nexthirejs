import { Controller, Get, Post, Param, Body, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IsString, MinLength, MaxLength } from 'class-validator';
import { AuthGuard } from '../../auth/auth.guard';
import type { AuthenticatedRequest } from '../../auth/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequireRoles } from '../../../common/decorators/roles.decorator';
import { CandidateDataExportService } from './candidate-data-export.service';
import { DATA_EXPORT_ERROR_CODES } from '@nexthire/constants';

export class RequestDataExportDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason?: string;
}

@ApiTags('Data Export')
@Controller({
  path: 'candidates/me/data-exports',
  version: '1',
})
@UseGuards(AuthGuard, RolesGuard)
@RequireRoles('candidate')
@ApiBearerAuth()
export class CandidateDataExportController {
  constructor(private readonly dataExportService: CandidateDataExportService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ default: { limit: 3, ttl: 2592000000 } })
  @ApiOperation({ summary: 'Request a personal data export for the authenticated candidate' })
  @ApiResponse({ status: 202, description: 'Data export request accepted' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  @ApiResponse({ status: 403, description: 'Candidate role required' })
  @ApiResponse({ status: 409, description: DATA_EXPORT_ERROR_CODES.ALREADY_ACTIVE })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded - 3 per 30 days' })
  async requestExport(@Req() req: AuthenticatedRequest) {
    return this.dataExportService.requestExport(req.principal.userId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all data export requests for the authenticated candidate' })
  @ApiResponse({ status: 200, description: 'List of export requests' })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  @ApiResponse({ status: 403, description: 'Candidate role required' })
  async listExports(@Req() req: AuthenticatedRequest) {
    return this.dataExportService.listExports(req.principal.userId);
  }

  @Get(':exportId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get the status of a specific data export request' })
  @ApiResponse({ status: 200, description: 'Export status retrieved' })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  @ApiResponse({ status: 403, description: 'Candidate role required' })
  @ApiResponse({ status: 404, description: 'Export request not found' })
  async getExportStatus(
    @Req() req: AuthenticatedRequest,
    @Param('exportId') exportId: string,
  ) {
    return this.dataExportService.getExportStatus(req.principal.userId, exportId);
  }

  @Post(':exportId/download')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 3600000 } })
  @ApiOperation({ summary: 'Get a download URL for a completed data export' })
  @ApiResponse({ status: 200, description: 'Download URL generated' })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  @ApiResponse({ status: 403, description: 'Candidate role required' })
  @ApiResponse({ status: 404, description: 'Export request not found' })
  @ApiResponse({ status: 409, description: DATA_EXPORT_ERROR_CODES.NOT_READY })
  @ApiResponse({ status: 410, description: 'Export has expired' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded - 10 per hour' })
  async getDownloadAccess(
    @Req() req: AuthenticatedRequest,
    @Param('exportId') exportId: string,
  ) {
    return this.dataExportService.getDownloadAccess(req.principal.userId, exportId);
  }
}
