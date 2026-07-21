import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';
import { RedisReadiness } from './redis.types';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  constructor(
    @Inject(REDIS_CLIENT) private readonly client: Redis,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.client.connect();
      this.logger.log('Redis connected');
    } catch (error) {
      this.logger.error(`Redis connection failed: ${(error as Error).message}`);
      throw error;
    }
  }

  async ping(): Promise<string> {
    return this.client.ping();
  }

  getClient(): Redis {
    return this.client;
  }

  isReady(): boolean {
    return this.client.status === 'ready';
  }

  async checkConnection(): Promise<RedisReadiness> {
    await this.client.ping();
    return { status: 'up' };
  }

  async disconnect(): Promise<void> {
    await this.client.quit();
  }

  async onModuleDestroy(): Promise<void> {
    await this.disconnect();
    this.logger.log('Redis disconnected');
  }
}
