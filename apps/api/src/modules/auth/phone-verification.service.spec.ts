import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PhoneVerificationService } from './phone-verification.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('PhoneVerificationService', () => {
  let service: PhoneVerificationService;
  let prismaService: PrismaService;
  let auditService: AuditService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PhoneVerificationService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
            },
            phoneVerificationOtp: {
              create: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            recordBestEffort: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PhoneVerificationService>(PhoneVerificationService);
    prismaService = module.get<PrismaService>(PrismaService);
    auditService = module.get<AuditService>(AuditService);
  });

  describe('sendOtp', () => {
    it('should send OTP successfully', async () => {
      const userId = 'test-user-id';
      const phone = '+8801700000000';

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue({
        id: userId,
        phone: null,
        status: 'PENDING_VERIFICATION',
        email: 'test@example.com',
        passwordHash: 'hash',
        emailVerifiedAt: null,
        phoneVerifiedAt: null,
        passwordChangedAt: null,
        deactivatedAt: null,
        deactivationReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      jest.spyOn(prismaService.phoneVerificationOtp, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prismaService.phoneVerificationOtp, 'create').mockResolvedValue({
        id: 'otp-id',
        userId,
        phone,
        otpHash: 'hash',
        expiresAt: new Date(),
        consumedAt: null,
        attemptCount: 0,
        createdAt: new Date(),
      });

      const result = await service.sendOtp(userId, phone);

      expect(result.message).toBe('OTP sent to your phone');
      expect(result.expiresIn).toBe(600); // 10 minutes
    });

    it('should throw error if user not found', async () => {
      const userId = 'non-existent-user';
      const phone = '+8801700000000';

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(service.sendOtp(userId, phone)).rejects.toThrow(NotFoundException);
    });

    it('should throw error if phone already in use', async () => {
      const userId = 'test-user-id';
      const phone = '+8801700000000';

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue({
        id: userId,
        phone: null,
        status: 'ACTIVE',
      } as any);

      jest.spyOn(prismaService.phoneVerificationOtp, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue({
        id: 'other-user-id',
        phone,
      } as any);

      await expect(service.sendOtp(userId, phone)).rejects.toThrow(ConflictException);
    });
  });

  describe('verifyOtp', () => {
    it('should throw error for invalid OTP format', async () => {
      const userId = 'test-user-id';
      const phone = '+8801700000000';
      const invalidOtp = 'abc'; // Not numeric or wrong length

      await expect(service.verifyOtp(userId, phone, invalidOtp)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw error if no valid OTP found', async () => {
      const userId = 'test-user-id';
      const phone = '+8801700000000';
      const otp = '123456';

      jest.spyOn(prismaService.phoneVerificationOtp, 'findFirst').mockResolvedValue(null);

      await expect(service.verifyOtp(userId, phone, otp)).rejects.toThrow(NotFoundException);
    });
  });
});
