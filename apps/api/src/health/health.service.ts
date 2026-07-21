import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../infrastructure/redis/redis.service';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  getHealth(): { status: string; service: string; version: string } {
    return {
      status: 'ok',
      service: 'nexthire-api',
      version: '1.0',
    };
  }

  async getReadiness(): Promise<{
    status: string;
    service: string;
    checks: {
      database: string;
      redis: string;
    };
  }> {
    const timeoutMs = this.configService.get<number>(
      'DATABASE_HEALTH_TIMEOUT_MS',
      5000,
    );
    const errors: string[] = [];

    try {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Database health check timed out')),
          timeoutMs,
        ),
      );

      const check = this.prismaService.checkConnection();

      await Promise.race([check, timeout]);
    } catch (error) {
      this.logger.error(
        `Database readiness check failed: ${(error as Error).message}`,
      );
      errors.push('database');
    }

    try {
      await this.redisService.ping();
    } catch (error) {
      this.logger.error(
        `Redis readiness check failed: ${(error as Error).message}`,
      );
      errors.push('redis');
    }

    if (errors.length > 0) {
      throw new ServiceUnavailableException(
        `Service is not ready: ${errors.join(', ')}`,
      );
    }

    return {
      status: 'ok',
      service: 'nexthire-api',
      checks: {
        database: 'up',
        redis: 'up',
      },
    };
  }
}
