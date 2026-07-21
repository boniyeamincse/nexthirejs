import { Injectable, Logger } from '@nestjs/common';
import crypto from 'node:crypto';
import { PrismaService } from '../../database/prisma.service';

export const TOKEN_BYTES = 32;
export const TOKEN_EXPIRY_HOURS = 24;

@Injectable()
export class VerificationTokenService {
  private readonly logger = new Logger(VerificationTokenService.name);

  constructor(private readonly prisma: PrismaService) {}

  generateRawToken(): string {
    return crypto.randomBytes(TOKEN_BYTES).toString('hex');
  }

  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async createToken(userId: string): Promise<string> {
    const rawToken = this.generateRawToken();
    const tokenHash = this.hashToken(rawToken);

    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    await this.prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    this.logger.debug(`Verification token created for user ${userId}`);
    return rawToken;
  }

  async consumeToken(token: string): Promise<string | null> {
    const tokenHash = this.hashToken(token);

    const record = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
    });

    if (!record) {
      return null;
    }

    if (record.consumedAt) {
      return null;
    }

    if (record.expiresAt < new Date()) {
      return null;
    }

    await this.prisma.emailVerificationToken.update({
      where: { id: record.id },
      data: { consumedAt: new Date() },
    });

    return record.userId;
  }

  async invalidateUserTokens(userId: string): Promise<void> {
    await this.prisma.emailVerificationToken.updateMany({
      where: { userId, consumedAt: null },
      data: { consumedAt: new Date() },
    });
  }
}
