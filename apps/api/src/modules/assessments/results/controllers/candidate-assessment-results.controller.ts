import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
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
import { AssessmentResultHistoryService, HistoryQueryParams } from '../services/assessment-result-history.service';
import { AssessmentResultDetailService } from '../services/assessment-result-detail.service';
import { AssessmentResultHistoryQuerySchema } from '@nexthire/validation';

@ApiTags('Assessment Results')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RolesGuard)
@RequireRoles('candidate')
@Controller('v1')
export class CandidateAssessmentResultsController {
  constructor(
    private readonly historyService: AssessmentResultHistoryService,
    private readonly detailService: AssessmentResultDetailService,
  ) {}

  @Get('candidates/me/assessment-results')
  @ApiOperation({
    summary: 'List candidate-owned finalized assessment attempts with filters and pagination',
    description: 'Returns only finalized and scored attempts belonging to the authenticated candidate.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (min: 1)' })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, description: 'Items per page (max: 50)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search in title/slug' })
  @ApiQuery({ name: 'resultStatus', required: false, enum: ['PASSED', 'FAILED'] })
  @ApiQuery({ name: 'finalizationReason', required: false, enum: ['CANDIDATE_SUBMITTED', 'DEADLINE_REACHED'] })
  @ApiQuery({ name: 'assessmentType', required: false, enum: ['PRACTICE', 'CERTIFICATION', 'SCREENING', 'SKILL_CHECK'] })
  @ApiQuery({ name: 'difficulty', required: false, enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'] })
  @ApiQuery({ name: 'dateFrom', required: false, type: String, description: 'ISO date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'dateTo', required: false, type: String, description: 'ISO date (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Paginated attempt history.' })
  @ApiResponse({ status: 400, description: 'Invalid query parameters.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async listHistory(
    @Req() req: AuthenticatedRequest,
    @Query() query: Record<string, unknown>,
  ) {
    const parsed = AssessmentResultHistoryQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new BadRequestException(ASSESSMENT_ERROR_CODES.ASSESSMENT_RESULT_QUERY_INVALID);
    }

    const userId = req.principal.userId;
    return this.historyService.listHistory(userId, parsed.data as HistoryQueryParams);
  }

  @Get('assessment-results/:attemptId')
  @ApiOperation({
    summary: 'Get detailed result review for a finalized attempt',
    description: 'Returns score, per-section summaries, per-question review with candidate answer, correct answer, and explanation.',
  })
  @ApiResponse({ status: 200, description: 'Detailed result review.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Result not found.' })
  @ApiResponse({ status: 409, description: 'Result not finalized or inconsistent.' })
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async getDetail(
    @Req() req: AuthenticatedRequest,
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
  ) {
    const userId = req.principal.userId;
    return this.detailService.getDetail(userId, attemptId);
  }
}
