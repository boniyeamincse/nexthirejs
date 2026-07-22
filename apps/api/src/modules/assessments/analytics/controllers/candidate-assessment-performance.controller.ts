import {
  Controller,
  Get,
  Put,
  Query,
  Body,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { RequireRoles } from '../../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { AuthGuard } from '../../../auth/auth.guard';
import type { AuthenticatedRequest } from '../../../auth/auth.guard';
import { ASSESSMENT_ERROR_CODES } from '@nexthire/constants';
import { AssessmentPerformanceQuerySchema, UpdateLeaderboardParticipationInputSchema } from '@nexthire/validation';
import { AssessmentPerformanceService } from '../services/assessment-performance.service';
import { LeaderboardParticipationService } from '../services/leaderboard-participation.service';
import type { AssessmentType, AssessmentDifficulty } from '@nexthire/types';

@ApiTags('Assessment Analytics')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RolesGuard)
@RequireRoles('candidate')
@Controller('v1')
export class CandidateAssessmentPerformanceController {
  constructor(
    private readonly performanceService: AssessmentPerformanceService,
    private readonly participationService: LeaderboardParticipationService,
  ) {}

  @Get('candidates/me/assessment-performance')
  @ApiOperation({
    summary: 'Get candidate assessment performance report',
    description: 'Returns summary, trend, and breakdowns for the authenticated candidate.',
  })
  @ApiQuery({ name: 'dateFrom', required: false, type: String })
  @ApiQuery({ name: 'dateTo', required: false, type: String })
  @ApiQuery({ name: 'assessmentType', required: false, enum: ['PRACTICE', 'CERTIFICATION', 'SCREENING', 'SKILL_CHECK'] })
  @ApiQuery({ name: 'difficulty', required: false, enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'] })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Performance report.' })
  @ApiResponse({ status: 400, description: 'Invalid query.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async getReport(
    @Req() req: AuthenticatedRequest,
    @Query() query: Record<string, unknown>,
  ) {
    const parsed = AssessmentPerformanceQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new BadRequestException(ASSESSMENT_ERROR_CODES.ASSESSMENT_PERFORMANCE_QUERY_INVALID);
    }
    const performanceQuery = {
      ...parsed.data,
      assessmentType: parsed.data.assessmentType as AssessmentType | undefined,
      difficulty: parsed.data.difficulty as AssessmentDifficulty | undefined,
    };
    return this.performanceService.getReport(req.principal.userId, performanceQuery);
  }

  @Get('candidates/me/leaderboard-settings')
  @ApiOperation({ summary: 'Get leaderboard participation settings' })
  @ApiResponse({ status: 200, description: 'Settings.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async getSettings(@Req() req: AuthenticatedRequest) {
    return this.participationService.getSettings(req.principal.userId);
  }

  @Put('candidates/me/leaderboard-settings')
  @ApiOperation({ summary: 'Update leaderboard participation settings' })
  @ApiResponse({ status: 200, description: 'Updated settings.' })
  @ApiResponse({ status: 400, description: 'Validation failed.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @Throttle({ default: { limit: 10, ttl: 900000 } }) // 10 per 15 min
  async updateSettings(
    @Req() req: AuthenticatedRequest,
    @Body() body: Record<string, unknown>,
  ) {
    const parsed = UpdateLeaderboardParticipationInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(ASSESSMENT_ERROR_CODES.LEADERBOARD_SETTINGS_VALIDATION_FAILED);
    }
    return this.participationService.updateSettings(req.principal.userId, parsed.data);
  }
}
