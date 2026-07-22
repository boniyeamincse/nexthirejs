import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { CandidateWorkExperienceService } from '../services/candidate-work-experience.service';
import { AuthGuard } from '../../auth/auth.guard';
import type { AuthenticatedRequest } from '../../auth/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequireRoles } from '../../../common/decorators/roles.decorator';

@ApiTags('Candidate Work Experience')
@Controller({
  path: 'candidates/me/experience',
  version: '1',
})
@UseGuards(AuthGuard, RolesGuard)
@RequireRoles('candidate')
@ApiBearerAuth()
export class CandidateWorkExperienceController {
  constructor(private readonly workExpService: CandidateWorkExperienceService) {}

  @Get()
  @ApiOperation({ summary: 'List own work experience records' })
  @ApiResponse({
    status: 200,
    description: 'List of work experience records and completion status',
  })
  async listOwnExperience(@Req() req: AuthenticatedRequest) {
    return this.workExpService.listRecords(req.principal.userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create work experience record' })
  @ApiResponse({ status: 201, description: 'Work experience record created' })
  @ApiResponse({
    status: 400,
    description: 'CANDIDATE_EXPERIENCE_VALIDATION_FAILED or CANDIDATE_EXPERIENCE_LIMIT_REACHED',
  })
  @ApiResponse({ status: 401, description: 'AUTH_ACCESS_TOKEN_INVALID' })
  @ApiResponse({ status: 403, description: 'CANDIDATE_ROLE_REQUIRED' })
  async createExperience(@Req() req: AuthenticatedRequest, @Body() body: any) {
    return this.workExpService.createRecord(req.principal.userId, body);
  }

  @Put('reorder')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reorder work experience records' })
  @ApiResponse({ status: 200, description: 'Records reordered successfully' })
  @ApiResponse({ status: 400, description: 'CANDIDATE_EXPERIENCE_VALIDATION_FAILED' })
  async reorderExperience(@Req() req: AuthenticatedRequest, @Body() body: any) {
    return this.workExpService.reorderRecords(req.principal.userId, body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update own work experience record' })
  @ApiParam({ name: 'id', description: 'Work experience record UUID' })
  @ApiResponse({ status: 200, description: 'Work experience record updated' })
  @ApiResponse({ status: 400, description: 'CANDIDATE_EXPERIENCE_VALIDATION_FAILED' })
  @ApiResponse({ status: 404, description: 'CANDIDATE_EXPERIENCE_NOT_FOUND' })
  async updateExperience(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
  ) {
    return this.workExpService.updateRecord(req.principal.userId, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete own work experience record' })
  @ApiParam({ name: 'id', description: 'Work experience record UUID' })
  @ApiResponse({ status: 204, description: 'Work experience record deleted' })
  @ApiResponse({ status: 404, description: 'CANDIDATE_EXPERIENCE_NOT_FOUND' })
  async deleteExperience(@Req() req: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    await this.workExpService.deleteRecord(req.principal.userId, id);
  }
}
