import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '../../../modules/auth/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequireRoles } from '../../../common/decorators/roles.decorator';
import { AdminMaintenanceService } from '../services/admin-maintenance.service';

@ApiTags('SuperAdmin Maintenance')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@RequireRoles('super_admin')
@Controller({ path: 'admin/maintenance', version: '1' })
export class AdminMaintenanceController {
  constructor(private readonly maintenanceService: AdminMaintenanceService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get system status' })
  async getSystemStatus() {
    return this.maintenanceService.getSystemStatus();
  }

  @Get('health')
  @ApiOperation({ summary: 'Get health checks' })
  async getHealthChecks() {
    return this.maintenanceService.getHealthChecks();
  }

  @Put('mode')
  @ApiOperation({ summary: 'Toggle maintenance mode' })
  async toggleMaintenanceMode(@Body() body: { enabled: boolean; message?: string }) {
    return this.maintenanceService.toggleMaintenanceMode(body.enabled, body.message);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get maintenance history' })
  async getMaintenanceHistory() {
    return this.maintenanceService.getMaintenanceHistory();
  }
}
