import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../../modules/auth/auth.guard';
import type { AuthenticatedRequest } from '../../../modules/auth/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequireRoles } from '../../../common/decorators/roles.decorator';
import { ExpertSessionEvaluationService } from './expert-session-evaluation.service';
import { ExpertReviewService } from './expert-review.service';
import { createExpertReviewSchema } from '@nexthire/validation';
import { EXPERT_FEEDBACK_ERROR_CODES, EXPERT_FEEDBACK_RATE_LIMITS } from '@nexthire/constants';

const HOUR_MS = 3_600_000;

@ApiTags('Expert Feedback (Candidate)')
@ApiBearerAuth('access-token')
@Controller({ path: 'candidates/me/bookings/:bookingId', version: '1' })
@UseGuards(AuthGuard, RolesGuard)
@RequireRoles('candidate')
export class ExpertFeedbackCandidateController {
  constructor(
    private readonly evaluationService: ExpertSessionEvaluationService,
    private readonly reviewService: ExpertReviewService,
  ) {}

  @Get('evaluation')
  @ApiOperation({ summary: "Get the expert's evaluation of my session performance, if submitted" })
  @ApiResponse({ status: 200, description: 'Evaluation, or null if not yet submitted' })
  async getEvaluation(@Req() req: AuthenticatedRequest, @Param('bookingId') bookingId: string) {
    return this.evaluationService.getForCandidate(req.principal.userId, bookingId);
  }

  @Get('review')
  @ApiOperation({ summary: 'Get my own review of this booking, if submitted' })
  @ApiResponse({ status: 200, description: 'Review, or null if not yet submitted' })
  async getReview(@Req() req: AuthenticatedRequest, @Param('bookingId') bookingId: string) {
    return this.reviewService.getForCandidate(req.principal.userId, bookingId);
  }

  @Post('review')
  @Throttle({
    default: { limit: EXPERT_FEEDBACK_RATE_LIMITS.REVIEW_SUBMIT_PER_HOUR, ttl: HOUR_MS },
  })
  @ApiOperation({ summary: 'Submit a review of the expert for a completed booking' })
  @ApiResponse({ status: 201, description: 'Review submitted' })
  async createReview(
    @Req() req: AuthenticatedRequest,
    @Param('bookingId') bookingId: string,
    @Body() body: unknown,
  ) {
    const parsed = createExpertReviewSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        code: EXPERT_FEEDBACK_ERROR_CODES.VALIDATION_FAILED,
        details: parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      });
    }
    return this.reviewService.createForCandidate(req.principal.userId, bookingId, parsed.data);
  }
}
