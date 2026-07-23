import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '../../../modules/auth/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequireRoles } from '../../../common/decorators/roles.decorator';
import { AdminRolesService } from '../services/admin-roles.service';

@ApiTags('SuperAdmin Roles')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@RequireRoles('super_admin')
@Controller({ path: 'admin', version: '1' })
export class AdminRolesController {
  constructor(private readonly rolesService: AdminRolesService) {}

  @Get('roles')
  @ApiOperation({ summary: 'Get all roles' })
  async getRoles() {
    return this.rolesService.getRoles();
  }

  @Post('roles')
  @ApiOperation({ summary: 'Create new role' })
  async createRole(@Body() body: { code: string; name: string; description?: string }) {
    return this.rolesService.createRole(body);
  }

  @Get('roles/:id')
  @ApiOperation({ summary: 'Get role details' })
  async getRole(@Param('id') id: string) {
    return this.rolesService.getRole(id);
  }

  @Put('roles/:id')
  @ApiOperation({ summary: 'Update role' })
  async updateRole(@Param('id') id: string, @Body() body: { name?: string; description?: string }) {
    return this.rolesService.updateRole(id, body);
  }

  @Delete('roles/:id')
  @ApiOperation({ summary: 'Delete role' })
  async deleteRole(@Param('id') id: string) {
    return this.rolesService.deleteRole(id);
  }

  @Get('users/:id/roles')
  @ApiOperation({ summary: 'Get user roles' })
  async getUserRoles(@Param('id') id: string) {
    return this.rolesService.getUserRoles(id);
  }

  @Post('users/:id/roles')
  @ApiOperation({ summary: 'Assign role to user' })
  async assignRole(@Param('id') userId: string, @Body() body: { roleCode: string }) {
    return this.rolesService.assignRole(userId, body.roleCode);
  }

  @Delete('users/:id/roles/:roleId')
  @ApiOperation({ summary: 'Remove role from user' })
  async removeRole(@Param('id') userId: string, @Param('roleId') roleId: string) {
    return this.rolesService.removeRole(userId, roleId);
  }

  @Post('users/roles/bulk')
  @ApiOperation({ summary: 'Bulk role assignment' })
  async bulkAssignRoles(@Body() body: { userIds: string[]; roleCode: string }) {
    return this.rolesService.bulkAssignRoles(body.userIds, body.roleCode);
  }

  @Get('roles/audit')
  @ApiOperation({ summary: 'Get role change history' })
  async getRoleAudit() {
    return this.rolesService.getRoleAudit();
  }

  @Get('permissions')
  @ApiOperation({ summary: 'Get all permissions' })
  async getPermissions() {
    return this.rolesService.getPermissions();
  }

  @Post('permissions')
  @ApiOperation({ summary: 'Create custom permission' })
  async createPermission(@Body() body: { code: string; name: string; description?: string }) {
    return this.rolesService.createPermission(body);
  }

  @Get('roles/:id/permissions')
  @ApiOperation({ summary: 'Get role permissions' })
  async getRolePermissions(@Param('id') id: string) {
    return this.rolesService.getRolePermissions(id);
  }

  @Put('roles/:id/permissions')
  @ApiOperation({ summary: 'Update role permissions' })
  async updateRolePermissions(@Param('id') id: string, @Body() body: { permissionCodes: string[] }) {
    return this.rolesService.updateRolePermissions(id, body.permissionCodes);
  }
}
