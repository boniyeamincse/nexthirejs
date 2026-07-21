import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { PrismaService } from '../../database/prisma.service';
import { RequestContextService } from '../../common/request-context';
import { AuditActorType, AuditOutcome } from '@nexthire/types';

describe('AuditService', () => {
  let auditService: AuditService;
  let prismaService: PrismaService;
  let requestContextService: RequestContextService;

  const mockPrismaService = {
    auditLog: {
      create: jest.fn(),
    },
  };

  const mockRequestContextService = {
    getRequestId: jest.fn().mockReturnValue('mocked-request-id'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RequestContextService, useValue: mockRequestContextService },
      ],
    }).compile();

    auditService = module.get<AuditService>(AuditService);
    prismaService = module.get<PrismaService>(PrismaService);
    requestContextService = module.get<RequestContextService>(RequestContextService);

    jest.clearAllMocks();
  });

  describe('Validation', () => {
    it('should throw an error if action name is invalid', async () => {
      await expect(
        auditService.recordRequired({
          action: 'invalid action name with spaces',
          actorType: AuditActorType.ANONYMOUS,
        }),
      ).rejects.toThrow('Invalid audit action name');
    });

    it('should use request context ID if none provided', async () => {
      mockPrismaService.auditLog.create.mockResolvedValue({});
      await auditService.recordRequired({
        action: 'test.action',
        actorType: AuditActorType.ANONYMOUS,
      });

      expect(prismaService.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            requestId: 'mocked-request-id',
          }),
        }),
      );
    });
  });

  describe('Sanitization', () => {
    it('should redact sensitive keys', () => {
      const sanitized = auditService.sanitizeMetadata({
        safe: 'value',
        password: 'secret-password',
        nested: {
          token: '12345',
        },
      });

      expect(sanitized).toEqual({
        safe: 'value',
        password: '[REDACTED]',
        nested: {
          token: '[REDACTED]',
        },
      });
    });

    it('should truncate oversized strings', () => {
      const longString = 'a'.repeat(3000);
      const sanitized = auditService.sanitizeMetadata({ key: longString });

      expect(sanitized.key).toContain('[TRUNCATED]');
      expect(sanitized.key.length).toBeLessThan(3000);
    });

    it('should filter out functions and symbols', () => {
      const sanitized = auditService.sanitizeMetadata({
        fn: () => true,
        sym: Symbol('test'),
        valid: 'yes',
      });

      expect(sanitized).toEqual({ valid: 'yes' });
    });
  });

  describe('Database Write', () => {
    it('should default outcome to SUCCESS', async () => {
      mockPrismaService.auditLog.create.mockResolvedValue({});
      await auditService.recordRequired({
        action: 'auth.login',
        actorType: AuditActorType.USER,
      });

      expect(prismaService.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            outcome: AuditOutcome.SUCCESS,
          }),
        }),
      );
    });

    it('should fail silently in best effort mode', async () => {
      mockPrismaService.auditLog.create.mockRejectedValue(new Error('DB connection lost'));

      await expect(
        auditService.recordBestEffort({
          action: 'auth.login',
          actorType: AuditActorType.USER,
        }),
      ).resolves.not.toThrow();
    });

    it('should throw an application error in required mode', async () => {
      mockPrismaService.auditLog.create.mockRejectedValue(new Error('DB connection lost'));

      await expect(
        auditService.recordRequired({
          action: 'auth.login',
          actorType: AuditActorType.USER,
        }),
      ).rejects.toThrow('Audit recording failed for action: auth.login');
    });
  });
});
