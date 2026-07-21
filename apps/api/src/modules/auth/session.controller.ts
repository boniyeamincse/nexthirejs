import { Controller, Get, Delete, Post, Param, HttpCode, Res, NotFoundException, BadRequestException } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { SessionService } from './session.service';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedPrincipal } from './interfaces/authenticated-principal.interface';
import type { UserSessionSummary, SessionListResult, LogoutAllSessionsResult } from '@nexthire/types';
import { AuditActorType, AuditOutcome } from '@nexthire/types';

const REFRESH_COOKIE_NAME = 'nexthire_refresh';

function maskIp(ip: string | null): string | undefined {
  if (!ip) return undefined;
  const parts = ip.split('.');
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.x.x`;
  if (ip.includes(':')) return ip.split(':').slice(0, 2).join(':') + ':xxxx';
  return 'x.x.x.x';
}

function toSummary(session: Record<string, unknown>, currentSessionId: string): UserSessionSummary {
  return {
    id: session.id as string,
    isCurrent: session.id === currentSessionId,
    status: session.status as UserSessionSummary['status'],
    device: {
      browser: (session.browserName as string) ?? undefined,
      operatingSystem: (session.operatingSystem as string) ?? undefined,
      deviceType: (session.deviceType as string) ?? undefined,
    },
    ipAddressMasked: maskIp((session.ipAddress as string) ?? null),
    createdAt: (session.createdAt as Date).toISOString(),
    lastUsedAt: (session.lastUsedAt as Date)?.toISOString() ?? undefined,
    expiresAt: (session.expiresAt as Date).toISOString(),
    revokedAt: (session.revokedAt as Date)?.toISOString() ?? undefined,
  };
}

@Controller('auth')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class SessionController {
  constructor(
    private readonly sessionService: SessionService,
    private readonly auditService: AuditService,
  ) {}

  @Get('sessions')
  @ApiOperation({ summary: 'List active sessions for the current user' })
  @ApiResponse({ status: 200, description: 'Session list' })
  @ApiResponse({ status: 401, description: 'Access token missing or invalid' })
  async listSessions(@CurrentUser() principal: AuthenticatedPrincipal): Promise<SessionListResult> {
    const sessions = await this.sessionService.listUserSessions(principal.userId, principal.sessionId!);

    await this.auditService.recordBestEffort({
      action: 'auth.sessions.viewed',
      actorType: AuditActorType.USER,
      actorUserId: principal.userId,
      targetType: 'user',
      targetId: principal.userId,
      outcome: AuditOutcome.SUCCESS,
    });

    return {
      sessions: sessions.map((s) => toSummary(s as unknown as Record<string, unknown>, principal.sessionId!)),
    };
  }

  @Delete('sessions/:sessionId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Revoke one session' })
  @ApiResponse({ status: 204, description: 'Session revoked' })
  @ApiResponse({ status: 400, description: 'Invalid session ID' })
  @ApiResponse({ status: 401, description: 'Access token missing or invalid' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async revokeSession(
    @Param('sessionId') sessionId: string,
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    if (!sessionId || typeof sessionId !== 'string') {
      throw new BadRequestException('AUTH_SESSION_ID_INVALID');
    }

    const owned = await this.sessionService.revokeOwnSession(sessionId, principal.userId);
    if (!owned) {
      throw new NotFoundException('AUTH_SESSION_NOT_FOUND');
    }

    const isCurrent = sessionId === principal.sessionId;

    await this.auditService.recordBestEffort({
      action: 'auth.session.revoked',
      actorType: AuditActorType.USER,
      actorUserId: principal.userId,
      targetType: 'session',
      targetId: sessionId,
      outcome: AuditOutcome.SUCCESS,
      metadata: { isCurrentSession: isCurrent, revokeReason: 'USER_REVOKED' },
    });

    if (isCurrent) {
      res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/v1/auth' });
    }
  }

  @Post('logout-all')
  @HttpCode(200)
  @ApiOperation({ summary: 'Logout from all devices' })
  @ApiResponse({ status: 200, description: 'All sessions revoked' })
  @ApiResponse({ status: 401, description: 'Access token missing or invalid' })
  async logoutAll(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LogoutAllSessionsResult> {
    const count = await this.sessionService.revokeAllUserSessions(principal.userId);

    await this.auditService.recordBestEffort({
      action: 'auth.sessions.revoked_all',
      actorType: AuditActorType.USER,
      actorUserId: principal.userId,
      targetType: 'user',
      targetId: principal.userId,
      outcome: AuditOutcome.SUCCESS,
      metadata: { revokedSessionCount: count },
    });

    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/v1/auth' });

    return { revokedSessionCount: count };
  }
}
