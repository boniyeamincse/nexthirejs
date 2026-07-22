import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/auth.guard';
import type { AuthenticatedRequest } from '../../auth/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequireRoles } from '../../../common/decorators/roles.decorator';
import { ExpertProfileService } from '../services/expert-profile.service';
import { EXPERT_RATE_LIMITS } from '@nexthire/constants';

const HOUR_MS = 3_600_000;

@ApiTags('Expert Profile')
@ApiBearerAuth('access-token')
@Controller('v1/experts/me/profile')
@UseGuards(AuthGuard, RolesGuard)
@RequireRoles('candidate')
export class ExpertProfileController {
  constructor(private readonly profileService: ExpertProfileService) {}

  @Get()
  @Throttle({ default: { limit: EXPERT_RATE_LIMITS.PROFILE_UPDATE_PER_HOUR, ttl: HOUR_MS } })
  @ApiOperation({ summary: 'Get the current user expert profile' })
  @ApiResponse({ status: 200, description: 'Expert profile (or null if not yet created)' })
  async getProfile(@Req() req: AuthenticatedRequest) {
    return this.profileService.getProfile(req.principal.userId);
  }

  @Put()
  @Throttle({ default: { limit: EXPERT_RATE_LIMITS.PROFILE_UPDATE_PER_HOUR, ttl: HOUR_MS } })
  @ApiOperation({ summary: 'Create or update the current user expert profile' })
  @ApiResponse({ status: 200, description: 'Persisted expert profile' })
  @ApiResponse({ status: 400, description: 'EXPERT_PROFILE_VALIDATION_FAILED' })
  async upsertProfile(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    return this.profileService.upsertProfile(req.principal.userId, body);
  }
}
