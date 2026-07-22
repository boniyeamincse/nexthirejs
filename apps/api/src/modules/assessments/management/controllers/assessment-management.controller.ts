import { Controller, Get, Post, Put, Param, Body, UseGuards, Req } from '@nestjs/common';
import { RequireRoles } from '../../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { AssessmentAuthoringService } from '../services/assessment-authoring.service';
import { AssessmentPublicationService, AssessmentReadinessService } from '../services/assessment-publication.service';
import type { CreateAssessmentInput, UpdateAssessmentInput } from '@nexthire/types';

@Controller('v1/manage/assessments')
@UseGuards(RolesGuard)
@RequireRoles('assessment_manager')
export class AssessmentManagementController {
  constructor(
    private readonly authoringService: AssessmentAuthoringService,
    private readonly publicationService: AssessmentPublicationService,
    private readonly readinessService: AssessmentReadinessService,
  ) {}

  @Get()
  async listAssessments() {
    return this.authoringService.listAssessments();
  }

  @Post()
  async createAssessment(
    @Req() req: any,
    @Body() input: CreateAssessmentInput,
  ) {
    const userId = req.principal.userId;
    const requestId = req.requestId;
    return this.authoringService.createAssessment(userId, requestId, input);
  }

  @Get(':assessmentId')
  async getAssessment(@Param('assessmentId') assessmentId: string) {
    return this.authoringService.getAssessmentDetail(assessmentId);
  }

  @Put(':assessmentId')
  async updateAssessment(
    @Req() req: any,
    @Param('assessmentId') assessmentId: string,
    @Body() input: UpdateAssessmentInput,
  ) {
    const userId = req.principal.userId;
    const requestId = req.requestId;
    return this.authoringService.updateAssessment(userId, requestId, assessmentId, input);
  }

  @Get(':assessmentId/readiness')
  async getReadiness(
    @Req() req: any,
    @Param('assessmentId') assessmentId: string,
  ) {
    const userId = req.principal.userId;
    const requestId = req.requestId;
    return this.readinessService.checkReadiness(userId, requestId, assessmentId);
  }

  @Post(':assessmentId/publish')
  @RequireRoles('assessment_publish')
  async publishAssessment(
    @Req() req: any,
    @Param('assessmentId') assessmentId: string,
  ) {
    const userId = req.principal.userId;
    const requestId = req.requestId;
    return this.publicationService.publishAssessment(userId, requestId, assessmentId);
  }

  @Post(':assessmentId/archive')
  @RequireRoles('assessment_publish')
  async archiveAssessment(
    @Req() req: any,
    @Param('assessmentId') assessmentId: string,
  ) {
    const userId = req.principal.userId;
    const requestId = req.requestId;
    return this.publicationService.archiveAssessment(userId, requestId, assessmentId);
  }

  @Post(':assessmentId/republish')
  @RequireRoles('assessment_publish')
  async republishAssessment(
    @Req() req: any,
    @Param('assessmentId') assessmentId: string,
  ) {
    const userId = req.principal.userId;
    const requestId = req.requestId;
    return this.publicationService.publishAssessment(userId, requestId, assessmentId);
  }

  @Get(':assessmentId/preview')
  async previewAssessment(@Param('assessmentId') assessmentId: string) {
    return this.authoringService.getAssessmentDetail(assessmentId);
  }
}
