import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../infrastructure/redis/redis.service';

describe('HealthController', () => {
  let healthController: HealthController;

  const mockPrismaService = {
    checkConnection: jest.fn(),
  };

  const mockRedisService = {
    ping: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    mockConfigService.get.mockReturnValue(5000);

    const app: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        HealthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    healthController = app.get<HealthController>(HealthController);
  });

  describe('getHealth', () => {
    it('should return the liveness status', () => {
      const result = healthController.getHealth();
      expect(result).toEqual({
        status: 'ok',
        service: 'nexthire-api',
        version: '1.0',
      });
    });
  });

  describe('getReadiness', () => {
    it('should return the readiness status with checks', async () => {
      mockPrismaService.checkConnection.mockResolvedValue({ status: 'up' });
      mockRedisService.ping.mockResolvedValue('PONG');

      const result = await healthController.getReadiness();
      expect(result).toEqual({
        status: 'ok',
        service: 'nexthire-api',
        checks: {
          database: 'up',
          redis: 'up',
        },
      });
    });
  });
});
