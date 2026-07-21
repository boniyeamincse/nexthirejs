import { Job } from 'bullmq';
import { SystemHealthProcessor } from './system-health.processor';
import { SYSTEM_HEALTH_PING_JOB } from './queue.constants';

interface PingPayload {
  source: string;
  requestedAt: string;
}

describe('SystemHealthProcessor', () => {
  let processor: SystemHealthProcessor;

  beforeEach(() => {
    processor = new SystemHealthProcessor();
  });

  function createJob(name: string, data: unknown): Job<PingPayload> {
    return { name, data } as Job<PingPayload>;
  }

  describe('process', () => {
    it('should return processed result for valid payload', async () => {
      const job = createJob(SYSTEM_HEALTH_PING_JOB, {
        source: 'manual-test',
        requestedAt: '2024-01-01T00:00:00.000Z',
      });

      const result = await processor.process(job);

      expect(result).toHaveProperty('status', 'processed');
      expect(result).toHaveProperty('source', 'manual-test');
      expect(result).toHaveProperty('processedAt');
      expect(() => new Date(result.processedAt as string)).not.toThrow();
    });

    it('should throw for unknown job name', async () => {
      const job = createJob('unknown-job', {});

      await expect(processor.process(job)).rejects.toThrow(
        'Unknown job name: unknown-job',
      );
    });

    it('should throw for null payload', async () => {
      const job = createJob(SYSTEM_HEALTH_PING_JOB, null);

      await expect(processor.process(job)).rejects.toThrow(
        'Invalid ping job payload',
      );
    });

    it('should throw for missing source field', async () => {
      const job = createJob(SYSTEM_HEALTH_PING_JOB, {
        requestedAt: '2024-01-01T00:00:00.000Z',
      });

      await expect(processor.process(job)).rejects.toThrow(
        'Invalid ping job payload',
      );
    });

    it('should throw for non-string source', async () => {
      const job = createJob(SYSTEM_HEALTH_PING_JOB, {
        source: 123,
        requestedAt: '2024-01-01T00:00:00.000Z',
      });

      await expect(processor.process(job)).rejects.toThrow(
        'Invalid ping job payload',
      );
    });

    it('should return valid ISO timestamp in processedAt', async () => {
      const job = createJob(SYSTEM_HEALTH_PING_JOB, {
        source: 'test',
        requestedAt: '2024-01-01T00:00:00.000Z',
      });

      const result = await processor.process(job);
      expect(result.processedAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
      );
    });
  });
});
