import {
  Injectable,
  Logger,
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { PasswordHashingService } from '../../auth/password-hashing.service';
import { AuditService } from '../../audit/audit.service';
import { AuditActorType, AuditOutcome } from '@nexthire/types';
import { ACCOUNT_ERROR_CODES, AUTH_ERROR_CODES } from '@nexthire/constants';
import type { DeactivateCandidateAccountResult } from '@nexthire/types';

@Injectable()
export class AccountDeactivationService {
  private readonly logger = new Logger(AccountDeactivationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordHashingService: PasswordHashingService,
    private readonly auditService: AuditService,
  ) {}

  async deactivateAccount(
    userId: string,
    currentPassword: string,
    confirmation: string,
  ): Promise<DeactivateCandidateAccountResult> {
    if (confirmation !== 'DEACTIVATE') {
      throw new BadRequestException(ACCOUNT_ERROR_CODES.DEACTIVATION_CONFIRMATION_INVALID);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true, status: true },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new ForbiddenException(AUTH_ERROR_CODES.ACCOUNT_UNAVAILABLE);
    }

    const passwordValid = await this.passwordHashingService.verify(
      user.passwordHash,
      currentPassword,
    );

    if (!passwordValid) {
      await this.auditService.recordBestEffort({
        action: 'candidate.account.deactivation.failed',
        actorType: AuditActorType.USER,
        actorUserId: userId,
        targetType: 'user',
        targetId: userId,
        outcome: AuditOutcome.FAILURE,
        metadata: { failureCategory: 'wrong_password' },
      });
      throw new UnauthorizedException(ACCOUNT_ERROR_CODES.CURRENT_PASSWORD_INVALID);
    }

    const [result] = await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          status: 'DELETED',
          deactivatedAt: new Date(),
          deactivationReason: 'USER_REQUESTED',
        },
      });

      const revokedResult = await tx.userSession.updateMany({
        where: {
          userId,
          status: 'ACTIVE',
        },
        data: {
          status: 'REVOKED',
          revokedAt: new Date(),
          revokeReason: 'ACCOUNT_DEACTIVATED',
        },
      });

      await tx.candidateProfileShareToken.updateMany({
        where: { userId },
        data: { enabled: false },
      });

      return [{ sessionsRevoked: revokedResult.count }];
    });

    await this.auditService.recordBestEffort({
      action: 'candidate.account.deactivated',
      actorType: AuditActorType.USER,
      actorUserId: userId,
      targetType: 'user',
      targetId: userId,
      outcome: AuditOutcome.SUCCESS,
      metadata: { sessionsRevokedCount: result.sessionsRevoked },
    });

    this.logger.log(
      `Account deactivated for user ${userId}, ${result.sessionsRevoked} sessions revoked`,
    );

    return { deactivated: true, sessionsRevoked: result.sessionsRevoked };
  }
}
