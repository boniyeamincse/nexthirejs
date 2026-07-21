import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, BadRequestException } from '@nestjs/common';
import { RegistrationService } from './registration.service';
import { PasswordHashingService } from './password-hashing.service';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../../database/prisma.service';
import { RequestContextService } from '../../common/request-context';
import { EmailService } from '../../infrastructure/email/email.service';
import { VerificationTokenService } from './verification-token.service';

describe('RegistrationService', () => {
  let service: RegistrationService;
  let prisma: jest.Mocked<PrismaService>;
  let passwordHashingService: jest.Mocked<PasswordHashingService>;
  let auditService: jest.Mocked<AuditService>;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    role: {
      findUnique: jest.fn(),
    },
    userRole: {
      create: jest.fn(),
    },
    emailVerificationToken: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockPasswordHashing = {
    hash: jest.fn(),
    verify: jest.fn(),
  };

  const mockAuditService = {
    recordBestEffort: jest.fn(),
    recordRequired: jest.fn(),
  };

  const mockEmailService = {
    enqueueVerificationEmail: jest.fn(),
  };

  const mockVerificationTokenService = {
    createToken: jest.fn(),
    consumeToken: jest.fn(),
    hashToken: jest.fn(),
    invalidateUserTokens: jest.fn(),
  };

  const validDto = {
    email: 'Candidate@Example.com',
    password: 'StrongP@ss1',
    confirmPassword: 'StrongP@ss1',
    acceptTerms: true,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockVerificationTokenService.createToken.mockResolvedValue('test-raw-token');
    mockEmailService.enqueueVerificationEmail.mockResolvedValue({
      jobId: 'job-1',
      queue: 'mail',
      name: 'send-verification-email',
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegistrationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PasswordHashingService, useValue: mockPasswordHashing },
        { provide: AuditService, useValue: mockAuditService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: VerificationTokenService, useValue: mockVerificationTokenService },
        {
          provide: RequestContextService,
          useValue: { getRequestId: jest.fn().mockReturnValue('test-request-id') },
        },
      ],
    }).compile();

    service = module.get<RegistrationService>(RegistrationService);
    prisma = module.get(PrismaService);
    passwordHashingService = module.get(PasswordHashingService);
    auditService = module.get(AuditService);
  });

  describe('email normalization', () => {
    it('should normalize email to lowercase and trim whitespace', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.role.findUnique.mockResolvedValue({ id: 'role-id', code: 'candidate' });
      mockPasswordHashing.hash.mockResolvedValue('hashed-password');
      mockPrisma.$transaction.mockImplementation(async (fn: Function) => {
        return fn({
          user: {
            create: jest.fn().mockResolvedValue({
              id: 'user-id',
              email: 'candidate@example.com',
              status: 'PENDING_VERIFICATION',
              createdAt: new Date('2026-07-21T10:00:00Z'),
            }),
          },
          userRole: { create: jest.fn() },
        });
      });

      const result = await service.register({
        ...validDto,
        email: '  CANDIDATE@Example.com  ',
      });

      expect(result.email).toBe('candidate@example.com');
    });
  });

  describe('duplicate email', () => {
    it('should throw ConflictException when email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-id' });

      await expect(service.register(validDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('password hashing', () => {
    it('should hash the password with Argon2id and not store plaintext', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.role.findUnique.mockResolvedValue({ id: 'role-id', code: 'candidate' });
      mockPasswordHashing.hash.mockResolvedValue('$argon2id$v=19$m=65536,t=3,p=4$hashvalue');

      let savedHash = '';
      mockPrisma.$transaction.mockImplementation(async (fn: Function) => {
        return fn({
          user: {
            create: jest.fn().mockImplementation(({ data }) => {
              savedHash = data.passwordHash;
              return {
                id: 'user-id',
                email: 'candidate@example.com',
                status: 'PENDING_VERIFICATION',
                createdAt: new Date(),
              };
            }),
          },
          userRole: { create: jest.fn() },
        });
      });

      await service.register(validDto);

      expect(savedHash).toBe('$argon2id$v=19$m=65536,t=3,p=4$hashvalue');
      expect(savedHash).not.toBe(validDto.password);
      expect(passwordHashingService.hash).toHaveBeenCalledWith(validDto.password);
    });
  });

  describe('candidate role assignment', () => {
    it('should assign the candidate role to the user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.role.findUnique.mockResolvedValue({ id: 'role-id', code: 'candidate' });
      mockPasswordHashing.hash.mockResolvedValue('hashed');

      const mockUserRoleCreate = jest.fn();
      mockPrisma.$transaction.mockImplementation(async (fn: Function) => {
        return fn({
          user: {
            create: jest.fn().mockResolvedValue({
              id: 'user-id',
              email: 'candidate@example.com',
              status: 'PENDING_VERIFICATION',
              createdAt: new Date(),
            }),
          },
          userRole: { create: mockUserRoleCreate },
        });
      });

      await service.register(validDto);

      expect(mockUserRoleCreate).toHaveBeenCalledWith({
        data: { userId: 'user-id', roleId: 'role-id' },
      });
    });
  });

  describe('safe response mapping', () => {
    it('should return a response without password or hash data', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.role.findUnique.mockResolvedValue({ id: 'role-id', code: 'candidate' });
      mockPasswordHashing.hash.mockResolvedValue('hashed');

      mockPrisma.$transaction.mockImplementation(async (fn: Function) => {
        return fn({
          user: {
            create: jest.fn().mockResolvedValue({
              id: 'user-id',
              email: 'candidate@example.com',
              status: 'PENDING_VERIFICATION',
              createdAt: new Date('2026-07-21T10:00:00Z'),
            }),
          },
          userRole: { create: jest.fn() },
        });
      });

      const result = await service.register(validDto);

      expect(result).toEqual({
        userId: 'user-id',
        email: 'candidate@example.com',
        status: 'PENDING_VERIFICATION',
        emailVerificationRequired: true,
        createdAt: '2026-07-21T10:00:00.000Z',
      });
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('passwordHash');
      expect(result).not.toHaveProperty('token');
    });
  });

  describe('unique constraint race', () => {
    it('should catch P2002 error and return 409', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.role.findUnique.mockResolvedValue({ id: 'role-id', code: 'candidate' });
      mockPasswordHashing.hash.mockResolvedValue('hashed');

      const prismaError = new Error('Unique constraint failed');
      Object.assign(prismaError, { code: 'P2002' });

      mockPrisma.$transaction.mockRejectedValue(prismaError);

      await expect(service.register(validDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('audit event', () => {
    it('should write audit event excluding sensitive data', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.role.findUnique.mockResolvedValue({ id: 'role-id', code: 'candidate' });
      mockPasswordHashing.hash.mockResolvedValue('hashed');

      mockPrisma.$transaction.mockImplementation(async (fn: Function) => {
        return fn({
          user: {
            create: jest.fn().mockResolvedValue({
              id: 'user-id',
              email: 'candidate@example.com',
              status: 'PENDING_VERIFICATION',
              createdAt: new Date(),
            }),
          },
          userRole: { create: jest.fn() },
        });
      });

      await service.register(validDto);

      expect(mockAuditService.recordBestEffort).toHaveBeenCalledWith({
        action: 'auth.candidate.registered',
        actorType: 'USER',
        actorUserId: 'user-id',
        targetType: 'user',
        targetId: 'user-id',
        outcome: 'SUCCESS',
        metadata: {
          registrationChannel: 'web',
          accountStatus: 'PENDING_VERIFICATION',
        },
      });

      const callArg = mockAuditService.recordBestEffort.mock.calls[0][0];
      expect(callArg.metadata).not.toHaveProperty('email');
      expect(callArg.metadata).not.toHaveProperty('password');
    });
  });

  describe('password validation', () => {
    it('should reject mismatched confirmPassword', async () => {
      await expect(
        service.register({ ...validDto, confirmPassword: 'DifferentP@ss2' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject password equal to email', async () => {
      await expect(
        service.register({
          ...validDto,
          email: 'candidate@example.com',
          password: 'candidate@example.com',
          confirmPassword: 'candidate@example.com',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject unaccepted terms', async () => {
      await expect(service.register({ ...validDto, acceptTerms: false })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('transaction failure', () => {
    it('should not return success when transaction fails', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.role.findUnique.mockResolvedValue({ id: 'role-id', code: 'candidate' });
      mockPasswordHashing.hash.mockResolvedValue('hashed');
      mockPrisma.$transaction.mockRejectedValue(new Error('DB connection lost'));

      await expect(service.register(validDto)).rejects.toThrow('INTERNAL_SERVER_ERROR');
    });
  });
});
