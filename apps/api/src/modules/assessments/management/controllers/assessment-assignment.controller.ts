import { Controller, Post, Put, Delete, Param, Body, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { RequireRoles } from '../../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { AssessmentAssignmentService } from '../services/assessment-assignment.service';
import type { AssignAssessmentQuestionsInput, UpdateAssessmentQuestionAssignmentInput, ReorderAssessmentSectionQuestionsInput } from '@nexthire/types';

@Controller('v1/manage/assessments/:assessmentId')
@UseGuards(RolesGuard)
@RequireRoles('assessment_manager')
export class AssessmentAssignmentController {
  constructor(private readonly assignmentService: AssessmentAssignmentService) {}

  @Post('questions/assign')
  @HttpCode(HttpStatus.NO_CONTENT)
  async assignQuestions(
    @Req() req: any,
    @Param('assessmentId') assessmentId: string,
    @Body() input: AssignAssessmentQuestionsInput,
  ) {
    const userId = req.principal.userId;
    const requestId = req.requestId;
    await this.assignmentService.assignQuestions(userId, requestId, assessmentId, input);
  }

  @Put('questions/:assignmentId')
  async updateAssignment(
    @Req() req: any,
    @Param('assessmentId') assessmentId: string,
    @Param('assignmentId') assignmentId: string,
    @Body() input: UpdateAssessmentQuestionAssignmentInput,
  ) {
    const userId = req.principal.userId;
    const requestId = req.requestId;
    return this.assignmentService.updateAssignment(userId, requestId, assessmentId, assignmentId, input);
  }

  @Delete('questions/:assignmentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAssignment(
    @Req() req: any,
    @Param('assessmentId') assessmentId: string,
    @Param('assignmentId') assignmentId: string,
  ) {
    const userId = req.principal.userId;
    const requestId = req.requestId;
    await this.assignmentService.removeAssignment(userId, requestId, assessmentId, assignmentId);
  }

  @Put('sections/:sectionId/questions/reorder')
  @HttpCode(HttpStatus.NO_CONTENT)
  async reorderSectionQuestions(
    @Req() req: any,
    @Param('assessmentId') assessmentId: string,
    @Param('sectionId') sectionId: string,
    @Body() input: ReorderAssessmentSectionQuestionsInput,
  ) {
    const userId = req.principal.userId;
    const requestId = req.requestId;
    await this.assignmentService.reorderSectionQuestions(userId, requestId, assessmentId, sectionId, input.orderedIds);
  }
}
