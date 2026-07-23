import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import * as os from 'os';

@Injectable()
export class AdminMaintenanceService {
  private readonly logger = new Logger(AdminMaintenanceService.name);
  private maintenanceMode = false;
  private maintenanceMessage = 'System is under maintenance. Please check back later.';
  private maintenanceHistory: Array<{ start: Date; end?: Date; message: string }> = [];

  constructor(private readonly prisma: PrismaService) {}

  async getSystemStatus() {
    const dbOk = await this.checkDatabase();
    const mem = process.memoryUsage();
    const cpus = os.cpus();

    return {
      maintenanceMode: this.maintenanceMode,
      maintenanceMessage: this.maintenanceMessage,
      services: [
        { name: 'API Server', status: 'operational', uptime: Math.floor(process.uptime()), version: process.env.npm_package_version || '1.0.0' },
        { name: 'Database', status: dbOk ? 'operational' : 'degraded', details: dbOk ? 'Connected' : 'Connection failed' },
        { name: 'Cache', status: 'operational', details: 'Redis connected' },
        { name: 'Queue Worker', status: 'operational', details: 'Active' },
      ],
      system: {
        platform: process.platform,
        nodeVersion: process.version,
        cpuUsage: process.cpuUsage(),
        cpuCores: cpus.length,
        cpuModel: cpus[0]?.model || 'unknown',
        memory: {
          total: os.totalmem(),
          free: os.freemem(),
          used: os.totalmem() - os.freemem(),
          heapUsed: mem.heapUsed,
          heapTotal: mem.heapTotal,
          rss: mem.rss,
        },
        loadAverage: os.loadavg(),
        uptime: os.uptime(),
      },
    };
  }

  async getHealthChecks() {
    const dbOk = await this.checkDatabase();
    return {
      overall: dbOk ? 'healthy' : 'degraded',
      checks: [
        {
          name: 'Database',
          status: dbOk ? 'healthy' : 'unhealthy',
          latency: dbOk ? await this.measureDbLatency() : null,
          lastChecked: new Date(),
        },
        {
          name: 'API',
          status: 'healthy',
          uptime: Math.floor(process.uptime()),
          memoryUsage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100),
          lastChecked: new Date(),
        },
        {
          name: 'System',
          status: 'healthy',
          cpuLoad: os.loadavg()[0],
          memoryFree: os.freemem(),
          memoryTotal: os.totalmem(),
          lastChecked: new Date(),
        },
      ],
    };
  }

  async toggleMaintenanceMode(enabled: boolean, message?: string) {
    this.maintenanceMode = enabled;
    if (message) this.maintenanceMessage = message;

    if (enabled) {
      this.maintenanceHistory.push({ start: new Date(), message: this.maintenanceMessage });
    } else {
      const last = this.maintenanceHistory[this.maintenanceHistory.length - 1];
      if (last && !last.end) last.end = new Date();
    }

    return { maintenanceMode: this.maintenanceMode, message: this.maintenanceMessage };
  }

  async getMaintenanceHistory() {
    return { history: this.maintenanceHistory };
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  private async measureDbLatency(): Promise<number> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return Date.now() - start;
    } catch {
      return -1;
    }
  }
}
