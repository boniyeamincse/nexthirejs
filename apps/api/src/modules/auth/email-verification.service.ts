import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { VerificationTokenService } from './verification-token.service';
import { EmailService } from '../../infrastructure/email/email.service';
import { AuditService } from '../audit/audit.service';
import { AuditActorType, AuditOutcome } from '@nexthire/types';

export interface VerifyResult {
  userId: string;
  email: string;
  verifiedAt: string;
}

export interface ResendResult {
  message: string;
}

@Injectable()
export class EmailVerificationService {
  private readonly logger = new Logger(EmailVerificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly verificationTokenService: VerificationTokenService,
    private readonly emailService: EmailService,
    private readonly auditService: AuditService,
  ) {}

  async verify(token: string): Promise<VerifyResult> {
    if (!token || typeof token !== 'string' || token.length < 10) {
      throw new BadRequestException('Invalid verification token');
    }

    const userId = await this.verificationTokenService.consumeToken(token);

    if (!userId) {
      await this.auditService.recordBestEffort({
        action: 'auth.email_verification.verify.failed',
        actorType: AuditActorType.ANONYMOUS,
        outcome: AuditOutcome.FAILURE,
        metadata: { reason: 'invalid_or_expired_token' },
      });

      throw new BadRequestException('Invalid or expired verification token');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      this.logger.error(`User ${userId} not found after token consumption`);
      throw new Error('INTERNAL_SERVER_ERROR');
    }

    if (user.status !== 'PENDING_VERIFICATION') {
      throw new ConflictException('Email already verified');
    }

    const now = new Date();
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        status: 'PROFILE_SETUP',
        emailVerifiedAt: now,
      },
    });

    await this.verificationTokenService.invalidateUserTokens(userId);

    await this.auditService.recordBestEffort({
      action: 'auth.email_verification.verify.success',
      actorType: AuditActorType.USER,
      actorUserId: userId,
      targetType: 'user',
      targetId: userId,
      outcome: AuditOutcome.SUCCESS,
    });

    this.logger.log(`Email verified for user ${userId}`);

    return {
      userId: user.id,
      email: user.email,
      verifiedAt: now.toISOString(),
    };
  }

  async resend(email: string): Promise<ResendResult> {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new NotFoundException('No account found with this email address');
    }

    if (user.status === 'ACTIVE' || user.status === 'PROFILE_SETUP') {
      throw new ConflictException('Email already verified');
    }

    await this.verificationTokenService.invalidateUserTokens(user.id);

    const rawToken = await this.verificationTokenService.createToken(user.id);

    await this.emailService.enqueueVerificationEmail({
      email: normalizedEmail,
      token: rawToken,
      userId: user.id,
    });

    await this.auditService.recordBestEffort({
      action: 'auth.email_verification.resend',
      actorType: AuditActorType.USER,
      actorUserId: user.id,
      targetType: 'user',
      targetId: user.id,
      outcome: AuditOutcome.SUCCESS,
    });

    this.logger.log(`Verification email resent to ${normalizedEmail}`);

    return { message: 'Verification email sent' };
  }
}
