import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import * as argon2 from 'argon2';

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getUsers(filters: {
    page: number;
    limit: number;
    search?: string;
    role?: string;
    status?: string;
    verified?: string;
    country?: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }) {
    const { page, limit, search, role, status, verified, country, sortBy, sortOrder } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { candidateProfile: { fullName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status) {
      where.status = status.toUpperCase();
    }

    if (verified === 'verified') {
      where.emailVerifiedAt = { not: null };
    } else if (verified === 'unverified') {
      where.emailVerifiedAt = null;
    }

    if (role) {
      where.roles = { some: { role: { code: role } } };
    }

    if (country && country !== 'all') {
      where.OR = [
        ...(where.OR || []),
        { expertProfile: { countryId: country } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          roles: {
            include: { role: true },
          },
          candidateProfile: {
            select: { fullName: true, completionPercentage: true },
          },
          expertProfile: {
            select: { professionalTitle: true, yearsOfExperience: true },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const mapped = (users as any[]).map((u: any) => ({
      id: u.id,
      email: u.email,
      phone: u.phone,
      status: u.status,
      fullName: u.candidateProfile?.fullName || null,
      professionalTitle: u.expertProfile?.professionalTitle || null,
      roles: (u.roles || []).map((r: any) => r.role.code),
      emailVerified: u.emailVerifiedAt !== null,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));

    return {
      users: mapped,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: { include: { role: true } },
        candidateProfile: true,
        expertProfile: true,
        sessions: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            status: true,
            ipAddress: true,
            userAgent: true,
            createdAt: true,
            lastUsedAt: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    const roleCodes = user.roles.map((r) => r.role.code);

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      status: user.status,
      emailVerifiedAt: user.emailVerifiedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles: roleCodes,
      profile: user.candidateProfile || user.expertProfile || null,
      recentSessions: user.sessions,
    };
  }

  async updateUserStatus(id: string, status: string, reason?: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        status: status.toUpperCase() as any,
        deactivatedAt: status === 'suspended' ? new Date() : null,
        deactivationReason: status === 'suspended' ? (reason || null) : null,
      },
    });

    return { id: updated.id, status: updated.status, message: `User ${status} successfully` };
  }

  async changeUserPassword(id: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const passwordHash = await argon2.hash(newPassword);
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash, passwordChangedAt: new Date() },
    });

    return { message: 'Password changed successfully' };
  }

  async forceLogout(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.userSession.updateMany({
      where: { userId: id, status: 'ACTIVE' },
      data: { status: 'REVOKED', revokedAt: new Date(), revokeReason: 'ADMIN_FORCE_LOGOUT' },
    });

    return { message: 'User logged out successfully' };
  }

  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.user.update({
      where: { id },
      data: { status: 'DELETED' },
    });

    return { message: 'User deleted successfully' };
  }

  async bulkOperation(userIds: string[], action: string) {
    const results = [];
    for (const id of userIds) {
      try {
        switch (action) {
          case 'suspend':
            results.push(await this.updateUserStatus(id, 'suspended', 'Bulk suspension'));
            break;
          case 'activate':
            results.push(await this.updateUserStatus(id, 'active'));
            break;
          case 'delete':
            results.push(await this.deleteUser(id));
            break;
          default:
            results.push({ id, error: `Unknown action: ${action}` });
        }
      } catch (e: any) {
        results.push({ id, error: e.message });
      }
    }
    return { results };
  }

  async getSuspendedUsers(page: number, limit: number) {
    const where = { status: 'SUSPENDED' as const };
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { roles: { include: { role: true } } },
        orderBy: { deactivatedAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        status: u.status,
        deactivatedAt: u.deactivatedAt,
        deactivationReason: u.deactivationReason,
        roles: u.roles.map((r) => r.role.code),
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getSuspensionHistory(page: number, limit: number) {
    const users = await this.prisma.user.findMany({
      where: { status: 'SUSPENDED' },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { deactivatedAt: 'desc' },
      select: {
        id: true,
        email: true,
        status: true,
        deactivatedAt: true,
        deactivationReason: true,
      },
    });

    return { history: users, pagination: { page, limit } };
  }

  async activateUser(id: string) {
    return this.updateUserStatus(id, 'active');
  }

  async getPendingVerifications(page: number, limit: number) {
    return this.getVerificationPage('PENDING_VERIFICATION', page, limit);
  }

  async getVerifiedAccounts(page: number, limit: number) {
    const where = { emailVerifiedAt: { not: null } };
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { emailVerifiedAt: 'desc' },
        select: { id: true, email: true, emailVerifiedAt: true, status: true, createdAt: true },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { users, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getRejectedAccounts(page: number, limit: number) {
    return { users: [], pagination: { page, limit, total: 0, totalPages: 0 } };
  }

  private async getVerificationPage(status: string, page: number, limit: number) {
    const where = { status: status as any };
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, status: true, createdAt: true, emailVerifiedAt: true },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { users, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async verifyUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.user.update({
      where: { id },
      data: { emailVerifiedAt: new Date(), status: 'ACTIVE' },
    });

    return { message: 'User verified successfully' };
  }

  async rejectVerification(id: string) {
    return { message: 'Verification rejected' };
  }

  async getVerificationHistory(page: number, limit: number) {
    return { history: [], pagination: { page, limit } };
  }

  async exportUsers(format: string) {
    const users = await this.prisma.user.findMany({
      include: { roles: { include: { role: true } } },
    });

    if (format === 'csv') {
      const header = 'id,email,status,roles,createdAt';
      const rows = users.map((u) =>
        `${u.id},${u.email},${u.status},${u.roles.map((r) => r.role.code).join(';')},${u.createdAt.toISOString()}`,
      );
      return { data: [header, ...rows].join('\n'), format: 'csv' };
    }

    return { users, format };
  }
}
