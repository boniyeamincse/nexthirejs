import { Injectable, Logger, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { PasswordHashingService } from '../password-hashing.service';
import { AuditService } from '../../audit/audit.service';
import { AuditActorType, AuditOutcome } from '@nexthire/types';
import { AUTH_ERROR_CODES } from '@nexthire/constants';

@Injectable()
export class ChangePasswordService {
  private readonly logger = new Logger(ChangePasswordService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordHashingService: PasswordHashingService,
    private readonly auditService: AuditService,
  ) {}

  async changePassword(
    userId: string,
    sessionId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ changed: boolean; revokedOtherSessionCount: number }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true, status: true },
    });

    if (!user || user.status !== 'ACTIVE') {
      await this.auditService.recordBestEffort({
        action: 'auth.password_change.failed',
        actorType: AuditActorType.USER,
        actorUserId: userId,
        targetType: 'user',
        targetId: userId,
        outcome: AuditOutcome.FAILURE,
        metadata: { failureCategory: 'account_unavailable' },
      });
      throw new ForbiddenException(AUTH_ERROR_CODES.ACCOUNT_UNAVAILABLE);
    }

    const passwordValid = await this.passwordHashingService.verify(
      user.passwordHash,
      currentPassword,
    );

    if (!passwordValid) {
      await this.auditService.recordBestEffort({
        action: 'auth.password_change.failed',
        actorType: AuditActorType.USER,
        actorUserId: userId,
        targetType: 'user',
        targetId: userId,
        outcome: AuditOutcome.FAILURE,
        metadata: { failureCategory: 'wrong_password' },
      });
      throw new UnauthorizedException('AUTH_CURRENT_PASSWORD_INVALID');
    }

    if (currentPassword === newPassword) {
      throw new UnauthorizedException('AUTH_NEW_PASSWORD_MUST_DIFFER');
    }

    const newHash = await this.passwordHashingService.hash(newPassword);

    const [revokedCount] = await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { passwordHash: newHash, passwordChangedAt: new Date() },
      });

      const result = await tx.userSession.updateMany({
        where: {
          userId,
          id: { not: sessionId },
          status: 'ACTIVE',
        },
        data: {
          status: 'REVOKED',
          revokedAt: new Date(),
          revokeReason: 'PASSWORD_CHANGED',
        },
      });

      return [result.count];
    });

    await this.auditService.recordBestEffort({
      action: 'auth.password_change.succeeded',
      actorType: AuditActorType.USER,
      actorUserId: userId,
      targetType: 'user',
      targetId: userId,
      outcome: AuditOutcome.SUCCESS,
      metadata: { revokedOtherSessionCount: revokedCount },
    });

    return { changed: true, revokedOtherSessionCount: revokedCount };
  }
}
