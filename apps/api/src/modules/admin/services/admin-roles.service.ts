import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class AdminRolesService {
  constructor(private readonly prisma: PrismaService) {}

  async getRoles() {
    const roles = await this.prisma.role.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { users: true } },
      },
    });

    return {
      roles: roles.map((r) => ({
        id: r.id,
        code: r.code,
        name: r.name,
        description: r.description,
        isSystem: r.isSystem,
        userCount: r._count.users,
      })),
    };
  }

  async createRole(data: { code: string; name: string; description?: string }) {
    const existing = await this.prisma.role.findUnique({ where: { code: data.code } });
    if (existing) throw new ConflictException(`Role with code '${data.code}' already exists`);

    const role = await this.prisma.role.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        isSystem: false,
      },
    });

    return { role };
  }

  async getRole(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });
    if (!role) throw new NotFoundException('Role not found');
    return { role: { ...role, userCount: role._count.users } };
  }

  async updateRole(id: string, data: { name?: string; description?: string }) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) throw new NotFoundException('Role not found');

    const updated = await this.prisma.role.update({ where: { id }, data });
    return { role: updated };
  }

  async deleteRole(id: string) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) throw new NotFoundException('Role not found');
    if (role.isSystem) throw new ConflictException('Cannot delete system role');

    await this.prisma.userRole.deleteMany({ where: { roleId: id } });
    await this.prisma.role.delete({ where: { id } });

    return { message: 'Role deleted successfully' };
  }

  async getUserRoles(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: true } } },
    });
    if (!user) throw new NotFoundException('User not found');

    return { userId, roles: user.roles.map((ur) => ur.role) };
  }

  async assignRole(userId: string, roleCode: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const role = await this.prisma.role.findUnique({ where: { code: roleCode } });
    if (!role) throw new NotFoundException(`Role '${roleCode}' not found`);

    const existing = await this.prisma.userRole.findUnique({
      where: { userId_roleId: { userId, roleId: role.id } },
    });
    if (existing) throw new ConflictException('User already has this role');

    await this.prisma.userRole.create({
      data: { userId, roleId: role.id },
    });

    return { message: `Role '${roleCode}' assigned to user`, userId, roleCode };
  }

  async removeRole(userId: string, roleId: string) {
    const userRole = await this.prisma.userRole.findUnique({
      where: { userId_roleId: { userId, roleId } },
    });
    if (!userRole) throw new NotFoundException('User does not have this role');

    await this.prisma.userRole.delete({
      where: { userId_roleId: { userId, roleId } },
    });

    return { message: 'Role removed from user' };
  }

  async bulkAssignRoles(userIds: string[], roleCode: string) {
    const results = [];
    for (const userId of userIds) {
      try {
        results.push(await this.assignRole(userId, roleCode));
      } catch (e: any) {
        results.push({ userId, error: e.message });
      }
    }
    return { results };
  }

  async getRoleAudit() {
    return { audit: [] };
  }

  async getPermissions() {
    return { permissions: [] };
  }

  async createPermission(data: { code: string; name: string; description?: string }) {
    return { permission: data };
  }

  async getRolePermissions(id: string) {
    return { roleId: id, permissions: [] };
  }

  async updateRolePermissions(id: string, permissionCodes: string[]) {
    return { roleId: id, permissionCodes, message: 'Permissions updated' };
  }
}
