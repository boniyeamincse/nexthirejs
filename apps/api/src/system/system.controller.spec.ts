import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { SystemController } from './system.controller';
import { QueueService } from '../infrastructure/queue/queue.service';
import { RedisService } from '../infrastructure/redis/redis.service';

describe('SystemController', () => {
  let controller: SystemController;

  const mockQueueService = {
    enqueuePing: jest.fn().mockResolvedValue({
      jobId: '123',
      queue: 'system-health',
      name: 'ping',
    }),
  };

  const mockRedisService = {
    isReady: jest.fn().mockReturnValue(true),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SystemController],
      providers: [
        { provide: QueueService, useValue: mockQueueService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    controller = module.get<SystemController>(SystemController);
  });

  describe('enqueuePing', () => {
    beforeEach(() => {
      mockConfigService.get.mockReturnValue('true');
      mockRedisService.isReady.mockReturnValue(true);
      mockQueueService.enqueuePing.mockClear();
      mockQueueService.enqueuePing.mockResolvedValue({
        jobId: '123',
        queue: 'system-health',
        name: 'ping',
      });
    });

    it('should return 202 queued response when enabled and redis is ready', async () => {
      const result = await controller.enqueuePing({ source: 'manual-test' });

      expect(result).toEqual({
        status: 'queued',
        queue: 'system-health',
        job: 'ping',
        jobId: '123',
      });
    });

    it('should throw NotFoundException when disabled', async () => {
      mockConfigService.get.mockReturnValue('false');

      await expect(controller.enqueuePing({ source: 'manual-test' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ServiceUnavailableException when redis is not ready', async () => {
      mockRedisService.isReady.mockReturnValue(false);

      await expect(controller.enqueuePing({ source: 'manual-test' })).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    it('should call queueService with correct payload', async () => {
      await controller.enqueuePing({ source: 'integration-test' });

      expect(mockQueueService.enqueuePing).toHaveBeenCalled();
    });
  });
});
