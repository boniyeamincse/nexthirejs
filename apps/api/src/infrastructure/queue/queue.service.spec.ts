import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QueueService } from './queue.service';
import { SYSTEM_HEALTH_QUEUE, SYSTEM_HEALTH_PING_JOB } from './queue.constants';

describe('QueueService', () => {
  let queueService: QueueService;
  let mockQueue: jest.Mocked<Pick<Queue, 'add' | 'name'>>;

  beforeEach(async () => {
    mockQueue = {
      add: jest.fn(),
      name: SYSTEM_HEALTH_QUEUE,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        {
          provide: getQueueToken(SYSTEM_HEALTH_QUEUE),
          useValue: mockQueue,
        },
      ],
    }).compile();

    queueService = module.get<QueueService>(QueueService);
  });

  describe('enqueuePing', () => {
    it('should enqueue a ping job with the correct name and payload', async () => {
      mockQueue.add.mockResolvedValue({
        id: 'job-123',
        name: SYSTEM_HEALTH_PING_JOB,
        data: {
          source: 'manual-test',
          requestedAt: '2024-01-01T00:00:00.000Z',
        },
      } as ReturnType<Queue['add']> extends Promise<infer R> ? R : never);

      const input = {
        requestedAt: '2024-01-01T00:00:00.000Z',
        source: 'manual-test',
      };

      const result = await queueService.enqueuePing(input);

      expect(mockQueue.add).toHaveBeenCalledWith(SYSTEM_HEALTH_PING_JOB, input);
      expect(result).toEqual({
        jobId: 'job-123',
        queue: SYSTEM_HEALTH_QUEUE,
        name: SYSTEM_HEALTH_PING_JOB,
      });
    });

    it('should return safe metadata without exposing queue internals', async () => {
      mockQueue.add.mockResolvedValue({
        id: 'job-456',
        name: SYSTEM_HEALTH_PING_JOB,
      } as ReturnType<Queue['add']> extends Promise<infer R> ? R : never);

      const result = await queueService.enqueuePing({
        requestedAt: new Date().toISOString(),
        source: 'test',
      });

      expect(result).toHaveProperty('jobId');
      expect(result).toHaveProperty('queue');
      expect(result).toHaveProperty('name');
      expect(result.queue).toBe(SYSTEM_HEALTH_QUEUE);
      expect(result.name).toBe(SYSTEM_HEALTH_PING_JOB);
    });
  });
});
