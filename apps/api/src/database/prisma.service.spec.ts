import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let prismaService: PrismaService;

  const mockConfigService = {
    get: jest.fn(),
  };

  describe('constructor', () => {
    it('should throw when DATABASE_URL is missing', () => {
      mockConfigService.get.mockReturnValue(undefined);

      expect(() => {
        const service = new PrismaService(mockConfigService as unknown as ConfigService);
        void service;
      }).toThrow('DATABASE_URL environment variable is not set');
    });
  });

  describe('with valid config', () => {
    let module: TestingModule;

    beforeEach(async () => {
      mockConfigService.get.mockReturnValue('postgresql://user:pass@localhost:5432/db');

      module = await Test.createTestingModule({
        providers: [PrismaService, { provide: ConfigService, useValue: mockConfigService }],
      }).compile();

      prismaService = module.get<PrismaService>(PrismaService);
    });

    afterEach(async () => {
      jest.restoreAllMocks();
      await module.close();
    });

    it('should be defined', () => {
      expect(prismaService).toBeDefined();
    });

    it('checkConnection should return { status: "up" } when query succeeds', async () => {
      jest.spyOn(prismaService, '$queryRawUnsafe' as any).mockResolvedValue([{ '?column?': 1 }]);

      const result = await prismaService.checkConnection();
      expect(result).toEqual({ status: 'up' });
    });

    it('checkConnection should reject when query fails', async () => {
      jest
        .spyOn(prismaService, '$queryRawUnsafe' as any)
        .mockRejectedValue(new Error('Connection failed'));

      await expect(prismaService.checkConnection()).rejects.toThrow('Connection failed');
    });

    it('onModuleDestroy should call $disconnect', async () => {
      const disconnectSpy = jest
        .spyOn(prismaService, '$disconnect' as any)
        .mockResolvedValue(undefined);

      await prismaService.onModuleDestroy();
      expect(disconnectSpy).toHaveBeenCalled();
    });
  });
});
