import { Controller, Get, Post, Param, Res, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { AuthGuard } from '../../auth/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequireRoles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedPrincipal } from '../../auth/interfaces/authenticated-principal.interface';
import { CvExportRequestService, CvExportResponse } from './cv-export-request.service';

@ApiTags('CV Builder - Export')
@Controller('cvs/:cvId/exports')
@UseGuards(AuthGuard, RolesGuard)
@RequireRoles('candidate')
@ApiBearerAuth()
export class CvExportController {
  constructor(private readonly exportService: CvExportRequestService) {}

  @Post()
  @Throttle({ default: { limit: 10, ttl: 3600000 } })
  @ApiOperation({ summary: 'Request an asynchronous PDF export of a CV' })
  @ApiResponse({ status: 201, description: 'Export queued' })
  @ApiResponse({ status: 400, description: 'CV_NOT_READY_FOR_EXPORT' })
  @ApiResponse({ status: 409, description: 'CV_EXPORT_ALREADY_IN_PROGRESS' })
  async requestExport(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Param('cvId') cvId: string,
  ): Promise<CvExportResponse> {
    return this.exportService.requestExport(user.userId, cvId);
  }

  @Get()
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({ summary: 'List export history for a CV' })
  @ApiResponse({ status: 200, description: 'Export history' })
  async listExports(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Param('cvId') cvId: string,
  ): Promise<CvExportResponse[]> {
    return this.exportService.listExports(user.userId, cvId);
  }

  @Get(':exportId')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({ summary: 'Get export status (for polling)' })
  @ApiResponse({ status: 200, description: 'Export status' })
  async getExport(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Param('cvId') cvId: string,
    @Param('exportId') exportId: string,
  ): Promise<CvExportResponse> {
    return this.exportService.getExport(user.userId, cvId, exportId);
  }

  @Post(':exportId/download')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 3600000 } })
  @ApiOperation({ summary: 'Get a download URL for a ready export' })
  @ApiResponse({ status: 200, description: 'Download URL' })
  @ApiResponse({ status: 409, description: 'CV_EXPORT_NOT_READY' })
  async requestDownload(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Param('cvId') cvId: string,
    @Param('exportId') exportId: string,
  ): Promise<{ downloadUrl: string }> {
    return this.exportService.requestDownload(user.userId, cvId, exportId);
  }

  @Get(':exportId/file')
  @Throttle({ default: { limit: 30, ttl: 3600000 } })
  @ApiOperation({ summary: 'Download the PDF bytes for a ready export (owner only)' })
  @ApiResponse({ status: 200, description: 'PDF bytes' })
  @ApiResponse({ status: 409, description: 'CV_EXPORT_NOT_READY' })
  async getFile(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Param('cvId') cvId: string,
    @Param('exportId') exportId: string,
    @Res() res: Response,
  ): Promise<void> {
    const buffer = await this.exportService.getFileContent(user.userId, cvId, exportId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', String(buffer.length));
    res.setHeader('Content-Disposition', 'attachment; filename="cv.pdf"');
    res.setHeader('Cache-Control', 'private, no-store');
    res.send(buffer);
  }
}
