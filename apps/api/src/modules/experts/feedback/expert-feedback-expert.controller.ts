import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../../modules/auth/auth.guard';
import type { AuthenticatedRequest } from '../../../modules/auth/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequireRoles } from '../../../common/decorators/roles.decorator';
import { ExpertEligibilityGuard } from '../shared/expert-eligibility.guard';
import { ExpertSessionEvaluationService } from './expert-session-evaluation.service';
import { ExpertReviewService } from './expert-review.service';
import {
  createExpertSessionEvaluationSchema,
  expertReviewListQuerySchema,
} from '@nexthire/validation';
import { EXPERT_FEEDBACK_ERROR_CODES, EXPERT_FEEDBACK_RATE_LIMITS } from '@nexthire/constants';

const HOUR_MS = 3_600_000;

@ApiTags('Expert Feedback (Expert)')
@ApiBearerAuth('access-token')
@Controller('expert/bookings/:bookingId')
@UseGuards(AuthGuard, RolesGuard, ExpertEligibilityGuard)
@RequireRoles('expert')
export class ExpertFeedbackExpertBookingController {
  constructor(
    private readonly evaluationService: ExpertSessionEvaluationService,
    private readonly reviewService: ExpertReviewService,
  ) {}

  @Get('evaluation')
  @ApiOperation({ summary: 'Get my submitted evaluation of the candidate for this booking' })
  @ApiResponse({ status: 200, description: 'Evaluation, or null if not yet submitted' })
  async getEvaluation(@Req() req: AuthenticatedRequest, @Param('bookingId') bookingId: string) {
    return this.evaluationService.getForExpert(req.principal.userId, bookingId);
  }

  @Post('evaluation')
  @Throttle({
    default: { limit: EXPERT_FEEDBACK_RATE_LIMITS.EVALUATION_SUBMIT_PER_HOUR, ttl: HOUR_MS },
  })
  @ApiOperation({ summary: "Submit an evaluation of the candidate's session performance" })
  @ApiResponse({ status: 201, description: 'Evaluation submitted' })
  async createEvaluation(
    @Req() req: AuthenticatedRequest,
    @Param('bookingId') bookingId: string,
    @Body() body: unknown,
  ) {
    const parsed = createExpertSessionEvaluationSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        code: EXPERT_FEEDBACK_ERROR_CODES.VALIDATION_FAILED,
        details: parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      });
    }
    return this.evaluationService.createForExpert(req.principal.userId, bookingId, parsed.data);
  }

  @Get('review')
  @ApiOperation({ summary: "Get the candidate's review of me for this booking, if submitted" })
  @ApiResponse({ status: 200, description: 'Review, or null if not yet submitted' })
  async getReview(@Req() req: AuthenticatedRequest, @Param('bookingId') bookingId: string) {
    return this.reviewService.getForExpert(req.principal.userId, bookingId);
  }
}

@ApiTags('Expert Feedback (Expert)')
@ApiBearerAuth('access-token')
@Controller('expert/reviews')
@UseGuards(AuthGuard, RolesGuard, ExpertEligibilityGuard)
@RequireRoles('expert')
export class ExpertReviewsController {
  constructor(private readonly reviewService: ExpertReviewService) {}

  @Get()
  @ApiOperation({ summary: 'List reviews I have received, with my aggregate rating' })
  @ApiResponse({ status: 200, description: 'Paginated reviews plus aggregate rating' })
  async list(@Req() req: AuthenticatedRequest, @Query() query: unknown) {
    const parsed = expertReviewListQuerySchema.safeParse(query ?? {});
    if (!parsed.success) {
      throw new BadRequestException({
        code: EXPERT_FEEDBACK_ERROR_CODES.VALIDATION_FAILED,
        details: parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      });
    }
    return this.reviewService.listForExpertOwner(req.principal.userId, parsed.data);
  }
}
