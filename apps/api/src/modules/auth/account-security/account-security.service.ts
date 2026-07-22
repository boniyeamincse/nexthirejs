import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class AccountSecurityService {
  private readonly logger = new Logger(AccountSecurityService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getSummary(userId: string, sessionId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, status: true, emailVerifiedAt: true, passwordChangedAt: true },
    });

    const activeSessionCount = await this.prisma.userSession.count({
      where: {
        userId,
        status: 'ACTIVE',
        expiresAt: { gt: new Date() },
      },
    });

    const currentSession = await this.prisma.userSession.findUnique({
      where: { id: sessionId },
      select: { createdAt: true, lastUsedAt: true },
    });

    return {
      email: user!.email,
      accountStatus: 'ACTIVE' as const,
      emailVerified: user!.emailVerifiedAt !== null,
      activeSessionCount,
      currentSessionCreatedAt: currentSession!.createdAt.toISOString(),
      currentSessionLastUsedAt: currentSession!.lastUsedAt?.toISOString() ?? null,
      passwordLastChangedAt: user!.passwordChangedAt?.toISOString() ?? null,
      securityLinks: {
        sessions: '/settings/security/sessions',
        privacy: '/settings/privacy',
      },
    };
  }
}
