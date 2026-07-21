import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class CandidateShareTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string) {
    return this.prisma.candidateProfileShareToken.findUnique({
      where: { userId },
    });
  }

  async findByTokenHash(tokenHash: string) {
    return this.prisma.candidateProfileShareToken.findUnique({
      where: { tokenHash },
    });
  }

  async upsert(userId: string, data: { tokenHash: string; enabled: boolean }) {
    return this.prisma.candidateProfileShareToken.upsert({
      where: { userId },
      create: {
        userId,
        tokenHash: data.tokenHash,
        enabled: data.enabled,
      },
      update: {
        tokenHash: data.tokenHash,
        enabled: data.enabled,
        rotatedAt: new Date(),
      },
    });
  }

  async updateEnabled(userId: string, enabled: boolean) {
    return this.prisma.candidateProfileShareToken.update({
      where: { userId },
      data: { enabled },
    });
  }
}
