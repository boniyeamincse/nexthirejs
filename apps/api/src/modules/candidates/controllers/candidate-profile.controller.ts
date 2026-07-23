import { Controller, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CandidateProfileService } from '../services/candidate-profile.service';
import { AuthGuard } from '../../auth/auth.guard';
import type { AuthenticatedRequest } from '../../auth/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequireRoles } from '../../../common/decorators/roles.decorator';

@ApiTags('Candidate Profile')
@Controller({
  path: 'candidates/me/profile',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@RequireRoles('candidate')
export class CandidateProfileController {
  constructor(private readonly profileService: CandidateProfileService) {}

  @Get()
  async getProfile(@Req() req: AuthenticatedRequest) {
    const userId = req.principal.userId;
    return this.profileService.getProfile(userId);
  }

  @Put()
  async upsertProfile(@Req() req: AuthenticatedRequest, @Body() data: any) {
    const userId = req.principal.userId;
    return this.profileService.upsertProfile(userId, data);
  }
}
