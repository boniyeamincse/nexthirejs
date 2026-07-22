import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../../infrastructure/email/email.service';
import { PasswordHashingService } from './password-hashing.service';
import { randomBytes, createHash } from 'crypto';

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly passwordHashingService: PasswordHashingService,
  ) {}

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Do not reveal that the user does not exist
      this.logger.warn(`Password reset requested for non-existent email: ${email}`);
      return;
    }

    if (user.status === 'DELETED') {
      this.logger.warn(`Password reset requested for deleted user: ${email}`);
      return;
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    await this.emailService.enqueuePasswordResetEmail({
      email: user.email,
      token: rawToken,
      userId: user.id,
    });

    this.logger.log(`Password reset token generated and email queued for ${email}`);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = createHash('sha256').update(token).digest('hex');

    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetToken) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    if (resetToken.consumedAt) {
      throw new BadRequestException('Password reset token has already been used');
    }

    if (resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Password reset token has expired');
    }

    if (resetToken.user.status === 'DELETED') {
      throw new BadRequestException('Account is not available');
    }

    const passwordHash = await this.passwordHashingService.hash(newPassword);

    await this.prisma.$transaction(async (tx) => {
      // Update the user's password
      await tx.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash, passwordChangedAt: new Date() },
      });

      // Mark the token as consumed
      await tx.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { consumedAt: new Date() },
      });

      // Optionally revoke all active sessions to force re-login on all devices
      await tx.userSession.updateMany({
        where: { userId: resetToken.userId, status: 'ACTIVE' },
        data: {
          status: 'REVOKED',
          revokedAt: new Date(),
          revokeReason: 'PASSWORD_RESET',
        },
      });
    });

    this.logger.log(`Password successfully reset for user ${resetToken.userId}`);
  }
}
