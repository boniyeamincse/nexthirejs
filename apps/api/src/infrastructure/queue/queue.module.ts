import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { buildRedisOptions, toBullMQConnectionOptions } from '../redis/redis.options';
import { QueueService } from './queue.service';
import { SystemHealthProcessor } from './system-health.processor';
import { SYSTEM_HEALTH_QUEUE } from './queue.constants';

@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const redisOpts = buildRedisOptions(configService);
        const prefix = configService.get<string>('BULLMQ_PREFIX', 'nexthire');
        return {
          connection: toBullMQConnectionOptions(redisOpts),
          prefix,
          defaultJobOptions: {
            attempts: configService.get<number>('BULLMQ_DEFAULT_ATTEMPTS', 3),
            backoff: {
              type: 'exponential',
              delay: configService.get<number>('BULLMQ_DEFAULT_BACKOFF_MS', 1000),
            },
            removeOnComplete: {
              count: configService.get<number>('BULLMQ_REMOVE_ON_COMPLETE', 100),
            },
            removeOnFail: {
              count: configService.get<number>('BULLMQ_REMOVE_ON_FAIL', 500),
            },
          },
        };
      },
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: SYSTEM_HEALTH_QUEUE,
    }),
  ],
  providers: [QueueService, SystemHealthProcessor],
  exports: [QueueService],
})
export class QueueModule {}
