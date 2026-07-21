import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';
import { RedisService } from './redis.service';

describe('RedisService', () => {
  let redisService: RedisService;
  let mockClient: jest.Mocked<Pick<Redis, 'ping' | 'quit' | 'connect' | 'status'>>;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    mockClient = {
      ping: jest.fn(),
      quit: jest.fn(),
      connect: jest.fn(),
      status: 'ready',
    };

    mockConfigService.get.mockReturnValue(5000);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        { provide: REDIS_CLIENT, useValue: mockClient },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    redisService = module.get<RedisService>(RedisService);
  });

  describe('ping', () => {
    it('should return PONG', async () => {
      mockClient.ping.mockResolvedValue('PONG');

      const result = await redisService.ping();
      expect(result).toBe('PONG');
    });
  });

  describe('isReady', () => {
    it('should return true when client status is ready', () => {
      mockClient.status = 'ready';
      expect(redisService.isReady()).toBe(true);
    });

    it('should return false when client status is not ready', () => {
      mockClient.status = 'connecting';
      expect(redisService.isReady()).toBe(false);
    });
  });

  describe('disconnect', () => {
    it('should call quit on the client', async () => {
      mockClient.quit.mockResolvedValue('OK');

      await redisService.disconnect();
      expect(mockClient.quit).toHaveBeenCalled();
    });
  });

  describe('checkConnection', () => {
    it('should return { status: "up" } when ping succeeds', async () => {
      mockClient.ping.mockResolvedValue('PONG');

      const result = await redisService.checkConnection();
      expect(result).toEqual({ status: 'up' });
    });

    it('should throw when ping fails', async () => {
      mockClient.ping.mockRejectedValue(new Error('Connection lost'));

      await expect(redisService.checkConnection()).rejects.toThrow('Connection lost');
    });
  });
});
