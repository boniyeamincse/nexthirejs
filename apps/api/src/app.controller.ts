import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

interface ApiRootData {
  name: string;
  version: string;
  status: 'running';
}

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Returns API root information' })
  @ApiResponse({ status: 200, description: 'API root information' })
  getRoot(): ApiRootData {
    return this.appService.getRoot();
  }
}
