import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { DatabaseReadiness } from './database.types';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(private readonly configService: ConfigService) {
    const connectionString = configService.get<string>('DATABASE_URL');

    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    const adapter = new PrismaPg(connectionString);
    super({ adapter });
  }

  async checkConnection(): Promise<DatabaseReadiness> {
    await this.$queryRawUnsafe('SELECT 1');
    return { status: 'up' };
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
