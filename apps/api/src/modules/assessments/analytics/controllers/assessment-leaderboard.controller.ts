import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Req,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { RequireRoles } from '../../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { AuthGuard } from '../../../auth/auth.guard';
import type { AuthenticatedRequest } from '../../../auth/auth.guard';
import { AssessmentLeaderboardQuerySchema, CategoryLeaderboardQuerySchema } from '@nexthire/validation';
import { AssessmentLeaderboardService } from '../services/assessment-leaderboard.service';
import { CategoryLeaderboardService } from '../services/category-leaderboard.service';

@ApiTags('Assessment Leaderboards')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RolesGuard)
@RequireRoles('candidate')
@Controller('v1')
export class AssessmentLeaderboardController {
  constructor(
    private readonly assessmentLeaderboardService: AssessmentLeaderboardService,
    private readonly categoryLeaderboardService: CategoryLeaderboardService,
  ) {}

  @Get('assessment-leaderboards/assessments/:assessmentIdOrSlug')
  @ApiOperation({
    summary: 'Get assessment-specific leaderboard',
    description: 'Returns ranked opted-in candidates with their best attempt for the assessment.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Leaderboard.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Assessment not found.' })
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async getAssessmentLeaderboard(
    @Req() req: AuthenticatedRequest,
    @Param('assessmentIdOrSlug') assessmentIdOrSlug: string,
    @Query() query: Record<string, unknown>,
  ) {
    const parsed = AssessmentLeaderboardQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new BadRequestException('ASSESSMENT_LEADERBOARD_QUERY_INVALID');
    }
    return this.assessmentLeaderboardService.getLeaderboard(
      assessmentIdOrSlug,
      req.principal.userId,
      parsed.data,
    );
  }

  @Get('assessment-leaderboards/categories/:categoryIdOrSlug')
  @ApiOperation({
    summary: 'Get category leaderboard',
    description: 'Returns ranked opted-in candidates by aggregate performance across assessments in a category.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Category leaderboard.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async getCategoryLeaderboard(
    @Req() req: AuthenticatedRequest,
    @Param('categoryIdOrSlug') categoryIdOrSlug: string,
    @Query() query: Record<string, unknown>,
  ) {
    const parsed = CategoryLeaderboardQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new BadRequestException('CATEGORY_LEADERBOARD_QUERY_INVALID');
    }
    return this.categoryLeaderboardService.getLeaderboard(
      categoryIdOrSlug,
      req.principal.userId,
      parsed.data,
    );
  }
}
