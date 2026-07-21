import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus, ParseUUIDPipe, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CandidateAchievementService } from '../services/candidate-achievement.service';
import { AuthGuard } from '../../auth/auth.guard';
import type { AuthenticatedRequest } from '../../auth/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequireRoles } from '../../../common/decorators/roles.decorator';

@ApiTags('Candidate Achievements')
@Controller({
  path: 'candidates/me/achievements',
  version: '1',
})
@UseGuards(AuthGuard, RolesGuard)
@RequireRoles('candidate')
@ApiBearerAuth()
export class CandidateAchievementController {
  constructor(private readonly achievementService: CandidateAchievementService) {}

  @Get()
  @ApiOperation({ summary: 'List own achievements' })
  @ApiResponse({ status: 200, description: 'List of achievements and completion status' })
  async listOwnAchievements(@Req() req: AuthenticatedRequest) {
    return this.achievementService.listRecords(req.principal.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create achievement' })
  @ApiResponse({ status: 201, description: 'Achievement created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed or limit reached' })
  async createAchievement(
    @Req() req: AuthenticatedRequest,
    @Body() body: any,
  ) {
    return this.achievementService.createRecord(req.principal.userId, body);
  }

  @Put('reorder')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reorder achievements' })
  @ApiResponse({ status: 200, description: 'Achievements reordered successfully' })
  async reorderAchievements(
    @Req() req: AuthenticatedRequest,
    @Body() body: any,
  ) {
    return this.achievementService.reorderRecords(req.principal.userId, body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update achievement' })
  @ApiResponse({ status: 200, description: 'Achievement updated successfully' })
  @ApiResponse({ status: 404, description: 'Achievement not found' })
  async updateAchievement(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
  ) {
    return this.achievementService.updateRecord(req.principal.userId, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete achievement' })
  @ApiResponse({ status: 204, description: 'Achievement deleted successfully' })
  @ApiResponse({ status: 404, description: 'Achievement not found' })
  async deleteAchievement(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.achievementService.deleteRecord(req.principal.userId, id);
  }
}
