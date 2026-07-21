import { Controller, Get, Param, Query, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Public } from '../../auth/decorators/public.decorator';
import { PublicCandidateProfileService } from './public-candidate-profile.service';

@ApiTags('Public Candidate Profile')
@Controller({
  path: 'public',
  version: '1',
})
@Public()
export class PublicCandidateProfileController {
  constructor(private readonly publicProfileService: PublicCandidateProfileService) {}

  @Get('candidates/:publicId')
  @Public()
  @ApiOperation({
    summary: 'Get public candidate profile by public ID',
    description:
      'Returns the public profile of a candidate if they are platform-discoverable. ' +
      'Returns 404 for private, suspended, deleted, or undiscoverable profiles.',
  })
  @ApiParam({ name: 'publicId', description: 'Candidate user UUID' })
  @ApiResponse({ status: 200, description: 'Public candidate profile' })
  @ApiResponse({ status: 404, description: 'PUBLIC_CANDIDATE_PROFILE_NOT_FOUND' })
  async getByPublicId(@Param('publicId') publicId: string) {
    const profile = await this.publicProfileService.getPublicProfileByPublicId(publicId);
    if (!profile) {
      throw new NotFoundException('PUBLIC_CANDIDATE_PROFILE_NOT_FOUND');
    }
    return profile;
  }

  @Get('candidate-profile')
  @Public()
  @ApiOperation({
    summary: 'Get shared candidate profile by share token',
    description:
      'Returns the public profile of a candidate accessed via a share link token. ' +
      'Returns 404 for invalid, disabled, rotated tokens or private profiles.',
  })
  @ApiQuery({ name: 'token', required: true, description: 'Share token from the share link' })
  @ApiResponse({ status: 200, description: 'Public candidate profile' })
  @ApiResponse({ status: 404, description: 'PUBLIC_CANDIDATE_PROFILE_NOT_FOUND' })
  async getByShareToken(@Query('token') token: string) {
    const profile = await this.publicProfileService.getPublicProfileByShareToken(token);
    if (!profile) {
      throw new NotFoundException('PUBLIC_CANDIDATE_PROFILE_NOT_FOUND');
    }
    return profile;
  }
}
