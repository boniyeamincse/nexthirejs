import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/auth.guard';
import type { AuthenticatedRequest } from '../../auth/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequireRoles } from '../../../common/decorators/roles.decorator';
import { CandidateProfilePreviewService } from './candidate-profile-preview.service';

@ApiTags('Candidate Profile Preview')
@Controller({
  path: 'candidates/me/profile-preview',
  version: '1',
})
@UseGuards(AuthGuard, RolesGuard)
@RequireRoles('candidate')
@ApiBearerAuth()
export class CandidateProfilePreviewController {
  constructor(private readonly previewService: CandidateProfilePreviewService) {}

  @Get()
  @ApiOperation({
    summary: 'Get own profile preview with privacy summary',
    description:
      'Returns the owner preview of the candidate profile, including all sections, ' +
      'privacy summary (overall visibility, per-section visibility, share link status), ' +
      'and profile completion percentage.',
  })
  @ApiResponse({ status: 200, description: 'Owner profile preview retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  @ApiResponse({ status: 403, description: 'Candidate role required or account unavailable' })
  async getOwnerPreview(@Req() req: AuthenticatedRequest) {
    return this.previewService.getOwnerPreview(req.principal.userId);
  }
}
