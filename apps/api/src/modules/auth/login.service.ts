import { Injectable, Logger, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PasswordHashingService } from './password-hashing.service';
import { TokenService } from './token.service';
import { SessionService } from './session.service';
import type { CreateSessionMetadata } from './session.service';
import { AuditService } from '../audit/audit.service';
import { AuditActorType, AuditOutcome } from '@nexthire/types';
import type { AuthenticatedUser } from '@nexthire/types';
import { AUTH_ERROR_CODES } from '@nexthire/constants';

export interface LoginResult {
  accessToken: string;
  accessTokenExpiresAt: string;
  user: AuthenticatedUser;
  rawRefreshToken: string;
}

export interface RefreshResult {
  accessToken: string;
  accessTokenExpiresAt: string;
  rawRefreshToken: string;
}

@Injectable()
export class LoginService {
  private readonly logger = new Logger(LoginService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordHashingService: PasswordHashingService,
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
    private readonly auditService: AuditService,
  ) {}

  async login(email: string, password: string, metadata?: CreateSessionMetadata): Promise<LoginResult> {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { roles: { include: { role: true } } },
    });

    let passwordValid = false;

    if (user) {
      passwordValid = await this.passwordHashingService.verify(user.passwordHash, password);
    }

    if (!user || !passwordValid) {
      if (user) {
        await this.auditService.recordBestEffort({
          action: 'auth.login.failed',
          actorType: AuditActorType.USER,
          actorUserId: user.id,
          targetType: 'user',
          targetId: user.id,
          outcome: AuditOutcome.FAILURE,
          metadata: { failureCategory: 'invalid_password' },
        });
      }
      throw new UnauthorizedException(AUTH_ERROR_CODES.INVALID_CREDENTIALS);
    }

    if (user.status === 'PENDING_VERIFICATION') {
      await this.auditService.recordBestEffort({
        action: 'auth.login.failed',
        actorType: AuditActorType.USER,
        actorUserId: user.id,
        targetType: 'user',
        targetId: user.id,
        outcome: AuditOutcome.FAILURE,
        metadata: { failureCategory: 'email_not_verified' },
      });
      throw new ForbiddenException(AUTH_ERROR_CODES.EMAIL_NOT_VERIFIED);
    }

    if (user.status === 'SUSPENDED' || user.status === 'DELETED') {
      await this.auditService.recordBestEffort({
        action: 'auth.login.failed',
        actorType: AuditActorType.USER,
        actorUserId: user.id,
        targetType: 'user',
        targetId: user.id,
        outcome: AuditOutcome.FAILURE,
        metadata: { failureCategory: 'account_unavailable', accountStatus: user.status },
      });
      throw new ForbiddenException(AUTH_ERROR_CODES.ACCOUNT_UNAVAILABLE);
    }

    const roleCodes = user.roles.map((ur) => ur.role.code);

    const session = await this.sessionService.createSession(user.id, metadata);

    const { token: accessToken, expiresAt } = this.tokenService.signAccessToken(
      user.id,
      session.id,
      roleCodes,
    );

    await this.auditService.recordBestEffort({
      action: 'auth.login.succeeded',
      actorType: AuditActorType.USER,
      actorUserId: user.id,
      targetType: 'user',
      targetId: user.id,
      outcome: AuditOutcome.SUCCESS,
      metadata: { roleCodes },
    });

    return {
      accessToken,
      accessTokenExpiresAt: expiresAt,
      user: {
        id: user.id,
        email: user.email,
        status: 'ACTIVE',
        roleCodes,
      } as AuthenticatedUser,
      rawRefreshToken: session.rawRefreshToken,
    };
  }

  async refresh(rawRefreshToken: string): Promise<RefreshResult> {
    if (!rawRefreshToken) {
      throw new UnauthorizedException(AUTH_ERROR_CODES.REFRESH_TOKEN_MISSING);
    }

    const hash = this.tokenService.hashRefreshToken(rawRefreshToken);
    const session = await this.sessionService.findActiveByRefreshHash(hash);

    if (!session) {
      throw new UnauthorizedException(AUTH_ERROR_CODES.REFRESH_TOKEN_INVALID);
    }

    if (session.expiresAt < new Date()) {
      throw new UnauthorizedException(AUTH_ERROR_CODES.SESSION_EXPIRED);
    }

    if (session.status === 'REVOKED' || session.status === 'COMPROMISED') {
      throw new UnauthorizedException(AUTH_ERROR_CODES.SESSION_REVOKED);
    }

    // Rotate: generate new refresh token atomically
    const { raw: newRaw, hash: newHash } = this.tokenService.generateRefreshToken();
    const newExpiresAt = this.tokenService.getRefreshExpiresAt();

    const rotated = await this.sessionService.rotateRefreshToken(
      session.id,
      hash,
      newHash,
      newExpiresAt,
    );

    // Concurrent rotation conflict — another request already rotated this token
    if (!rotated) {
      await this.sessionService.markCompromised(session.id, 'refresh_token_reused');
      await this.auditService.recordBestEffort({
        action: 'auth.refresh_token.reused',
        actorType: AuditActorType.USER,
        actorUserId: session.userId,
        targetType: 'session',
        targetId: session.id,
        outcome: AuditOutcome.FAILURE,
      });
      throw new UnauthorizedException(AUTH_ERROR_CODES.REFRESH_TOKEN_REUSED);
    }

    // Fetch user to sign new access token
    const user = await this.prisma.user.findUnique({
      where: { id: session.userId },
      include: { roles: { include: { role: true } } },
    });

    if (!user) {
      throw new Error('INTERNAL_SERVER_ERROR');
    }

    const roleCodes = user.roles.map((ur) => ur.role.code);
    const { token: accessToken, expiresAt } = this.tokenService.signAccessToken(
      user.id,
      session.id,
      roleCodes,
    );

    await this.auditService.recordBestEffort({
      action: 'auth.session.refreshed',
      actorType: AuditActorType.USER,
      actorUserId: user.id,
      targetType: 'session',
      targetId: session.id,
      outcome: AuditOutcome.SUCCESS,
    });

    return { accessToken, accessTokenExpiresAt: expiresAt, rawRefreshToken: newRaw };
  }
}
