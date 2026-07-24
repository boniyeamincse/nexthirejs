import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/auth.guard';
import type { AuthenticatedRequest } from '../../auth/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequireRoles } from '../../../common/decorators/roles.decorator';
import { CompanyProfileService } from '../services/company-profile.service';
import { COMPANY_RATE_LIMITS } from '@nexthire/constants';

const HOUR_MS = 3_600_000;

@ApiTags('Company Profile')
@ApiBearerAuth('access-token')
@Controller({ path: 'companies/me/profile', version: '1' })
@UseGuards(AuthGuard, RolesGuard)
@RequireRoles('candidate')
export class CompanyProfileController {
  constructor(private readonly profileService: CompanyProfileService) {}

  @Get()
  @Throttle({ default: { limit: COMPANY_RATE_LIMITS.PROFILE_UPDATE_PER_HOUR, ttl: HOUR_MS } })
  @ApiOperation({ summary: 'Get the current user company profile' })
  @ApiResponse({ status: 200, description: 'Company profile (or null if not yet created)' })
  async getProfile(@Req() req: AuthenticatedRequest) {
    return this.profileService.getProfile(req.principal.userId);
  }

  @Put()
  @Throttle({ default: { limit: COMPANY_RATE_LIMITS.PROFILE_UPDATE_PER_HOUR, ttl: HOUR_MS } })
  @ApiOperation({ summary: 'Create or update the current user company profile' })
  @ApiResponse({ status: 200, description: 'Persisted company profile' })
  @ApiResponse({ status: 400, description: 'COMPANY_PROFILE_VALIDATION_FAILED' })
  async upsertProfile(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    return this.profileService.upsertProfile(req.principal.userId, body);
  }
}
