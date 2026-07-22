import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/auth.guard';
import type { AuthenticatedRequest } from '../../auth/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequireRoles } from '../../../common/decorators/roles.decorator';
import { ProfileCompletionDashboardService } from './profile-completion-dashboard.service';

@ApiTags('Candidate Profile Completion')
@Controller({
  path: 'candidates/me/profile-completion',
  version: '1',
})
@UseGuards(AuthGuard, RolesGuard)
@RequireRoles('candidate')
@ApiBearerAuth()
export class ProfileCompletionController {
  constructor(
    private readonly dashboardService: ProfileCompletionDashboardService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get profile completion dashboard',
    description:
      'Returns the candidate profile completion dashboard including overall completion percentage, ' +
      'per-section progress with earned points, missing items, and prioritized next actions.',
  })
  @ApiResponse({ status: 200, description: 'Profile completion dashboard retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  @ApiResponse({ status: 403, description: 'Candidate role required or account unavailable' })
  async getDashboard(@Req() req: AuthenticatedRequest) {
    return this.dashboardService.getDashboard(req.principal.userId);
  }
}
