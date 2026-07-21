import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { EmailVerificationService } from './email-verification.service';
import { VerificationTokenService } from './verification-token.service';
import { EmailService } from '../../infrastructure/email/email.service';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../../database/prisma.service';
import { RequestContextService } from '../../common/request-context';

describe('EmailVerificationService', () => {
  let service: EmailVerificationService;
  let prisma: jest.Mocked<PrismaService>;
  let verificationTokenService: jest.Mocked<VerificationTokenService>;
  let emailService: jest.Mocked<EmailService>;
  let auditService: jest.Mocked<AuditService>;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    emailVerificationToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const mockVerificationTokenService = {
    createToken: jest.fn(),
    consumeToken: jest.fn(),
    hashToken: jest.fn(),
    invalidateUserTokens: jest.fn(),
  };

  const mockEmailService = {
    enqueueVerificationEmail: jest.fn(),
  };

  const mockAuditService = {
    recordBestEffort: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockVerificationTokenService.consumeToken.mockResolvedValue('user-id');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailVerificationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: VerificationTokenService, useValue: mockVerificationTokenService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: AuditService, useValue: mockAuditService },
        {
          provide: RequestContextService,
          useValue: { getRequestId: jest.fn().mockReturnValue('test-request-id') },
        },
      ],
    }).compile();

    service = module.get<EmailVerificationService>(EmailVerificationService);
    prisma = module.get(PrismaService);
    verificationTokenService = module.get(VerificationTokenService);
    emailService = module.get(EmailService);
    auditService = module.get(AuditService);
  });

  describe('verify', () => {
    it('should activate user on successful verification', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        status: 'PENDING_VERIFICATION',
        emailVerifiedAt: null,
      });
      mockPrisma.user.update.mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
      });

      const result = await service.verify('valid-token');

      expect(result.email).toBe('test@example.com');
      expect(result.userId).toBe('user-id');
      expect(result.verifiedAt).toBeDefined();

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id' },
        data: {
          status: 'ACTIVE',
          emailVerifiedAt: expect.any(Date),
        },
      });
    });

    it('should throw BadRequestException for short token', async () => {
      await expect(service.verify('short')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid/expired token', async () => {
      mockVerificationTokenService.consumeToken.mockResolvedValue(null);

      await expect(service.verify('invalid-token-value-here')).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if user already active', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
      });

      await expect(service.verify('valid-token')).rejects.toThrow(ConflictException);
    });

    it('should audit verify success and failure events', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        status: 'PENDING_VERIFICATION',
        emailVerifiedAt: null,
      });
      mockPrisma.user.update.mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
      });

      await service.verify('valid-token');

      expect(auditService.recordBestEffort).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'auth.email_verification.verify.success' }),
      );
    });
  });

  describe('resend', () => {
    it('should create new token and enqueue email for pending user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        status: 'PENDING_VERIFICATION',
        emailVerifiedAt: null,
      });
      mockVerificationTokenService.createToken.mockResolvedValue('new-raw-token');
      mockEmailService.enqueueVerificationEmail.mockResolvedValue({
        jobId: 'job-1',
        queue: 'mail',
        name: 'send-verification-email',
      });

      const result = await service.resend('test@example.com');

      expect(result.message).toBe('Verification email sent');
      expect(mockVerificationTokenService.invalidateUserTokens).toHaveBeenCalledWith('user-id');
      expect(mockVerificationTokenService.createToken).toHaveBeenCalledWith('user-id');
      expect(mockEmailService.enqueueVerificationEmail).toHaveBeenCalledWith({
        email: 'test@example.com',
        token: 'new-raw-token',
        userId: 'user-id',
      });
    });

    it('should normalize email case before lookup', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.resend('  TEST@Example.com  ')).rejects.toThrow(NotFoundException);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should throw NotFoundException for unknown email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.resend('unknown@example.com')).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if user already active', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
      });

      await expect(service.resend('test@example.com')).rejects.toThrow(ConflictException);
    });

    it('should audit resend event', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        status: 'PENDING_VERIFICATION',
        emailVerifiedAt: null,
      });
      mockVerificationTokenService.createToken.mockResolvedValue('token');
      mockEmailService.enqueueVerificationEmail.mockResolvedValue({
        jobId: 'job-1',
        queue: 'mail',
        name: 'send-verification-email',
      });

      await service.resend('test@example.com');

      expect(auditService.recordBestEffort).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'auth.email_verification.resend' }),
      );
    });
  });
});
