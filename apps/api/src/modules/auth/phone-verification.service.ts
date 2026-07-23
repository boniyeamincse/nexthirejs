import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditActorType, AuditOutcome } from '@nexthire/types';
import * as crypto from 'crypto';

export interface SendOtpResult {
  message: string;
  expiresIn: number;
}

export interface VerifyOtpResult {
  userId: string;
  phone: string;
  verifiedAt: string;
}

@Injectable()
export class PhoneVerificationService {
  private readonly logger = new Logger(PhoneVerificationService.name);
  private readonly OTP_LENGTH = 6;
  private readonly OTP_EXPIRY_MINUTES = 10;
  private readonly MAX_ATTEMPTS = 5;
  private readonly RESEND_COOLDOWN_SECONDS = 60;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async sendOtp(userId: string, phone: string): Promise<SendOtpResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, phone: true, status: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const normalizedPhone = phone.trim();

    if (user.phone && user.phone !== normalizedPhone) {
      throw new BadRequestException('Cannot change phone number after registration');
    }

    const recentOtp = await this.prisma.phoneVerificationOtp.findFirst({
      where: {
        userId,
        phone: normalizedPhone,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (
      recentOtp &&
      recentOtp.createdAt.getTime() > Date.now() - this.RESEND_COOLDOWN_SECONDS * 1000
    ) {
      throw new HttpException(
        'Please wait before requesting a new OTP',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const existingUser = await this.prisma.user.findFirst({
      where: {
        phone: normalizedPhone,
        id: { not: userId },
      },
    });

    if (existingUser) {
      throw new ConflictException('Phone number already in use');
    }

    const otp = this.generateOtp();
    const otpHash = this.hashOtp(otp);
    const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);

    await this.prisma.phoneVerificationOtp.create({
      data: {
        userId,
        phone: normalizedPhone,
        otpHash,
        expiresAt,
      },
    });

    await this.auditService.recordBestEffort({
      action: 'auth.phone_verification.otp_sent',
      actorType: AuditActorType.USER,
      actorUserId: userId,
      targetType: 'user',
      targetId: userId,
      outcome: AuditOutcome.SUCCESS,
      metadata: { phone: this.maskPhone(normalizedPhone) },
    });

    this.logger.log(`OTP sent to ${this.maskPhone(normalizedPhone)} for user ${userId}`);

    // TODO: Integrate SMS service to send OTP
    // For now, log OTP for development
    if (process.env.NODE_ENV === 'development') {
      this.logger.debug(`[DEV ONLY] OTP for ${normalizedPhone}: ${otp}`);
    }

    return {
      message: 'OTP sent to your phone',
      expiresIn: this.OTP_EXPIRY_MINUTES * 60,
    };
  }

  async verifyOtp(userId: string, phone: string, otp: string): Promise<VerifyOtpResult> {
    if (!otp || otp.length !== this.OTP_LENGTH || !/^\d+$/.test(otp)) {
      throw new BadRequestException('Invalid OTP format');
    }

    const normalizedPhone = phone.trim();
    const otpRecord = await this.prisma.phoneVerificationOtp.findFirst({
      where: {
        userId,
        phone: normalizedPhone,
        expiresAt: { gt: new Date() },
        consumedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new NotFoundException('No valid OTP found for this phone');
    }

    const otpHash = this.hashOtp(otp);
    const isValid = otpHash === otpRecord.otpHash;

    if (!isValid) {
      await this.prisma.phoneVerificationOtp.update({
        where: { id: otpRecord.id },
        data: { attemptCount: otpRecord.attemptCount + 1 },
      });

      if (otpRecord.attemptCount + 1 >= this.MAX_ATTEMPTS) {
        await this.auditService.recordBestEffort({
          action: 'auth.phone_verification.verify.failed_max_attempts',
          actorType: AuditActorType.USER,
          actorUserId: userId,
          outcome: AuditOutcome.FAILURE,
          metadata: { phone: this.maskPhone(normalizedPhone) },
        });

        throw new BadRequestException('Maximum OTP attempts exceeded. Please request a new OTP');
      }

      throw new BadRequestException('Invalid OTP');
    }

    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.phoneVerificationOtp.update({
        where: { id: otpRecord.id },
        data: { consumedAt: now },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: {
          phone: normalizedPhone,
          phoneVerifiedAt: now,
        },
      }),
    ]);

    await this.auditService.recordBestEffort({
      action: 'auth.phone_verification.verify.success',
      actorType: AuditActorType.USER,
      actorUserId: userId,
      targetType: 'user',
      targetId: userId,
      outcome: AuditOutcome.SUCCESS,
      metadata: { phone: this.maskPhone(normalizedPhone) },
    });

    this.logger.log(`Phone verified for user ${userId}`);

    return {
      userId,
      phone: normalizedPhone,
      verifiedAt: now.toISOString(),
    };
  }

  async resendOtp(userId: string, phone: string): Promise<SendOtpResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Invalidate all previous OTPs for this phone
    await this.prisma.phoneVerificationOtp.updateMany({
      where: {
        userId,
        phone: phone.trim(),
        consumedAt: null,
      },
      data: { expiresAt: new Date() },
    });

    return this.sendOtp(userId, phone);
  }

  private generateOtp(): string {
    return crypto
      .randomInt(0, 10 ** this.OTP_LENGTH)
      .toString()
      .padStart(this.OTP_LENGTH, '0');
  }

  private hashOtp(otp: string): string {
    return crypto.createHash('sha256').update(otp).digest('hex');
  }

  private maskPhone(phone: string): string {
    if (!phone || phone.length < 4) return '****';
    return phone.slice(0, -4).replace(/\d/g, '*') + phone.slice(-4);
  }
}
