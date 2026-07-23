import {
  Controller,
  Get,
  Put,
  Delete,
  HttpCode,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { AuthGuard } from '../../auth/auth.guard';
import type { AuthenticatedRequest } from '../../auth/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequireRoles } from '../../../common/decorators/roles.decorator';
import {
  CandidatePhotoService,
  CANDIDATE_PHOTO_MAX_BYTES,
  type CandidatePhotoStatus,
} from './candidate-photo.service';

interface UploadedPhotoLike {
  buffer: Buffer;
  size: number;
  mimetype?: string;
}

@ApiTags('Candidate Profile')
@Controller({ path: 'candidates/me/profile/photo', version: '1' })
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@RequireRoles('candidate')
export class CandidatePhotoController {
  constructor(private readonly photoService: CandidatePhotoService) {}

  @Get('status')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({ summary: 'Get profile photo status for the authenticated candidate' })
  @ApiResponse({ status: 200, description: 'Photo status' })
  async getStatus(@Req() req: AuthenticatedRequest): Promise<CandidatePhotoStatus> {
    return this.photoService.getStatus(req.principal.userId);
  }

  @Put()
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 900000 } })
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: CANDIDATE_PHOTO_MAX_BYTES + 1024, files: 1 } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload or replace the profile photo (JPEG/PNG, max 2MB)' })
  @ApiResponse({ status: 200, description: 'Photo stored' })
  @ApiResponse({ status: 400, description: 'CANDIDATE_PHOTO_FILE_REQUIRED or profile missing' })
  @ApiResponse({ status: 413, description: 'CANDIDATE_PHOTO_TOO_LARGE' })
  @ApiResponse({ status: 415, description: 'CANDIDATE_PHOTO_TYPE_UNSUPPORTED' })
  async upload(
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file: UploadedPhotoLike | undefined,
  ): Promise<CandidatePhotoStatus> {
    return this.photoService.upload(req.principal.userId, file);
  }

  @Get()
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({ summary: 'Get the profile photo image (owner only, private cache)' })
  @ApiResponse({ status: 200, description: 'Image bytes' })
  @ApiResponse({ status: 404, description: 'CANDIDATE_PHOTO_NOT_FOUND' })
  async getPhoto(@Req() req: AuthenticatedRequest, @Res() res: Response): Promise<void> {
    const { buffer, mimeType } = await this.photoService.getContent(req.principal.userId);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', String(buffer.length));
    res.setHeader('Cache-Control', 'private, no-store');
    res.send(buffer);
  }

  @Delete()
  @HttpCode(204)
  @Throttle({ default: { limit: 10, ttl: 900000 } })
  @ApiOperation({ summary: 'Remove the profile photo' })
  @ApiResponse({ status: 204, description: 'Photo removed' })
  @ApiResponse({ status: 404, description: 'CANDIDATE_PHOTO_NOT_FOUND' })
  async remove(@Req() req: AuthenticatedRequest): Promise<void> {
    await this.photoService.remove(req.principal.userId);
  }
}
