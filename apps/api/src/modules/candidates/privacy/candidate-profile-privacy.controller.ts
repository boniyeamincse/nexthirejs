import { Controller, Get, Put, Body, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CandidateProfilePrivacyService } from './candidate-profile-privacy.service';
import { AuthGuard } from '../../auth/auth.guard';
import type { AuthenticatedRequest } from '../../auth/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequireRoles } from '../../../common/decorators/roles.decorator';

@ApiTags('Candidate Privacy')
@Controller({
  path: 'candidates/me/privacy',
  version: '1',
})
@UseGuards(AuthGuard, RolesGuard)
@RequireRoles('candidate')
@ApiBearerAuth()
export class CandidateProfilePrivacyController {
  constructor(private readonly privacyService: CandidateProfilePrivacyService) {}

  @Get()
  @ApiOperation({
    summary: 'Get own profile privacy settings',
    description:
      'Returns the current privacy settings for the authenticated candidate. ' +
      'If no settings have been saved yet, the versioned defaults are returned with source=DEFAULT. ' +
      'The response includes overall discoverability (PRIVATE, LINK_ONLY, PLATFORM_DISCOVERABLE), ' +
      'per-section visibility (HIDDEN, PLATFORM_ONLY, PUBLIC), and the privacy policy version. ' +
      'Note: public profile, share-link, and recruiter discovery features are not yet implemented.',
  })
  @ApiResponse({ status: 200, description: 'Privacy settings retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  @ApiResponse({ status: 403, description: 'Candidate role required or account unavailable' })
  async getPrivacy(@Req() req: AuthenticatedRequest) {
    return this.privacyService.getSettings(req.principal.userId);
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create or update profile privacy settings',
    description:
      'Sets the overall discoverability and per-section visibility for the candidate. ' +
      'Sections: BASIC_PROFILE, LOCATION_AND_PREFERENCES, EDUCATION, WORK_EXPERIENCE, ' +
      'SKILLS_AND_LANGUAGES, CERTIFICATIONS_AND_TRAINING, ACHIEVEMENTS_AND_LINKS. ' +
      'Discoverability modes: PRIVATE (visible only to candidate), ' +
      'LINK_ONLY (future share-link access), PLATFORM_DISCOVERABLE (future platform search). ' +
      'Visibility modes: HIDDEN (candidate only), PLATFORM_ONLY (future authorized viewers), ' +
      'PUBLIC (future public/anonymous access). ' +
      'Public profile and recruiter discovery features are not yet implemented.',
  })
  @ApiResponse({ status: 200, description: 'Privacy settings updated successfully' })
  @ApiResponse({ status: 400, description: 'CANDIDATE_PRIVACY_VALIDATION_FAILED, CANDIDATE_PRIVACY_SECTION_MISSING, or CANDIDATE_PRIVACY_SECTION_UNSUPPORTED' })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  @ApiResponse({ status: 403, description: 'Candidate role required or account unavailable' })
  async updatePrivacy(
    @Req() req: AuthenticatedRequest,
    @Body() data: any,
  ) {
    return this.privacyService.updateSettings(req.principal.userId, data);
  }
}
