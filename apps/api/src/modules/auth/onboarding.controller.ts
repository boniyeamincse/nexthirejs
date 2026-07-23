import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { OnboardingService, OnboardingStepResult } from './onboarding.service';
import { AuthGuard } from './auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { AuthenticatedPrincipal } from './interfaces/authenticated-principal.interface';
import { SetupCountryDto } from './dto/setup-country.dto';
import { SetupLanguageDto } from './dto/setup-language.dto';
import { SetupCareerGoalDto } from './dto/setup-career-goal.dto';

@ApiTags('Auth - Onboarding')
@Controller('auth/onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get('career-goals')
  @ApiOperation({ summary: 'Get list of available career goals' })
  @ApiResponse({ status: 200, description: 'Career goals retrieved successfully' })
  async getCareerGoals(): Promise<any[]> {
    return this.onboardingService.getCareerGoals();
  }

  @Post('country')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set up country preference' })
  @ApiResponse({ status: 200, description: 'Country preference set' })
  async setupCountry(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Body() dto: SetupCountryDto,
  ): Promise<OnboardingStepResult> {
    return this.onboardingService.setupCountry(user.userId, dto);
  }

  @Post('languages')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set up preferred languages' })
  @ApiResponse({ status: 200, description: 'Languages set up' })
  async setupLanguages(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Body() dto: SetupLanguageDto,
  ): Promise<OnboardingStepResult> {
    return this.onboardingService.setupLanguages(user.userId, dto);
  }

  @Post('career-goal')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set up career goal' })
  @ApiResponse({ status: 200, description: 'Career goal set' })
  async setupCareerGoal(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Body() dto: SetupCareerGoalDto,
  ): Promise<OnboardingStepResult> {
    return this.onboardingService.setupCareerGoal(user.userId, dto);
  }

  @Post('complete')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Complete onboarding and activate account' })
  @ApiResponse({ status: 200, description: 'Onboarding completed' })
  async completeOnboarding(
    @CurrentUser() user: AuthenticatedPrincipal,
  ): Promise<OnboardingStepResult> {
    return this.onboardingService.completeOnboarding(user.userId);
  }
}
