import {
  Controller,
  Post,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { TrainerService } from './trainer.service';
import type { CreateTrainerProfileDto, TrainerProfileResponse } from './trainer.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';

export interface CreateServiceDto {
  name: string;
  category: string;
  basePrice: number;
  description?: string;
}

@ApiTags('Trainer Marketplace')
@Controller('trainers')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class TrainerController {
  constructor(private readonly trainerService: TrainerService) {}

  @Post('profile')
  @ApiOperation({ summary: 'Create trainer profile' })
  @ApiResponse({ status: 201, description: 'Profile created' })
  async createProfile(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Body() dto: CreateTrainerProfileDto,
  ): Promise<TrainerProfileResponse> {
    return this.trainerService.createTrainerProfile(user.userId, dto);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get trainer profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved' })
  async getProfile(@CurrentUser() user: AuthenticatedPrincipal): Promise<any> {
    return this.trainerService.getTrainerProfile(user.userId);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update trainer profile' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  async updateProfile(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Body() dto: Partial<CreateTrainerProfileDto>,
  ): Promise<TrainerProfileResponse> {
    return this.trainerService.updateTrainerProfile(user.userId, dto);
  }

  @Post('services')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create service' })
  @ApiResponse({ status: 201, description: 'Service created' })
  async createService(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Body() dto: CreateServiceDto,
  ): Promise<void> {
    return this.trainerService.createService(
      user.userId,
      dto.name,
      dto.category,
      dto.basePrice,
      dto.description,
    );
  }
}
