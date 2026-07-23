import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '../../../modules/auth/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequireRoles } from '../../../common/decorators/roles.decorator';
import { AdminDashboardService } from '../services/admin-dashboard.service';

@ApiTags('SuperAdmin Analytics')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@RequireRoles('super_admin', 'admin')
@Controller({
  path: 'admin/analytics',
  version: '1',
})
export class AdminAnalyticsController {
  constructor(private readonly dashboardService: AdminDashboardService) {}

  @Get('growth/users')
  @ApiOperation({ summary: 'Get user growth analytics' })
  async getGrowthUsers() {
    return this.dashboardService.getGrowthUsers();
  }

  @Get('growth/roles')
  @ApiOperation({ summary: 'Get role-wise distribution' })
  async getGrowthRoles() {
    return this.dashboardService.getRoleDistribution();
  }

  @Get('growth/countries')
  @ApiOperation({ summary: 'Get country-wise distribution' })
  async getGrowthCountries() {
    return this.dashboardService.getCountryDistribution();
  }

  @Get('growth/retention')
  @ApiOperation({ summary: 'Get user retention analysis' })
  async getGrowthRetention() {
    return this.dashboardService.getRetentionAnalysis();
  }

  @Get('growth/funnel')
  @ApiOperation({ summary: 'Get registration funnel data' })
  async getGrowthFunnel() {
    return this.dashboardService.getRegistrationFunnel();
  }

  @Get('revenue/trends')
  @ApiOperation({ summary: 'Get revenue trends' })
  async getRevenueTrends() {
    return this.dashboardService.getRevenueTrends();
  }

  @Get('revenue/sources')
  @ApiOperation({ summary: 'Get revenue by source' })
  async getRevenueSources() {
    return this.dashboardService.getRevenueBySource();
  }

  @Get('revenue/countries')
  @ApiOperation({ summary: 'Get revenue by country' })
  async getRevenueCountries() {
    return this.dashboardService.getRevenueByCountry();
  }

  @Get('revenue/payments')
  @ApiOperation({ summary: 'Get payment success/failure rate' })
  async getRevenuePayments() {
    return this.dashboardService.getPaymentSuccessRate();
  }

  @Get('revenue/commission')
  @ApiOperation({ summary: 'Get commission collection summary' })
  async getRevenueCommission() {
    return this.dashboardService.getCommissionSummary();
  }

  @Get('revenue/refunds')
  @ApiOperation({ summary: 'Get refund analytics' })
  async getRevenueRefunds() {
    return this.dashboardService.getRefundAnalytics();
  }

  @Get('performance/api')
  @ApiOperation({ summary: 'Get API performance metrics' })
  async getPerformanceApi() {
    return this.dashboardService.getApiPerformance();
  }

  @Get('performance/queue')
  @ApiOperation({ summary: 'Get queue processing status' })
  async getPerformanceQueue() {
    return this.dashboardService.getQueueStatus();
  }

  @Get('performance/errors')
  @ApiOperation({ summary: 'Get error rates by endpoint' })
  async getPerformanceErrors() {
    return this.dashboardService.getErrorRates();
  }

  @Get('performance/system')
  @ApiOperation({ summary: 'Get system resource usage' })
  async getPerformanceSystem() {
    return this.dashboardService.getSystemUsage();
  }

  @Get('performance/database')
  @ApiOperation({ summary: 'Get database performance' })
  async getPerformanceDatabase() {
    return this.dashboardService.getDatabasePerformance();
  }

  @Get('performance/uptime')
  @ApiOperation({ summary: 'Get service uptime status' })
  async getPerformanceUptime() {
    return this.dashboardService.getServiceUptime();
  }
}
