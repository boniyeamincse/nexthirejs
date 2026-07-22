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
import { RequireRoles } from '../../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { AuthGuard } from '../../../auth/auth.guard';
import type { AuthenticatedRequest } from '../../../auth/auth.guard';
import { AssessmentAttemptStartService } from '../services/assessment-attempt-start.service';
import { AssessmentAttemptWorkspaceService } from '../services/assessment-attempt-workspace.service';
import { AssessmentAttemptAnswerService } from '../services/assessment-attempt-answer.service';
import type { SaveAssessmentDraftAnswerInput } from '@nexthire/types';

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
  async clearDraftAnswer(
    @Req() req: AuthenticatedRequest,
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
    @Param('questionId', ParseUUIDPipe) questionId: string,
  ) {
    const userId = req.principal.userId;
    return this.answerService.clearDraftAnswer(userId, attemptId, questionId);
  }
}
