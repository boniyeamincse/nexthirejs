import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '../../../modules/auth/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequireRoles } from '../../../common/decorators/roles.decorator';
import { AdminDashboardService } from '../services/admin-dashboard.service';

@ApiTags('SuperAdmin Dashboard')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
// Fallback: we check for either admin or superadmin
@RequireRoles('super_admin', 'admin')
@Controller({
  path: 'admin',
  version: '1',
})
export class AdminDashboardController {
  constructor(private readonly dashboardService: AdminDashboardService) {}

  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Get platform KPI statistics' })
  async getStats() {
    return this.dashboardService.getStats();
  }

  @Get('dashboard/overview')
  @ApiOperation({ summary: 'Get complete dashboard overview' })
  async getOverview() {
    // For now, overview returns the same stats
    return this.dashboardService.getStats();
  }

  @Get('dashboard/activity')
  @ApiOperation({ summary: 'Get recent platform activity' })
  async getActivity() {
    return this.dashboardService.getActivity();
  }

  @Get('dashboard/alerts')
  @ApiOperation({ summary: 'Get system alerts and notifications' })
  async getAlerts() {
    return this.dashboardService.getAlerts();
  }
}
