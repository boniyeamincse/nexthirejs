import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { SYSTEM_HEALTH_QUEUE, SYSTEM_HEALTH_PING_JOB } from './queue.constants';

interface PingPayload {
  source: string;
  requestedAt: string;
}

@Processor(SYSTEM_HEALTH_QUEUE)
export class SystemHealthProcessor extends WorkerHost {
  process(job: Job<PingPayload>): Promise<Record<string, string>> {
    if (job.name !== SYSTEM_HEALTH_PING_JOB) {
      return Promise.reject(new Error(`Unknown job name: ${job.name}`));
    }

    const payload = job.data;

    if (
      !payload ||
      typeof payload !== 'object' ||
      typeof payload.source !== 'string' ||
      typeof payload.requestedAt !== 'string'
    ) {
      return Promise.reject(new Error('Invalid ping job payload'));
    }

    return Promise.resolve({
      status: 'processed',
      source: payload.source,
      processedAt: new Date().toISOString(),
    });
  }
}
