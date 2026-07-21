import { Injectable, Logger } from '@nestjs/common';
import crypto from 'node:crypto';
import { PrismaService } from '../../database/prisma.service';
import { TokenService } from './token.service';

export interface CreatedSession {
  id: string;
  refreshTokenHash: string;
  rawRefreshToken: string;
  expiresAt: Date;
}

export interface SessionRecord {
  id: string;
  userId: string;
  status: string;
  refreshTokenHash: string;
  tokenFamilyId: string;
  expiresAt: Date;
  lastUsedAt: Date | null;
  ipAddress: string | null;
  userAgent: string | null;
  browserName: string | null;
  operatingSystem: string | null;
  deviceType: string | null;
  revokedAt: Date | null;
  revokeReason: string | null;
  createdAt: Date;
}

export interface CreateSessionMetadata {
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private static readonly LAST_USED_THROTTLE_MS = 5 * 60 * 1000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
  ) {}

  async createSession(userId: string, metadata?: CreateSessionMetadata): Promise<CreatedSession> {
    const tokenFamilyId = crypto.randomUUID();
    const { raw, hash } = this.tokenService.generateRefreshToken();
    const expiresAt = this.tokenService.getRefreshExpiresAt();

    const parsed = metadata?.userAgent ? this.parseUserAgent(metadata.userAgent) : null;

    const session = await this.prisma.userSession.create({
      data: {
        userId,
        refreshTokenHash: hash,
        tokenFamilyId,
        expiresAt,
        ipAddress: metadata?.ipAddress ?? null,
        userAgent: metadata?.userAgent?.slice(0, 512) ?? null,
        browserName: parsed?.browser ?? null,
        operatingSystem: parsed?.os ?? null,
        deviceType: parsed?.deviceType ?? null,
      },
    });

    this.logger.debug(`Session created for user ${userId}`);
    return {
      id: session.id,
      refreshTokenHash: hash,
      rawRefreshToken: raw,
      expiresAt,
    };
  }

  async findActiveByRefreshHash(hash: string): Promise<SessionRecord | null> {
    const session = await this.prisma.userSession.findUnique({
      where: { refreshTokenHash: hash },
    });
    return session as SessionRecord | null;
  }

  async rotateRefreshToken(
    sessionId: string,
    oldTokenHash: string,
    newTokenHash: string,
    newExpiresAt: Date,
  ): Promise<boolean> {
    const result = await this.prisma.userSession.updateMany({
      where: { id: sessionId, refreshTokenHash: oldTokenHash },
      data: {
        refreshTokenHash: newTokenHash,
        expiresAt: newExpiresAt,
        lastUsedAt: new Date(),
      },
    });
    if (result.count === 0) {
      this.logger.warn(`Concurrent rotation conflict for session ${sessionId}`);
      return false;
    }
    this.logger.debug(`Session ${sessionId} refresh token rotated`);
    return true;
  }

  async markCompromised(sessionId: string, reason: string): Promise<void> {
    await this.prisma.userSession.update({
      where: { id: sessionId },
      data: {
        status: 'COMPROMISED',
        revokedAt: new Date(),
        revokeReason: reason,
      },
    });
    this.logger.warn(`Session ${sessionId} marked as ${reason}`);
  }

  async revokeSession(sessionId: string, reason = 'user_logout'): Promise<void> {
    await this.prisma.userSession.update({
      where: { id: sessionId },
      data: {
        status: 'REVOKED',
        revokedAt: new Date(),
        revokeReason: reason,
      },
    });
    this.logger.debug(`Session ${sessionId} revoked (${reason})`);
  }

  async findSessionById(sessionId: string): Promise<SessionRecord | null> {
    const session = await this.prisma.userSession.findUnique({
      where: { id: sessionId },
    });
    return session as SessionRecord | null;
  }

  async listUserSessions(userId: string, currentSessionId: string): Promise<SessionRecord[]> {
    const sessions = await this.prisma.userSession.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        expiresAt: { gt: new Date() },
      },
      orderBy: [{ lastUsedAt: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
    });
    return sessions as SessionRecord[];
  }

  async revokeOwnSession(sessionId: string, userId: string): Promise<boolean> {
    const result = await this.prisma.userSession.updateMany({
      where: { id: sessionId, userId },
      data: {
        status: 'REVOKED',
        revokedAt: new Date(),
        revokeReason: 'USER_REVOKED',
      },
    });
    return result.count > 0;
  }

  async revokeAllUserSessions(userId: string): Promise<number> {
    const result = await this.prisma.userSession.updateMany({
      where: {
        userId,
        status: 'ACTIVE',
      },
      data: {
        status: 'REVOKED',
        revokedAt: new Date(),
        revokeReason: 'USER_REVOKED_ALL',
      },
    });
    return result.count;
  }

  async updateLastUsedAt(sessionId: string): Promise<void> {
    const session = await this.prisma.userSession.findUnique({
      where: { id: sessionId },
      select: { lastUsedAt: true },
    });
    if (!session) return;

    const now = Date.now();
    const lastUsed = session.lastUsedAt?.getTime() ?? 0;
    if (now - lastUsed < SessionService.LAST_USED_THROTTLE_MS) return;

    await this.prisma.userSession.update({
      where: { id: sessionId },
      data: { lastUsedAt: new Date() },
    });
  }

  private parseUserAgent(ua: string): { browser: string; os: string; deviceType: string } | null {
    try {
      const lower = ua.toLowerCase();
      let browser = 'Unknown';
      let os = 'Unknown';
      let deviceType = 'desktop';

      if (lower.includes('firefox')) browser = 'Firefox';
      else if (lower.includes('edg')) browser = 'Edge';
      else if (lower.includes('chrome')) browser = 'Chrome';
      else if (lower.includes('safari')) browser = 'Safari';

      if (lower.includes('windows')) os = 'Windows';
      else if (lower.includes('mac os')) os = 'macOS';
      else if (lower.includes('linux')) os = 'Linux';
      else if (lower.includes('android')) os = 'Android';
      else if (lower.includes('ios') || lower.includes('iphone')) os = 'iOS';

      if (lower.includes('mobile')) deviceType = 'mobile';
      else if (lower.includes('tablet') || lower.includes('ipad')) deviceType = 'tablet';

      return { browser, os, deviceType };
    } catch {
      return null;
    }
  }
}
