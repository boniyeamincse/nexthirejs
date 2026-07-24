import { Controller, Get, Put, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { AuthGuard } from '../../../modules/auth/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequireRoles } from '../../../common/decorators/roles.decorator';
import { AdminSettingsService } from '../services/admin-settings.service';

@ApiTags('SuperAdmin Settings')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@RequireRoles('super_admin')
@Controller({ path: 'admin/settings', version: '1' })
export class AdminSettingsController {
  constructor(private readonly settingsService: AdminSettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all platform settings' })
  async getAll() {
    return this.settingsService.getAllSettings();
  }

  @Get(':group')
  @ApiOperation({ summary: 'Get settings by group' })
  @ApiParam({ name: 'group', enum: ['general', 'booking', 'payment', 'notifications', 'privacy', 'security'] })
  async getGroup(@Param('group') group: string) {
    return this.settingsService.getSettingsGroup(group);
  }

  @Put(':group')
  @ApiOperation({ summary: 'Update settings group' })
  @ApiParam({ name: 'group', enum: ['general', 'booking', 'payment', 'notifications', 'privacy', 'security'] })
  async updateGroup(@Param('group') group: string, @Body() body: Record<string, any>) {
    return this.settingsService.updateSettingsGroup(group, body);
  }
}
