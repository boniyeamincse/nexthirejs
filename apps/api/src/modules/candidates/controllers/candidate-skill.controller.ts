import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus, ParseUUIDPipe, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CandidateSkillService } from '../services/candidate-skill.service';
import { AuthGuard } from '../../auth/auth.guard';
import type { AuthenticatedRequest } from '../../auth/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequireRoles } from '../../../common/decorators/roles.decorator';

@ApiTags('Candidate Skills')
@Controller({
  path: 'candidates/me/skills',
  version: '1',
})
@UseGuards(AuthGuard, RolesGuard)
@RequireRoles('candidate')
@ApiBearerAuth()
export class CandidateSkillController {
  constructor(private readonly skillService: CandidateSkillService) {}

  @Get()
  @ApiOperation({ summary: 'List own skills' })
  @ApiResponse({ status: 200, description: 'List of skills and completion status' })
  async listOwnSkills(@Req() req: AuthenticatedRequest) {
    return this.skillService.listRecords(req.principal.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create skill' })
  @ApiResponse({ status: 201, description: 'Skill created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed or limit reached' })
  async createSkill(
    @Req() req: AuthenticatedRequest,
    @Body() body: any,
  ) {
    return this.skillService.createRecord(req.principal.userId, body);
  }

  @Put('reorder')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reorder skills' })
  @ApiResponse({ status: 200, description: 'Skills reordered successfully' })
  async reorderSkills(
    @Req() req: AuthenticatedRequest,
    @Body() body: any,
  ) {
    await this.skillService.reorderRecords(req.principal.userId, body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update skill' })
  @ApiResponse({ status: 200, description: 'Skill updated successfully' })
  @ApiResponse({ status: 404, description: 'Skill not found' })
  async updateSkill(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
  ) {
    return this.skillService.updateRecord(req.principal.userId, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete skill' })
  @ApiResponse({ status: 204, description: 'Skill deleted successfully' })
  @ApiResponse({ status: 404, description: 'Skill not found' })
  async deleteSkill(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.skillService.deleteRecord(req.principal.userId, id);
  }
}
