import { Injectable, NotFoundException } from '@nestjs/common';
import crypto from 'node:crypto';
import { PrismaService } from '../../../database/prisma.service';
import { MfaService } from './mfa.service';
import { AuditService } from '../../audit/audit.service';
import { AuditActorType, AuditOutcome } from '@nexthire/types';
import type { MfaTrustedDeviceSummary } from '@nexthire/types';
import { MFA_ERROR_CODES, MFA_TRUSTED_DEVICE_TTL_DAYS } from '@nexthire/constants';

@Injectable()
export class MfaTrustedDeviceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mfaService: MfaService,
    private readonly auditService: AuditService,
  ) {}

  async trustDevice(
    userId: string,
    deviceName?: string,
    userAgent?: string,
  ): Promise<{ rawToken: string; expiresAt: Date }> {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + MFA_TRUSTED_DEVICE_TTL_DAYS * 24 * 60 * 60 * 1000);

    await this.prisma.mfaTrustedDevice.create({
      data: {
        userId,
        tokenHash: this.mfaService.hashOpaqueValue(rawToken),
        deviceName: deviceName?.slice(0, 120) || null,
        browserSummary: this.summarizeUserAgent(userAgent),
        expiresAt,
      },
    });

    await this.auditService.recordBestEffort({
      action: 'auth.mfa.trusted_device.trusted',
      actorType: AuditActorType.USER,
      actorUserId: userId,
      targetType: 'user',
      targetId: userId,
      outcome: AuditOutcome.SUCCESS,
    });

    return { rawToken, expiresAt };
  }

  /** Returns true when the raw token maps to an active trusted device for the user. */
  async isDeviceTrusted(userId: string, rawToken: string): Promise<boolean> {
    const tokenHash = this.mfaService.hashOpaqueValue(rawToken);
    const device = await this.prisma.mfaTrustedDevice.findUnique({ where: { tokenHash } });

    if (
      !device ||
      device.userId !== userId ||
      device.revokedAt !== null ||
      device.expiresAt < new Date()
    ) {
      return false;
    }

    await this.prisma.mfaTrustedDevice.update({
      where: { id: device.id },
      data: { lastUsedAt: new Date() },
    });
    return true;
  }

  async listDevices(userId: string): Promise<MfaTrustedDeviceSummary[]> {
    const devices = await this.prisma.mfaTrustedDevice.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { trustedAt: 'desc' },
    });

    return devices.map((device) => ({
      id: device.id,
      deviceName: device.deviceName,
      browserSummary: device.browserSummary,
      trustedAt: device.trustedAt.toISOString(),
      lastUsedAt: device.lastUsedAt?.toISOString() ?? null,
      expiresAt: device.expiresAt.toISOString(),
    }));
  }

  /** Ownership-checked revocation; deviceId belonging to another user returns 404. */
  async revokeDevice(userId: string, deviceId: string): Promise<void> {
    const revoked = await this.prisma.mfaTrustedDevice.updateMany({
      where: { id: deviceId, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    if (revoked.count !== 1) {
      throw new NotFoundException(MFA_ERROR_CODES.TRUSTED_DEVICE_NOT_FOUND);
    }

    await this.auditService.recordBestEffort({
      action: 'auth.mfa.trusted_device.revoked',
      actorType: AuditActorType.USER,
      actorUserId: userId,
      targetType: 'mfa_trusted_device',
      targetId: deviceId,
      outcome: AuditOutcome.SUCCESS,
    });
  }

  async revokeAllDevices(userId: string): Promise<number> {
    const revoked = await this.prisma.mfaTrustedDevice.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await this.auditService.recordBestEffort({
      action: 'auth.mfa.trusted_device.revoked_all',
      actorType: AuditActorType.USER,
      actorUserId: userId,
      targetType: 'user',
      targetId: userId,
      outcome: AuditOutcome.SUCCESS,
      metadata: { revokedCount: revoked.count },
    });

    return revoked.count;
  }

  private summarizeUserAgent(userAgent?: string): string | null {
    if (!userAgent) {
      return null;
    }
    // Store only a short, non-identifying summary — never the raw UA string.
    const browser =
      /Firefox\/(\d+)/.exec(userAgent)?.[0] ??
      /Edg\/(\d+)/.exec(userAgent)?.[0] ??
      /Chrome\/(\d+)/.exec(userAgent)?.[0] ??
      /Safari\/(\d+)/.exec(userAgent)?.[0] ??
      'Unknown browser';
    const os = /\(([^)]+)\)/.exec(userAgent)?.[1]?.split(';')[0]?.trim() ?? 'Unknown OS';
    return `${browser} on ${os}`.slice(0, 200);
  }
}
