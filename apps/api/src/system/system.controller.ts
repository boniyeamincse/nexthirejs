import {
  Controller,
  Post,
  Body,
  HttpCode,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { QueueService } from '../infrastructure/queue/queue.service';
import { EnqueueSystemPingDto } from './dto/enqueue-system-ping.dto';
import { RedisService } from '../infrastructure/redis/redis.service';

@Controller('system')
export class SystemController {
  constructor(
    private readonly queueService: QueueService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  @Post('queue/ping')
  @HttpCode(202)
  @ApiOperation({
    summary:
      '(Development only) Enqueue a system health ping job. Disable via SYSTEM_QUEUE_TEST_ENABLED=false.',
  })
  @ApiResponse({ status: 202, description: 'Job queued successfully' })
  @ApiResponse({ status: 404, description: 'Endpoint not available' })
  @ApiResponse({ status: 503, description: 'Redis is not ready' })
  async enqueuePing(@Body() dto: EnqueueSystemPingDto): Promise<{
    status: string;
    queue: string;
    job: string;
    jobId: string | number | undefined;
  }> {
    const enabled =
      this.configService.get<string>('SYSTEM_QUEUE_TEST_ENABLED', 'true') ===
      'true';
    if (!enabled) {
      throw new NotFoundException('This endpoint is not available');
    }

    if (!this.redisService.isReady()) {
      throw new ServiceUnavailableException('Redis is not ready');
    }

    const result = await this.queueService.enqueuePing({
      requestedAt: new Date().toISOString(),
      source: dto.source,
    });

    return {
      status: 'queued',
      queue: result.queue,
      job: result.name,
      jobId: result.jobId,
    };
  }
}
