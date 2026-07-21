import { ConfigService } from '@nestjs/config';
import { RedisConnectionOptions } from './redis.types';
import type { RedisOptions as IORedisOptions, RedisOptions } from 'ioredis';

export function buildRedisOptions(configService: ConfigService): RedisConnectionOptions {
  return {
    host: configService.get<string>('REDIS_HOST', 'localhost'),
    port: configService.get<number>('REDIS_PORT', 6379),
    username: configService.get<string>('REDIS_USERNAME', '') || undefined,
    password: configService.get<string>('REDIS_PASSWORD', '') || undefined,
    db: configService.get<number>('REDIS_DB', 0),
    tls: configService.get<string>('REDIS_TLS', 'false') === 'true',
    connectTimeout: configService.get<number>('REDIS_CONNECT_TIMEOUT_MS', 5000),
    commandTimeout: configService.get<number>('REDIS_COMMAND_TIMEOUT_MS', 5000),
    maxRetriesPerRequest: configService.get<number>('REDIS_MAX_RETRIES_PER_REQUEST', 3),
  };
}

export function toIORedisOptions(opts: RedisConnectionOptions): IORedisOptions {
  return {
    host: opts.host,
    port: opts.port,
    username: opts.username,
    password: opts.password,
    db: opts.db,
    connectTimeout: opts.connectTimeout,
    commandTimeout: opts.commandTimeout,
    maxRetriesPerRequest: opts.maxRetriesPerRequest,
    ...(opts.tls ? { tls: {} } : {}),
    retryStrategy: () => null,
    lazyConnect: true,
  };
}

export function toBullMQConnectionOptions(opts: RedisConnectionOptions): RedisOptions {
  return {
    host: opts.host,
    port: opts.port,
    username: opts.username,
    password: opts.password,
    db: opts.db,
    connectTimeout: opts.connectTimeout,
    maxRetriesPerRequest: null,
    ...(opts.tls ? { tls: {} } : {}),
  };
}
