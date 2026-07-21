import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SYSTEM_HEALTH_QUEUE, SYSTEM_HEALTH_PING_JOB } from './queue.constants';

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue(SYSTEM_HEALTH_QUEUE) private readonly healthQueue: Queue,
  ) {}

  async enqueuePing(input: { requestedAt: string; source: string }): Promise<{
    jobId: string | number | undefined;
    queue: string;
    name: string;
  }> {
    const job = await this.healthQueue.add(SYSTEM_HEALTH_PING_JOB, input);
    return {
      jobId: job.id,
      queue: SYSTEM_HEALTH_QUEUE,
      name: SYSTEM_HEALTH_PING_JOB,
    };
  }
}
