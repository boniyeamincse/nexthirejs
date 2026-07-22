import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { RequireRoles } from '../../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { AuthGuard } from '../../../auth/auth.guard';
import type { AuthenticatedRequest } from '../../../auth/auth.guard';
import { AssessmentAttemptStartService } from '../services/assessment-attempt-start.service';
import { AssessmentAttemptWorkspaceService } from '../services/assessment-attempt-workspace.service';
import { AssessmentAttemptAnswerService } from '../services/assessment-attempt-answer.service';
import type {
  SaveAssessmentDraftAnswerInput,
  SubmitAssessmentAttemptInput,
} from '@nexthire/types';
import { AssessmentAttemptSubmissionService } from '../services/assessment-attempt-submission.service';

@ApiTags('Assessment Attempts')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RolesGuard)
@RequireRoles('candidate')
@Controller('v1')
export class CandidateAssessmentAttemptController {
  constructor(
    private readonly startService: AssessmentAttemptStartService,
    private readonly workspaceService: AssessmentAttemptWorkspaceService,
    private readonly answerService: AssessmentAttemptAnswerService,
    private readonly submissionService: AssessmentAttemptSubmissionService,
  ) {}

  @Post('assessments/:assessmentIdOrSlug/attempts')
  @ApiOperation({ summary: 'Start or resume an assessment attempt' })
  @ApiResponse({ status: 200, description: 'Attempt created or resumed.' })
  @HttpCode(HttpStatus.OK)
  async startOrResumeAttempt(
    @Req() req: AuthenticatedRequest,
    @Param('assessmentIdOrSlug') assessmentIdOrSlug: string,
  ) {
    const userId = req.principal.userId;
    return this.startService.startOrResumeAttempt(userId, assessmentIdOrSlug);
  }

  @Get('assessments/:assessmentIdOrSlug/attempts/active')
  @ApiOperation({ summary: 'Get active attempt for an assessment' })
  @ApiResponse({ status: 200, description: 'Returns attempt ID if active.' })
  async getActiveAttempt(
    @Req() req: AuthenticatedRequest,
    @Param('assessmentIdOrSlug') assessmentIdOrSlug: string,
  ) {
    const userId = req.principal.userId;
    const result = await this.startService.getActiveAttempt(userId, assessmentIdOrSlug);
    if (!result) {
      return null;
    }
    return result;
  }

  @Get('assessment-attempts/:attemptId')
  @ApiOperation({ summary: 'Get attempt workspace' })
  @ApiResponse({ status: 200, description: 'Returns candidate-safe workspace.' })
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async getAttemptWorkspace(
    @Req() req: AuthenticatedRequest,
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
  ) {
    const userId = req.principal.userId;
    return this.workspaceService.getWorkspace(userId, attemptId);
  }

  @Put('assessment-attempts/:attemptId/questions/:questionId/answer')
  @ApiOperation({ summary: 'Save draft answer' })
  @ApiResponse({ status: 200, description: 'Draft answer saved.' })
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  async saveDraftAnswer(
    @Req() req: AuthenticatedRequest,
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
    @Param('questionId', ParseUUIDPipe) questionId: string,
    @Body() input: SaveAssessmentDraftAnswerInput,
  ) {
    const userId = req.principal.userId;
    return this.answerService.saveDraftAnswer(userId, attemptId, questionId, input);
  }

  @Delete('assessment-attempts/:attemptId/questions/:questionId/answer')
  @ApiOperation({ summary: 'Clear draft answer' })
  @ApiResponse({ status: 204, description: 'Draft answer cleared.' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  async clearDraftAnswer(
    @Req() req: AuthenticatedRequest,
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
    @Param('questionId', ParseUUIDPipe) questionId: string,
  ) {
    const userId = req.principal.userId;
    return this.answerService.clearDraftAnswer(userId, attemptId, questionId);
  }

  @Post('assessment-attempts/:attemptId/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Submit an in-progress assessment attempt and return the safe scoring summary. Overdue attempts finalize with the deadline policy.',
  })
  @ApiResponse({ status: 200, description: 'Attempt finalized and scored.' })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async submitAttempt(
    @Req() req: AuthenticatedRequest,
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
    @Body() input: SubmitAssessmentAttemptInput,
  ) {
    const userId = req.principal.userId;
    return this.submissionService.submitAttempt(userId, attemptId, input);
  }

  @Get('assessment-attempts/:attemptId/submission-summary')
  @ApiOperation({
    summary:
      'Get the safe final submission summary for a finalized attempt. Sensitive answer keys are excluded.',
  })
  @ApiResponse({ status: 200, description: 'Safe submission summary for the attempt owner.' })
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async getSubmissionSummary(
    @Req() req: AuthenticatedRequest,
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
  ) {
    const userId = req.principal.userId;
    return this.submissionService.getSubmissionSummary(userId, attemptId);
  }
}
