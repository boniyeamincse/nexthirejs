import { Controller, Get, Put, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '../../../modules/auth/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequireRoles } from '../../../common/decorators/roles.decorator';
import { AdminSecurityService } from '../services/admin-security.service';

@ApiTags('SuperAdmin Security')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@RequireRoles('super_admin', 'admin')
@Controller({ path: 'admin/security', version: '1' })
export class AdminSecurityController {
  constructor(private readonly securityService: AdminSecurityService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get security overview with stats' })
  async getOverview() {
    return this.securityService.getSecurityOverview();
  }

  @Get('suspicious')
  @ApiOperation({ summary: 'Get suspicious activity' })
  async getSuspiciousActivity() {
    return this.securityService.getSuspiciousActivity();
  }

  @Get('sessions')
  @ApiOperation({ summary: 'Get active sessions' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getActiveSessions(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.securityService.getActiveSessions(Number(page) || 1, Number(limit) || 20);
  }

  @Get('policies')
  @ApiOperation({ summary: 'Get security policies' })
  async getPolicies() {
    return this.securityService.getSecurityPolicies();
  }

  @Put('policies')
  @ApiOperation({ summary: 'Update security policies' })
  async updatePolicies(@Body() body: any) {
    return this.securityService.updateSecurityPolicies(body);
  }
}
