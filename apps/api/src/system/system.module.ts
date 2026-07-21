import { Module } from '@nestjs/common';
import { RedisModule } from '../infrastructure/redis/redis.module';
import { QueueModule } from '../infrastructure/queue/queue.module';
import { SystemController } from './system.controller';

@Module({
  imports: [RedisModule, QueueModule],
  controllers: [SystemController],
})
export class SystemModule {}
