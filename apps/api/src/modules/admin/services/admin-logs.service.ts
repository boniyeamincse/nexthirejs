import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class AdminLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async getLogs(filters: {
    page: number;
    limit: number;
    level?: string;
    search?: string;
    action?: string;
    actorType?: string;
    outcome?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const where: any = {};

    if (filters.level === 'error' || filters.level === 'ERROR') {
      where.outcome = 'FAILURE';
    } else if (filters.level === 'warning' || filters.level === 'WARNING') {
      where.outcome = 'DENIED';
    }

    if (filters.action) {
      where.action = { contains: filters.action, mode: 'insensitive' };
    }

    if (filters.actorType) {
      where.actorType = filters.actorType.toUpperCase();
    }

    if (filters.outcome) {
      where.outcome = filters.outcome.toUpperCase();
    }

    if (filters.startDate) {
      where.occurredAt = { ...where.occurredAt, gte: new Date(filters.startDate) };
    }
    if (filters.endDate) {
      where.occurredAt = { ...where.occurredAt, lte: new Date(filters.endDate) };
    }

    if (filters.search) {
      where.OR = [
        { action: { contains: filters.search, mode: 'insensitive' } },
        { targetType: { contains: filters.search, mode: 'insensitive' } },
        { requestId: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        orderBy: { occurredAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      logs: logs.map((l) => ({
        id: l.id,
        occurredAt: l.occurredAt,
        actorType: l.actorType,
        actorUserId: l.actorUserId,
        action: l.action,
        targetType: l.targetType,
        targetId: l.targetId,
        outcome: l.outcome,
        requestId: l.requestId,
      })),
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
    };
  }

  async getErrorLogs(page: number, limit: number) {
    const where = { outcome: 'FAILURE' as const };
    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { occurredAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getAccessLogs(page: number, limit: number, userId?: string) {
    const where: any = { action: { startsWith: 'LOGIN_' } };
    if (userId) where.actorUserId = userId;
    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { occurredAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return {
      logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getLogDetail(id: string) {
    const log = await this.prisma.auditLog.findUnique({ where: { id } });
    if (!log) throw new NotFoundException('Log not found');
    return { log };
  }
}
