import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { authenticator } from 'otplib';
import crypto from 'node:crypto';
import { PrismaService } from '../../../database/prisma.service';
import { MfaEncryptionService } from './mfa-encryption.service';
import { MfaService } from './mfa.service';
import { AuditService } from '../../audit/audit.service';
import { AuditActorType, AuditOutcome } from '@nexthire/types';
import type { MfaChallengeMethod, MfaChallengeRequiredResult } from '@nexthire/types';
import {
  MFA_ERROR_CODES,
  MFA_CHALLENGE_TTL_MINUTES,
  MFA_CHALLENGE_MAX_FAILED_ATTEMPTS,
} from '@nexthire/constants';

export interface VerifiedChallenge {
  userId: string;
  method: MfaChallengeMethod;
}

@Injectable()
export class MfaChallengeService {
  private readonly logger = new Logger(MfaChallengeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: MfaEncryptionService,
    private readonly mfaService: MfaService,
    private readonly auditService: AuditService,
  ) {}

  async createChallenge(userId: string): Promise<MfaChallengeRequiredResult> {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + MFA_CHALLENGE_TTL_MINUTES * 60 * 1000);

    const hasRecoveryCodes =
      (await this.prisma.mfaRecoveryCode.count({ where: { userId, usedAt: null } })) > 0;

    await this.prisma.mfaChallenge.create({
      data: {
        userId,
        challengeTokenHash: this.mfaService.hashOpaqueValue(rawToken),
        expiresAt,
      },
    });

    await this.auditService.recordBestEffort({
      action: 'auth.mfa.challenge.created',
      actorType: AuditActorType.USER,
      actorUserId: userId,
      targetType: 'user',
      targetId: userId,
      outcome: AuditOutcome.SUCCESS,
    });

    return {
      mfaRequired: true,
      challengeToken: rawToken,
      expiresAt: expiresAt.toISOString(),
      allowedMethods: hasRecoveryCodes ? ['TOTP', 'RECOVERY_CODE'] : ['TOTP'],
    };
  }

  /**
   * Verifies and consumes a pending challenge. Single-use: the challenge is
   * atomically marked CONSUMED so a token can never complete two logins.
   */
  async verifyChallenge(
    rawToken: string,
    method: MfaChallengeMethod,
    code: string,
  ): Promise<VerifiedChallenge> {
    const tokenHash = this.mfaService.hashOpaqueValue(rawToken);
    const challenge = await this.prisma.mfaChallenge.findUnique({
      where: { challengeTokenHash: tokenHash },
    });

    if (!challenge || challenge.status === 'REVOKED') {
      throw new UnauthorizedException(MFA_ERROR_CODES.CHALLENGE_INVALID);
    }
    if (challenge.status === 'CONSUMED' || challenge.status === 'VERIFIED') {
      throw new UnauthorizedException(MFA_ERROR_CODES.CHALLENGE_CONSUMED);
    }
    if (challenge.expiresAt < new Date() || challenge.status === 'EXPIRED') {
      throw new UnauthorizedException(MFA_ERROR_CODES.CHALLENGE_EXPIRED);
    }
    if (challenge.failedAttempts >= MFA_CHALLENGE_MAX_FAILED_ATTEMPTS) {
      throw new UnauthorizedException(MFA_ERROR_CODES.CHALLENGE_ATTEMPTS_EXCEEDED);
    }

    const mfa = await this.prisma.userMfa.findUnique({ where: { userId: challenge.userId } });
    if (!mfa || mfa.status !== 'ENABLED' || !mfa.encryptedTotpSecret) {
      throw new UnauthorizedException(MFA_ERROR_CODES.CHALLENGE_INVALID);
    }

    let verified = false;
    if (method === 'TOTP') {
      const secret = this.encryptionService.decrypt(
        mfa.encryptedTotpSecret,
        mfa.secretEncryptionVersion ?? 1,
      );
      verified = authenticator.verify({ token: code.trim(), secret });
    } else {
      verified =
        (await this.mfaService.verifyEnabledFactor(challenge.userId, mfa, code)) ===
        'RECOVERY_CODE';
    }

    if (!verified) {
      const updated = await this.prisma.mfaChallenge.update({
        where: { id: challenge.id },
        data: { failedAttempts: { increment: 1 } },
      });

      await this.auditService.recordBestEffort({
        action: 'auth.mfa.challenge.failed',
        actorType: AuditActorType.USER,
        actorUserId: challenge.userId,
        targetType: 'user',
        targetId: challenge.userId,
        outcome: AuditOutcome.FAILURE,
        metadata: { method, failedAttempts: updated.failedAttempts },
      });

      if (updated.failedAttempts >= MFA_CHALLENGE_MAX_FAILED_ATTEMPTS) {
        await this.prisma.mfaChallenge.update({
          where: { id: challenge.id },
          data: { status: 'REVOKED' },
        });
        throw new UnauthorizedException(MFA_ERROR_CODES.CHALLENGE_ATTEMPTS_EXCEEDED);
      }

      throw new UnauthorizedException(
        method === 'TOTP' ? MFA_ERROR_CODES.CODE_INVALID : MFA_ERROR_CODES.RECOVERY_CODE_INVALID,
      );
    }

    // Consume atomically: only one concurrent request can flip PENDING → CONSUMED.
    const now = new Date();
    const consumed = await this.prisma.mfaChallenge.updateMany({
      where: { id: challenge.id, status: 'PENDING' },
      data: { status: 'CONSUMED', verifiedAt: now, consumedAt: now },
    });
    if (consumed.count !== 1) {
      throw new UnauthorizedException(MFA_ERROR_CODES.CHALLENGE_CONSUMED);
    }

    await this.prisma.userMfa.update({
      where: { userId: challenge.userId },
      data: { lastVerifiedAt: now },
    });

    await this.auditService.recordBestEffort({
      action: 'auth.mfa.challenge.verified',
      actorType: AuditActorType.USER,
      actorUserId: challenge.userId,
      targetType: 'user',
      targetId: challenge.userId,
      outcome: AuditOutcome.SUCCESS,
      metadata: { method },
    });

    return { userId: challenge.userId, method };
  }
}
