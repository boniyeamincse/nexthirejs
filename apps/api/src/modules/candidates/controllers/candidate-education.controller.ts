import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus, ParseUUIDPipe, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CandidateEducationService } from '../services/candidate-education.service';
import { AuthGuard } from '../../auth/auth.guard';
import type { AuthenticatedRequest } from '../../auth/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequireRoles } from '../../../common/decorators/roles.decorator';

@ApiTags('Candidate Education')
@Controller({
  path: 'candidates/me/education',
  version: '1',
})
@UseGuards(AuthGuard, RolesGuard)
@RequireRoles('candidate')
@ApiBearerAuth()
export class CandidateEducationController {
  constructor(private readonly educationService: CandidateEducationService) {}

  @Get()
  @ApiOperation({ summary: 'List own education records' })
  @ApiResponse({ status: 200, description: 'List of education records and completion status' })
  async listOwnEducation(@Req() req: AuthenticatedRequest) {
    return this.educationService.listRecords(req.principal.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create education record' })
  @ApiResponse({ status: 201, description: 'Education record created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed or limit reached' })
  async createEducation(
    @Req() req: AuthenticatedRequest,
    @Body() body: any,
  ) {
    return this.educationService.createRecord(req.principal.userId, body);
  }

  @Put('reorder')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reorder education records' })
  @ApiResponse({ status: 200, description: 'Records reordered successfully' })
  async reorderEducation(
    @Req() req: AuthenticatedRequest,
    @Body() body: any,
  ) {
    await this.educationService.reorderRecords(req.principal.userId, body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update education record' })
  @ApiResponse({ status: 200, description: 'Education record updated successfully' })
  @ApiResponse({ status: 404, description: 'Education record not found' })
  async updateEducation(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
  ) {
    return this.educationService.updateRecord(req.principal.userId, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete education record' })
  @ApiResponse({ status: 204, description: 'Education record deleted successfully' })
  @ApiResponse({ status: 404, description: 'Education record not found' })
  async deleteEducation(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.educationService.deleteRecord(req.principal.userId, id);
  }
}
