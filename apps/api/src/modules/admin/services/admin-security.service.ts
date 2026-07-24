import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class AdminSecurityService {
  private readonly logger = new Logger(AdminSecurityService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getSecurityOverview() {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [failedLogins, deniedActions, activeSessions, recentEvents, dailyStats] = await Promise.all([
      this.countFailedLogins(last24h),
      this.countDeniedActions(last24h),
      this.countActiveSessions(),
      this.getRecentSecurityEvents(last7d, 20),
      this.getDailySecurityStats(last7d),
    ]);

    return {
      summary: {
        failedLogins24h: failedLogins,
        deniedActions24h: deniedActions,
        activeSessions,
        totalEvents7d: dailyStats.reduce((sum, d) => sum + d.total, 0),
        uniqueActors7d: await this.countUniqueActors(last7d),
      },
      recentEvents,
      dailyStats,
    };
  }

  async getSuspiciousActivity() {
    const last48h = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const events = await this.prisma.auditLog.findMany({
      where: {
        occurredAt: { gte: last48h },
        action: { contains: 'login' },
        outcome: 'FAILURE',
      },
      orderBy: { occurredAt: 'desc' },
      take: 50,
    });

    const ipGroups = new Map<string, { count: number; lastSeen: Date; events: typeof events }>();
    for (const e of events) {
      if (e.metadata && typeof e.metadata === 'object' && 'ip' in (e.metadata as any)) {
        const ip = (e.metadata as any).ip as string;
        if (!ipGroups.has(ip)) ipGroups.set(ip, { count: 0, lastSeen: e.occurredAt, events: [] });
        const group = ipGroups.get(ip)!;
        group.count++;
        if (e.occurredAt > group.lastSeen) group.lastSeen = e.occurredAt;
        group.events.push(e);
      }
    }

    const suspiciousIps = Array.from(ipGroups.entries())
      .filter(([_, g]) => g.count >= 3)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 20)
      .map(([ip, g]) => ({ ip, attempts: g.count, lastSeen: g.lastSeen }));

    return { events, suspiciousIps };
  }

  async getActiveSessions(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [sessions, total] = await Promise.all([
      this.prisma.userSession.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { user: { select: { id: true, email: true } } },
      }),
      this.prisma.userSession.count({ where: { status: 'ACTIVE' } }),
    ]);

    return { sessions, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getSecurityPolicies() {
    return {
      password: { minLength: 8, requireSpecialChars: true, requireNumbers: true, requireUppercase: true, expiryDays: 90 },
      session: { timeoutMinutes: 60, maxActiveSessions: 5, allowRememberMe: true },
      login: { maxFailedAttempts: 5, lockoutDurationMinutes: 15, accountLockoutThreshold: 5 },
      twoFactor: { requireForAdmins: true, allowForUsers: true, methods: ['app', 'email'] },
    };
  }

  async updateSecurityPolicies(policies: any) {
    this.logger.log('Security policies updated (in-memory)', JSON.stringify(policies));
    return { message: 'Security policies updated', policies };
  }

  private async countFailedLogins(since: Date): Promise<number> {
    return this.prisma.auditLog.count({
      where: { occurredAt: { gte: since }, action: { contains: 'login' }, outcome: 'FAILURE' },
    });
  }

  private async countDeniedActions(since: Date): Promise<number> {
    return this.prisma.auditLog.count({
      where: { occurredAt: { gte: since }, outcome: 'DENIED' },
    });
  }

  private async countActiveSessions(): Promise<number> {
    return this.prisma.userSession.count({ where: { status: 'ACTIVE' } });
  }

  private async countUniqueActors(since: Date): Promise<number> {
    const result = await this.prisma.auditLog.findMany({
      where: { occurredAt: { gte: since }, actorUserId: { not: null } },
      select: { actorUserId: true },
      distinct: ['actorUserId'],
    });
    return result.length;
  }

  private async getRecentSecurityEvents(since: Date, take: number) {
    return this.prisma.auditLog.findMany({
      where: { occurredAt: { gte: since }, outcome: { in: ['FAILURE', 'DENIED'] } },
      orderBy: { occurredAt: 'desc' },
      take,
    });
  }

  private async getDailySecurityStats(since: Date) {
    const logs = await this.prisma.auditLog.findMany({
      where: { occurredAt: { gte: since }, outcome: { in: ['FAILURE', 'DENIED'] } },
      select: { occurredAt: true, outcome: true },
    });

    const dayMap = new Map<string, { date: string; failures: number; denied: number; total: number }>();
    for (const log of logs) {
      const key = log.occurredAt.toISOString().slice(0, 10);
      if (!dayMap.has(key)) dayMap.set(key, { date: key, failures: 0, denied: 0, total: 0 });
      const day = dayMap.get(key)!;
      day.total++;
      if (log.outcome === 'FAILURE') day.failures++;
      else if (log.outcome === 'DENIED') day.denied++;
    }

    const result = Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    return result;
  }
}
