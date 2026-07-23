import {
  Injectable,
  Logger,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';
import crypto from 'node:crypto';
import { PrismaService } from '../../../database/prisma.service';
import { PasswordHashingService } from '../password-hashing.service';
import { MfaEncryptionService } from './mfa-encryption.service';
import { MfaPolicyService } from './mfa-policy.service';
import { AuditService } from '../../audit/audit.service';
import { AuditActorType, AuditOutcome } from '@nexthire/types';
import type {
  MfaSecurityStatus,
  BeginMfaEnrollmentResult,
  ConfirmMfaEnrollmentResult,
  RegenerateMfaRecoveryCodesResult,
} from '@nexthire/types';
import {
  MFA_ERROR_CODES,
  MFA_ENROLLMENT_TTL_MINUTES,
  MFA_RECOVERY_CODE_COUNT,
  MFA_RECOVERY_CODE_LENGTH,
  MFA_TOTP_ISSUER,
  MFA_TOTP_WINDOW,
  AUTH_ERROR_CODES,
} from '@nexthire/constants';

/** Unambiguous uppercase alphabet for recovery codes (no O/0/I/1/L). */
const RECOVERY_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

@Injectable()
export class MfaService {
  private readonly logger = new Logger(MfaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordHashingService: PasswordHashingService,
    private readonly encryptionService: MfaEncryptionService,
    private readonly policyService: MfaPolicyService,
    private readonly auditService: AuditService,
  ) {
    authenticator.options = { window: MFA_TOTP_WINDOW };
  }

  hashOpaqueValue(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex');
  }

  private normalizeRecoveryCode(code: string): string {
    return code.replace(/[\s-]/g, '').toUpperCase();
  }

  async getSecurityStatus(
    userId: string,
    roleCodes: readonly string[],
    rawTrustedDeviceToken?: string,
  ): Promise<MfaSecurityStatus> {
    const now = new Date();
    const [mfa, recoveryCodesRemaining, trustedDevices] = await Promise.all([
      this.prisma.userMfa.findUnique({ where: { userId } }),
      this.prisma.mfaRecoveryCode.count({ where: { userId, usedAt: null } }),
      this.prisma.mfaTrustedDevice.findMany({
        where: { userId, revokedAt: null, expiresAt: { gt: now } },
        select: { tokenHash: true },
      }),
    ]);

    let currentDeviceTrusted = false;
    if (rawTrustedDeviceToken) {
      const tokenHash = this.hashOpaqueValue(rawTrustedDeviceToken);
      currentDeviceTrusted = trustedDevices.some((device) => device.tokenHash === tokenHash);
    }

    const pendingActive =
      mfa?.status === 'PENDING' && mfa.enrollmentExpiresAt && mfa.enrollmentExpiresAt > now;

    return {
      status: mfa?.status === 'ENABLED' ? 'ENABLED' : pendingActive ? 'PENDING' : 'DISABLED',
      requiredByPolicy: this.policyService.isMfaRequiredForRoles(roleCodes),
      enabledAt: mfa?.enabledAt?.toISOString() ?? null,
      recoveryCodesRemaining: mfa?.status === 'ENABLED' ? recoveryCodesRemaining : 0,
      trustedDeviceCount: mfa?.status === 'ENABLED' ? trustedDevices.length : 0,
      currentDeviceTrusted,
      enrollmentExpiresAt: pendingActive ? mfa.enrollmentExpiresAt!.toISOString() : null,
    };
  }

  async beginEnrollment(
    userId: string,
    currentPassword: string,
  ): Promise<BeginMfaEnrollmentResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, passwordHash: true, status: true },
    });

    if (!user || user.status === 'SUSPENDED' || user.status === 'DELETED') {
      throw new ForbiddenException(AUTH_ERROR_CODES.ACCOUNT_UNAVAILABLE);
    }

    const passwordValid = await this.passwordHashingService.verify(
      user.passwordHash,
      currentPassword,
    );
    if (!passwordValid) {
      await this.recordAudit(userId, 'auth.mfa.enrollment.failed', AuditOutcome.FAILURE, {
        failureCategory: 'wrong_password',
      });
      throw new UnauthorizedException(MFA_ERROR_CODES.PASSWORD_INVALID);
    }

    const existing = await this.prisma.userMfa.findUnique({ where: { userId } });
    if (existing?.status === 'ENABLED') {
      throw new ConflictException(MFA_ERROR_CODES.ALREADY_ENABLED);
    }

    const secret = authenticator.generateSecret();
    const { ciphertext, version } = this.encryptionService.encrypt(secret);
    const enrollmentExpiresAt = new Date(Date.now() + MFA_ENROLLMENT_TTL_MINUTES * 60 * 1000);

    await this.prisma.userMfa.upsert({
      where: { userId },
      create: {
        userId,
        status: 'PENDING',
        encryptedTotpSecret: ciphertext,
        secretEncryptionVersion: version,
        enrollmentExpiresAt,
      },
      update: {
        status: 'PENDING',
        encryptedTotpSecret: ciphertext,
        secretEncryptionVersion: version,
        enrollmentExpiresAt,
        enabledAt: null,
      },
    });

    const otpauthUrl = authenticator.keyuri(user.email, MFA_TOTP_ISSUER, secret);
    const qrDataUrl = await toDataURL(otpauthUrl, { margin: 1, width: 220 });

    await this.recordAudit(userId, 'auth.mfa.enrollment.started', AuditOutcome.SUCCESS);

    return {
      qrDataUrl,
      manualSecret: secret,
      enrollmentExpiresAt: enrollmentExpiresAt.toISOString(),
    };
  }

  async confirmEnrollment(userId: string, code: string): Promise<ConfirmMfaEnrollmentResult> {
    const mfa = await this.prisma.userMfa.findUnique({ where: { userId } });

    if (!mfa || mfa.status !== 'PENDING' || !mfa.encryptedTotpSecret) {
      throw new BadRequestException(MFA_ERROR_CODES.ENROLLMENT_NOT_STARTED);
    }
    if (!mfa.enrollmentExpiresAt || mfa.enrollmentExpiresAt < new Date()) {
      throw new BadRequestException(MFA_ERROR_CODES.ENROLLMENT_NOT_STARTED);
    }

    const secret = this.encryptionService.decrypt(
      mfa.encryptedTotpSecret,
      mfa.secretEncryptionVersion ?? 1,
    );

    if (!authenticator.verify({ token: code, secret })) {
      await this.recordAudit(userId, 'auth.mfa.enrollment.failed', AuditOutcome.FAILURE, {
        failureCategory: 'invalid_code',
      });
      throw new UnauthorizedException(MFA_ERROR_CODES.CODE_INVALID);
    }

    const enabledAt = new Date();
    const { plainCodes, hashedCodes } = this.generateRecoveryCodes();

    await this.prisma.$transaction(async (tx) => {
      await tx.userMfa.update({
        where: { userId },
        data: {
          status: 'ENABLED',
          enabledAt,
          disabledAt: null,
          enrollmentExpiresAt: null,
          lastVerifiedAt: enabledAt,
          recoveryCodesGeneratedAt: enabledAt,
        },
      });
      await tx.mfaRecoveryCode.deleteMany({ where: { userId } });
      await tx.mfaRecoveryCode.createMany({
        data: hashedCodes.map((codeHash) => ({ userId, codeHash })),
      });
    });

    await this.recordAudit(userId, 'auth.mfa.enrollment.confirmed', AuditOutcome.SUCCESS);

    return { recoveryCodes: plainCodes, enabledAt: enabledAt.toISOString() };
  }

  async disable(userId: string, currentPassword: string, code: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    if (!user) {
      throw new ForbiddenException(AUTH_ERROR_CODES.ACCOUNT_UNAVAILABLE);
    }

    const passwordValid = await this.passwordHashingService.verify(
      user.passwordHash,
      currentPassword,
    );
    if (!passwordValid) {
      await this.recordAudit(userId, 'auth.mfa.disable.failed', AuditOutcome.FAILURE, {
        failureCategory: 'wrong_password',
      });
      throw new UnauthorizedException(MFA_ERROR_CODES.PASSWORD_INVALID);
    }

    const mfa = await this.prisma.userMfa.findUnique({ where: { userId } });
    if (!mfa || mfa.status !== 'ENABLED' || !mfa.encryptedTotpSecret) {
      throw new BadRequestException(MFA_ERROR_CODES.NOT_ENABLED);
    }

    const verified = await this.verifyEnabledFactor(userId, mfa, code);
    if (!verified) {
      await this.recordAudit(userId, 'auth.mfa.disable.failed', AuditOutcome.FAILURE, {
        failureCategory: 'invalid_code',
      });
      throw new UnauthorizedException(MFA_ERROR_CODES.CODE_INVALID);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.userMfa.update({
        where: { userId },
        data: {
          status: 'DISABLED',
          encryptedTotpSecret: null,
          secretEncryptionVersion: null,
          enrollmentExpiresAt: null,
          enabledAt: null,
          disabledAt: new Date(),
          recoveryCodesGeneratedAt: null,
        },
      });
      await tx.mfaRecoveryCode.deleteMany({ where: { userId } });
      await tx.mfaTrustedDevice.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await tx.mfaChallenge.updateMany({
        where: { userId, status: 'PENDING' },
        data: { status: 'REVOKED' },
      });
    });

    await this.recordAudit(userId, 'auth.mfa.disabled', AuditOutcome.SUCCESS);
  }

  async regenerateRecoveryCodes(
    userId: string,
    code: string,
  ): Promise<RegenerateMfaRecoveryCodesResult> {
    const mfa = await this.prisma.userMfa.findUnique({ where: { userId } });
    if (!mfa || mfa.status !== 'ENABLED' || !mfa.encryptedTotpSecret) {
      throw new BadRequestException(MFA_ERROR_CODES.NOT_ENABLED);
    }

    const secret = this.encryptionService.decrypt(
      mfa.encryptedTotpSecret,
      mfa.secretEncryptionVersion ?? 1,
    );
    if (!authenticator.verify({ token: code, secret })) {
      await this.recordAudit(
        userId,
        'auth.mfa.recovery_codes.regeneration_failed',
        AuditOutcome.FAILURE,
        { failureCategory: 'invalid_code' },
      );
      throw new UnauthorizedException(MFA_ERROR_CODES.CODE_INVALID);
    }

    const generatedAt = new Date();
    const { plainCodes, hashedCodes } = this.generateRecoveryCodes();

    await this.prisma.$transaction(async (tx) => {
      await tx.mfaRecoveryCode.deleteMany({ where: { userId } });
      await tx.mfaRecoveryCode.createMany({
        data: hashedCodes.map((codeHash) => ({ userId, codeHash })),
      });
      await tx.userMfa.update({
        where: { userId },
        data: { recoveryCodesGeneratedAt: generatedAt },
      });
    });

    await this.recordAudit(userId, 'auth.mfa.recovery_codes.regenerated', AuditOutcome.SUCCESS);

    return { recoveryCodes: plainCodes, generatedAt: generatedAt.toISOString() };
  }

  /**
   * Verify a TOTP code or single-use recovery code for a user whose MFA is
   * ENABLED. Recovery codes are consumed atomically on success.
   */
  async verifyEnabledFactor(
    userId: string,
    mfa: { encryptedTotpSecret: string | null; secretEncryptionVersion: number | null },
    code: string,
  ): Promise<'TOTP' | 'RECOVERY_CODE' | false> {
    if (/^[0-9]{6}$/.test(code.trim())) {
      const secret = this.encryptionService.decrypt(
        mfa.encryptedTotpSecret!,
        mfa.secretEncryptionVersion ?? 1,
      );
      if (authenticator.verify({ token: code.trim(), secret })) {
        return 'TOTP';
      }
      return false;
    }

    const normalized = this.normalizeRecoveryCode(code);
    const codeHash = this.hashOpaqueValue(normalized);
    const consumed = await this.prisma.mfaRecoveryCode.updateMany({
      where: { userId, codeHash, usedAt: null },
      data: { usedAt: new Date() },
    });
    return consumed.count === 1 ? 'RECOVERY_CODE' : false;
  }

  private generateRecoveryCodes(): { plainCodes: string[]; hashedCodes: string[] } {
    const plainCodes: string[] = [];
    const hashedCodes: string[] = [];
    for (let i = 0; i < MFA_RECOVERY_CODE_COUNT; i += 1) {
      let codeValue = '';
      for (let j = 0; j < MFA_RECOVERY_CODE_LENGTH; j += 1) {
        codeValue += RECOVERY_CODE_ALPHABET[crypto.randomInt(RECOVERY_CODE_ALPHABET.length)];
      }
      plainCodes.push(codeValue);
      hashedCodes.push(this.hashOpaqueValue(codeValue));
    }
    return { plainCodes, hashedCodes };
  }

  private async recordAudit(
    userId: string,
    action: string,
    outcome: AuditOutcome,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.auditService.recordBestEffort({
      action,
      actorType: AuditActorType.USER,
      actorUserId: userId,
      targetType: 'user',
      targetId: userId,
      outcome,
      metadata,
    });
  }
}
