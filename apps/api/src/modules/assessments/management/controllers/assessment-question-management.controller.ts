import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AssessmentQuestionManagementService } from '../services/assessment-question-management.service';
import type { CreateAssessmentQuestionInput, UpdateAssessmentQuestionInput, AssessmentQuestionListQuery } from '@nexthire/types';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { RequireRoles } from '../../../../common/decorators/roles.decorator';
import type { AuthenticatedRequest } from '../../../auth/auth.guard';

@ApiTags('Assessment Management - Questions')
@Controller('v1/manage/assessments/questions')
@UseGuards(RolesGuard)
@RequireRoles('assessment_manager')
@ApiBearerAuth()
export class AssessmentQuestionManagementController {
  constructor(private readonly questionService: AssessmentQuestionManagementService) {}

  @Get()
  @ApiOperation({ summary: 'List all assessment questions' })
  @ApiResponse({ status: 200, description: 'List of questions' })
  async listQuestions(
    @Query() query: AssessmentQuestionListQuery,
  ) {
    return this.questionService.listQuestions(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new assessment question' })
  @ApiResponse({ status: 201, description: 'Question created' })
  async createQuestion(
    @Body() input: CreateAssessmentQuestionInput,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.questionService.createQuestion(input, req.principal.userId);
  }

  @Get(':questionId')
  @ApiOperation({ summary: 'Get assessment question details' })
  @ApiResponse({ status: 200, description: 'Question details' })
  async getQuestion(@Param('questionId') questionId: string) {
    return this.questionService.getQuestion(questionId);
  }

  @Put(':questionId')
  @ApiOperation({ summary: 'Update an assessment question' })
  @ApiResponse({ status: 200, description: 'Question updated' })
  async updateQuestion(
    @Param('questionId') questionId: string,
    @Body() input: UpdateAssessmentQuestionInput,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.questionService.updateQuestion(questionId, input, req.principal.userId);
  }

  @Post(':questionId/archive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive an assessment question' })
  @ApiResponse({ status: 200, description: 'Question archived' })
  async archiveQuestion(
    @Param('questionId') questionId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.questionService.archiveQuestion(questionId, req.principal.userId);
  }

  @Post(':questionId/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore an archived assessment question' })
  @ApiResponse({ status: 200, description: 'Question restored' })
  async restoreQuestion(
    @Param('questionId') questionId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.questionService.restoreQuestion(questionId, req.principal.userId);
  }
}
