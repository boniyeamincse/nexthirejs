import { Controller, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CandidatePreferencesService } from '../services/candidate-preferences.service';
import { AuthGuard } from '../../auth/auth.guard';
import type { AuthenticatedRequest } from '../../auth/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequireRoles } from '../../../common/decorators/roles.decorator';

@ApiTags('Candidate Preferences')
@Controller({
  path: 'candidates/me/preferences',
  version: '1',
})
@UseGuards(AuthGuard, RolesGuard)
@RequireRoles('candidate')
@ApiBearerAuth()
export class CandidatePreferencesController {
  constructor(private readonly preferencesService: CandidatePreferencesService) {}

  @Get()
  @ApiOperation({ summary: 'Get current candidate preferences' })
  @ApiResponse({ status: 200, description: 'Preferences fetched successfully' })
  async getPreferences(@Req() req: AuthenticatedRequest) {
    return this.preferencesService.getPreferences(req.principal.userId);
  }

  @Put()
  @ApiOperation({ summary: 'Create or update candidate preferences' })
  @ApiResponse({ status: 200, description: 'Preferences updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed or unsupported country' })
  async upsertPreferences(@Req() req: AuthenticatedRequest, @Body() data: any) {
    return this.preferencesService.upsertPreferences(req.principal.userId, data);
  }
}
