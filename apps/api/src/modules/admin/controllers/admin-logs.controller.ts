import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '../../../modules/auth/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequireRoles } from '../../../common/decorators/roles.decorator';
import { AdminLogsService } from '../services/admin-logs.service';

@ApiTags('SuperAdmin Logs')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@RequireRoles('super_admin', 'admin')
@Controller({ path: 'admin/logs', version: '1' })
export class AdminLogsController {
  constructor(private readonly logsService: AdminLogsService) {}

  @Get()
  @ApiOperation({ summary: 'Get application logs with filters' })
  async getLogs(
    @Query('page') page = '1',
    @Query('limit') limit = '50',
    @Query('level') level?: string,
    @Query('search') search?: string,
    @Query('action') action?: string,
    @Query('actorType') actorType?: string,
    @Query('outcome') outcome?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.logsService.getLogs({
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 200),
      level,
      search,
      action,
      actorType,
      outcome,
      startDate,
      endDate,
    });
  }

  @Get('errors')
  @ApiOperation({ summary: 'Get error logs' })
  async getErrorLogs(
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    return this.logsService.getErrorLogs(parseInt(page), Math.min(parseInt(limit), 200));
  }

  @Get('access')
  @ApiOperation({ summary: 'Get access logs' })
  async getAccessLogs(
    @Query('page') page = '1',
    @Query('limit') limit = '50',
    @Query('userId') userId?: string,
  ) {
    return this.logsService.getAccessLogs(parseInt(page), Math.min(parseInt(limit), 200), userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get log detail' })
  async getLogDetail(@Param('id') id: string) {
    return this.logsService.getLogDetail(id);
  }
}
