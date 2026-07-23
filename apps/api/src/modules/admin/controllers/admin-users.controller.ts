import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '../../../modules/auth/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequireRoles } from '../../../common/decorators/roles.decorator';
import { AdminUsersService } from '../services/admin-users.service';

@ApiTags('SuperAdmin Users')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@RequireRoles('super_admin', 'admin')
@Controller({ path: 'admin/users', version: '1' })
export class AdminUsersController {
  constructor(private readonly usersService: AdminUsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users with filters' })
  async getUsers(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('verified') verified?: string,
    @Query('country') country?: string,
    @Query('sortBy') sortBy = 'createdAt',
    @Query('sortOrder') sortOrder: 'asc' | 'desc' = 'desc',
  ) {
    return this.usersService.getUsers({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      role,
      status,
      verified,
      country,
      sortBy,
      sortOrder,
    });
  }

  @Get('export')
  @ApiOperation({ summary: 'Export users data' })
  async exportUsers(@Query('format') format = 'csv') {
    return this.usersService.exportUsers(format);
  }

  @Get('suspended')
  @ApiOperation({ summary: 'Get all suspended users' })
  async getSuspendedUsers(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.usersService.getSuspendedUsers(parseInt(page), parseInt(limit));
  }

  @Get('suspended/history')
  @ApiOperation({ summary: 'Get suspension history' })
  async getSuspensionHistory(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.usersService.getSuspensionHistory(parseInt(page), parseInt(limit));
  }

  @Put('suspended/:id/activate')
  @ApiOperation({ summary: 'Activate suspended user' })
  async activateSuspendedUser(@Param('id') id: string) {
    return this.usersService.activateUser(id);
  }

  @Get('verification/pending')
  @ApiOperation({ summary: 'Get pending verifications' })
  async getPendingVerifications(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.usersService.getPendingVerifications(parseInt(page), parseInt(limit));
  }

  @Get('verification/verified')
  @ApiOperation({ summary: 'Get verified accounts' })
  async getVerifiedAccounts(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.usersService.getVerifiedAccounts(parseInt(page), parseInt(limit));
  }

  @Get('verification/rejected')
  @ApiOperation({ summary: 'Get rejected accounts' })
  async getRejectedAccounts(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.usersService.getRejectedAccounts(parseInt(page), parseInt(limit));
  }

  @Put('verification/:id/verify')
  @ApiOperation({ summary: 'Verify user account' })
  async verifyUser(@Param('id') id: string) {
    return this.usersService.verifyUser(id);
  }

  @Put('verification/:id/reject')
  @ApiOperation({ summary: 'Reject verification' })
  async rejectVerification(@Param('id') id: string) {
    return this.usersService.rejectVerification(id);
  }

  @Get('verification/history')
  @ApiOperation({ summary: 'Get verification history' })
  async getVerificationHistory(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.usersService.getVerificationHistory(parseInt(page), parseInt(limit));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user details' })
  async getUser(@Param('id') id: string) {
    return this.usersService.getUser(id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update user status (suspend/activate)' })
  async updateUserStatus(
    @Param('id') id: string,
    @Body() body: { status: string; reason?: string },
  ) {
    return this.usersService.updateUserStatus(id, body.status, body.reason);
  }

  @Put(':id/password')
  @ApiOperation({ summary: 'Change user password (admin)' })
  async changeUserPassword(
    @Param('id') id: string,
    @Body() body: { newPassword: string },
  ) {
    return this.usersService.changeUserPassword(id, body.newPassword);
  }

  @Post(':id/logout')
  @HttpCode(200)
  @ApiOperation({ summary: 'Force logout user' })
  async forceLogout(@Param('id') id: string) {
    return this.usersService.forceLogout(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user account' })
  async deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Bulk user operations' })
  async bulkOperation(@Body() body: { userIds: string[]; action: string }) {
    return this.usersService.bulkOperation(body.userIds, body.action);
  }
}
