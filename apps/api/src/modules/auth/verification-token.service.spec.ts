import { Test, TestingModule } from '@nestjs/testing';
import { VerificationTokenService, TOKEN_BYTES } from './verification-token.service';
import { PrismaService } from '../../database/prisma.service';

describe('VerificationTokenService', () => {
  let service: VerificationTokenService;
  let prisma: jest.Mocked<PrismaService>;

  const mockPrisma = {
    emailVerificationToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [VerificationTokenService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<VerificationTokenService>(VerificationTokenService);
    prisma = module.get(PrismaService);
  });

  describe('generateRawToken', () => {
    it('should generate a hex string of correct length', () => {
      const token = service.generateRawToken();
      expect(token).toMatch(/^[0-9a-f]+$/);
      expect(token.length).toBe(TOKEN_BYTES * 2);
    });

    it('should generate unique tokens on each call', () => {
      const token1 = service.generateRawToken();
      const token2 = service.generateRawToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('hashToken', () => {
    it('should return a SHA-256 hex digest', () => {
      const token = 'test-token-value';
      const hash = service.hashToken(token);
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should be deterministic', () => {
      const token = 'same-token';
      expect(service.hashToken(token)).toBe(service.hashToken(token));
    });

    it('should produce different hashes for different tokens', () => {
      expect(service.hashToken('token-a')).not.toBe(service.hashToken('token-b'));
    });
  });

  describe('createToken', () => {
    it('should create a token record and return raw token', async () => {
      mockPrisma.emailVerificationToken.create.mockResolvedValue({
        id: 'token-id',
        userId: 'user-id',
        tokenHash: expect.any(String),
        expiresAt: expect.any(Date),
        consumedAt: null,
        createdAt: new Date(),
      });

      const rawToken = await service.createToken('user-id');

      expect(rawToken).toMatch(/^[0-9a-f]{64}$/);
      expect(mockPrisma.emailVerificationToken.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-id',
          tokenHash: expect.stringMatching(/^[0-9a-f]{64}$/),
          expiresAt: expect.any(Date),
        },
      });
    });

    it('should set expiry to roughly 24 hours from now', async () => {
      mockPrisma.emailVerificationToken.create.mockResolvedValue({
        id: 'token-id',
        userId: 'user-id',
        tokenHash: 'hash',
        expiresAt: new Date(),
        consumedAt: null,
        createdAt: new Date(),
      });

      const before = Date.now();
      await service.createToken('user-id');
      const after = Date.now();

      const callArg = mockPrisma.emailVerificationToken.create.mock.calls[0][0];
      const expiresAt = callArg.data.expiresAt.getTime();
      const expectedLower = before + 23 * 60 * 60 * 1000;
      const expectedUpper = after + 25 * 60 * 60 * 1000;
      expect(expiresAt).toBeGreaterThanOrEqual(expectedLower);
      expect(expiresAt).toBeLessThanOrEqual(expectedUpper);
    });
  });

  describe('consumeToken', () => {
    it('should return userId for a valid unexpired token', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      mockPrisma.emailVerificationToken.findUnique.mockResolvedValue({
        id: 'token-id',
        userId: 'user-id',
        tokenHash: 'hashed-token',
        expiresAt: futureDate,
        consumedAt: null,
        createdAt: new Date(),
      });
      mockPrisma.emailVerificationToken.update.mockResolvedValue({
        id: 'token-id',
        userId: 'user-id',
        tokenHash: 'hashed-token',
        expiresAt: futureDate,
        consumedAt: new Date(),
        createdAt: new Date(),
      });

      const result = await service.consumeToken('raw-token');

      expect(result).toBe('user-id');
      expect(mockPrisma.emailVerificationToken.update).toHaveBeenCalledWith({
        where: { id: 'token-id' },
        data: { consumedAt: expect.any(Date) },
      });
    });

    it('should return null for unknown token', async () => {
      mockPrisma.emailVerificationToken.findUnique.mockResolvedValue(null);

      const result = await service.consumeToken('nonexistent-token');
      expect(result).toBeNull();
    });

    it('should return null for already consumed token', async () => {
      mockPrisma.emailVerificationToken.findUnique.mockResolvedValue({
        id: 'token-id',
        userId: 'user-id',
        tokenHash: 'hashed-token',
        expiresAt: new Date(Date.now() + 3600000),
        consumedAt: new Date(),
        createdAt: new Date(),
      });

      const result = await service.consumeToken('already-consumed');
      expect(result).toBeNull();
    });

    it('should return null for expired token', async () => {
      mockPrisma.emailVerificationToken.findUnique.mockResolvedValue({
        id: 'token-id',
        userId: 'user-id',
        tokenHash: 'hashed-token',
        expiresAt: new Date(Date.now() - 3600000),
        consumedAt: null,
        createdAt: new Date(),
      });

      const result = await service.consumeToken('expired-token');
      expect(result).toBeNull();
    });
  });

  describe('invalidateUserTokens', () => {
    it('should mark all unconsumed tokens as consumed', async () => {
      mockPrisma.emailVerificationToken.updateMany.mockResolvedValue({ count: 2 });

      await service.invalidateUserTokens('user-id');

      expect(mockPrisma.emailVerificationToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-id', consumedAt: null },
        data: { consumedAt: expect.any(Date) },
      });
    });
  });
});
