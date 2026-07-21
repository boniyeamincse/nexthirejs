import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthService } from './health.service';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../infrastructure/redis/redis.service';

describe('HealthService', () => {
  let healthService: HealthService;

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    healthService = module.get<HealthService>(HealthService);
  });

  describe('getHealth', () => {
    it('should return the liveness response unchanged', () => {
      const result = healthService.getHealth();
      expect(result).toEqual({
        status: 'ok',
        service: 'nexthire-api',
        version: '1.0',
      });
    });
  });

  describe('getReadiness', () => {
    it('should return success response when database and redis are connected', async () => {
      mockPrismaService.checkConnection.mockResolvedValue({ status: 'up' });
      mockRedisService.ping.mockResolvedValue('PONG');

      const result = await healthService.getReadiness();
      expect(result).toEqual({
        status: 'ok',
        service: 'nexthire-api',
        checks: {
          database: 'up',
          redis: 'up',
        },
      });
    });

    it('should throw ServiceUnavailableException when database fails', async () => {
      mockPrismaService.checkConnection.mockRejectedValue(new Error('Connection refused'));
      mockRedisService.ping.mockResolvedValue('PONG');

      await expect(healthService.getReadiness()).rejects.toThrow(ServiceUnavailableException);
    });

    it('should throw ServiceUnavailableException when redis fails', async () => {
      mockPrismaService.checkConnection.mockResolvedValue({ status: 'up' });
      mockRedisService.ping.mockRejectedValue(new Error('Redis down'));

      await expect(healthService.getReadiness()).rejects.toThrow(ServiceUnavailableException);
    });

    it('should not expose raw error text in the exception response', async () => {
      mockPrismaService.checkConnection.mockRejectedValue(new Error('Connection refused'));
      mockRedisService.ping.mockResolvedValue('PONG');

      try {
        await healthService.getReadiness();
        fail('Expected error was not thrown');
      } catch (error) {
        const exception = error as ServiceUnavailableException;
        const response = exception.getResponse() as Record<string, unknown>;
        expect(response.message).toContain('Service is not ready');
        expect(response.statusCode).toBe(503);
      }
    });
  });
});
