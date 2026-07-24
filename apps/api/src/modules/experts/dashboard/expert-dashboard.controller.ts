import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../../modules/auth/auth.guard';
import type { AuthenticatedRequest } from '../../../modules/auth/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequireRoles } from '../../../common/decorators/roles.decorator';
import { ExpertEligibilityGuard } from '../shared/expert-eligibility.guard';
import { ExpertDashboardService } from './expert-dashboard.service';

@ApiTags('Expert Dashboard')
@ApiBearerAuth('access-token')
@Controller('expert/dashboard')
@UseGuards(AuthGuard, RolesGuard, ExpertEligibilityGuard)
@RequireRoles('expert')
export class ExpertDashboardController {
  constructor(private readonly dashboardService: ExpertDashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Get my expert dashboard aggregates' })
  @ApiResponse({ status: 200, description: 'Dashboard data' })
  async get(@Req() req: AuthenticatedRequest) {
    return this.dashboardService.getDashboard(req.principal.userId);
  }
}
