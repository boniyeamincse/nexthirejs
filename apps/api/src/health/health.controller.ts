import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../modules/auth/decorators/public.decorator';
import { HealthService } from './health.service';

@Controller('health')
@Public()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Returns the liveness status of the API' })
  @ApiResponse({ status: 200, description: 'API liveness information' })
  getHealth(): { status: string; service: string; version: string } {
    return this.healthService.getHealth();
  }

  @Get('ready')
  @ApiOperation({
    summary: 'Returns the readiness status including database and Redis',
  })
  @ApiResponse({
    status: 200,
    description: 'API is ready and all dependencies are up',
  })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  getReadiness(): Promise<{
    status: string;
    service: string;
    checks: {
      database: string;
      redis: string;
    };
  }> {
    return this.healthService.getReadiness();
  }
}
