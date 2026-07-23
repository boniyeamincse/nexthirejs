import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { CareerPassportService } from './career-passport.service';
import { AuthGuard } from '../auth/auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';

export interface AddSectionDto {
  type: string;
  title: string;
  content?: any;
}

@ApiTags('Career Passport')
@Controller('passport')
export class CareerPassportController {
  constructor(private readonly passportService: CareerPassportService) {}

  @Post('initialize')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Initialize career passport' })
  @ApiResponse({ status: 201, description: 'Passport initialized' })
  async initialize(@CurrentUser() user: AuthenticatedPrincipal): Promise<any> {
    return this.passportService.initializePassport(user.userId);
  }

  @Get('mine')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get own passport' })
  @ApiResponse({ status: 200, description: 'Passport retrieved' })
  async getOwnPassport(@CurrentUser() user: AuthenticatedPrincipal): Promise<any> {
    return this.passportService.getPassport(user.userId);
  }

  @Get('mine/stats')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get passport stats' })
  @ApiResponse({ status: 200, description: 'Stats retrieved' })
  async getStats(@CurrentUser() user: AuthenticatedPrincipal): Promise<any> {
    return this.passportService.getPassportStats(user.userId);
  }

  @Get('mine/profile')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get aggregated profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved' })
  async getProfile(@CurrentUser() user: AuthenticatedPrincipal): Promise<any> {
    return this.passportService.aggregateProfile(user.userId);
  }

  @Post('mine/publish')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish passport publicly' })
  @ApiResponse({ status: 200, description: 'Passport published' })
  async publish(@CurrentUser() user: AuthenticatedPrincipal): Promise<any> {
    return this.passportService.publishPassport(user.userId);
  }

  @Post('mine/sections')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add passport section' })
  @ApiResponse({ status: 201, description: 'Section added' })
  async addSection(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Body() dto: AddSectionDto,
  ): Promise<any> {
    return this.passportService.addSection(user.userId, dto.type, dto.title, dto.content);
  }

  @Get('public/:userId')
  @Public()
  @ApiOperation({ summary: 'Get public passport' })
  @ApiResponse({ status: 200, description: 'Passport retrieved' })
  async getPublicPassport(@Param('userId') userId: string): Promise<any> {
    return this.passportService.getPassport(userId, true);
  }

  @Post('public/:passportId/view')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Record passport view' })
  @ApiResponse({ status: 204, description: 'View recorded' })
  async recordView(
    @Param('passportId') passportId: string,
    @Query('ip') ip?: string,
  ): Promise<void> {
    return this.passportService.recordView(passportId, ip);
  }
}
