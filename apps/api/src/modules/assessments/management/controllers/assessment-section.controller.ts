import { Controller, Post, Put, Delete, Param, Body, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { RequireRoles } from '../../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { AssessmentSectionService } from '../services/assessment-section.service';
import type { CreateAssessmentSectionInput, UpdateAssessmentSectionInput, ReorderAssessmentSectionsInput } from '@nexthire/types';

@Controller('v1/manage/assessments/:assessmentId/sections')
@UseGuards(RolesGuard)
@RequireRoles('assessment_manager')
export class AssessmentSectionController {
  constructor(private readonly sectionService: AssessmentSectionService) {}

  @Post()
  async createSection(
    @Req() req: any,
    @Param('assessmentId') assessmentId: string,
    @Body() input: CreateAssessmentSectionInput,
  ) {
    const userId = req.principal.userId;
    const requestId = req.requestId;
    return this.sectionService.createSection(userId, requestId, assessmentId, input);
  }

  @Put('reorder')
  @HttpCode(HttpStatus.NO_CONTENT)
  async reorderSections(
    @Req() req: any,
    @Param('assessmentId') assessmentId: string,
    @Body() input: ReorderAssessmentSectionsInput,
  ) {
    const userId = req.principal.userId;
    const requestId = req.requestId;
    await this.sectionService.reorderSections(userId, requestId, assessmentId, input.orderedIds);
  }

  @Put(':sectionId')
  async updateSection(
    @Req() req: any,
    @Param('assessmentId') assessmentId: string,
    @Param('sectionId') sectionId: string,
    @Body() input: UpdateAssessmentSectionInput,
  ) {
    const userId = req.principal.userId;
    const requestId = req.requestId;
    return this.sectionService.updateSection(userId, requestId, assessmentId, sectionId, input);
  }

  @Delete(':sectionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSection(
    @Req() req: any,
    @Param('assessmentId') assessmentId: string,
    @Param('sectionId') sectionId: string,
  ) {
    const userId = req.principal.userId;
    const requestId = req.requestId;
    await this.sectionService.deleteSection(userId, requestId, assessmentId, sectionId);
  }
}
