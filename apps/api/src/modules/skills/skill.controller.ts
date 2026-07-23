import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { SkillService, SkillResponse } from './skill.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { AddSkillDto } from './dto/add-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { ReorderSkillsDto } from './dto/reorder-skills.dto';

@ApiTags('Skills')
@Controller('skills')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class SkillController {
  constructor(private readonly skillService: SkillService) {}

  @Get()
  @ApiOperation({ summary: 'Get all skills' })
  @ApiResponse({ status: 200, description: 'Skills retrieved' })
  async getSkills(@CurrentUser() user: AuthenticatedPrincipal): Promise<SkillResponse[]> {
    return this.skillService.getSkills(user.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Add a new skill' })
  @ApiResponse({ status: 201, description: 'Skill added' })
  async addSkill(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Body() dto: AddSkillDto,
  ): Promise<SkillResponse> {
    return this.skillService.addSkill(user.userId, dto.name, dto.level, dto.yearsOfExperience);
  }

  @Put(':skillId')
  @ApiOperation({ summary: 'Update skill' })
  @ApiResponse({ status: 200, description: 'Skill updated' })
  async updateSkill(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Param('skillId') skillId: string,
    @Body() dto: UpdateSkillDto,
  ): Promise<SkillResponse> {
    return this.skillService.updateSkill(user.userId, skillId, dto.level, dto.yearsOfExperience);
  }

  @Delete(':skillId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete skill' })
  @ApiResponse({ status: 204, description: 'Skill deleted' })
  async deleteSkill(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Param('skillId') skillId: string,
  ): Promise<void> {
    return this.skillService.deleteSkill(user.userId, skillId);
  }

  @Put('reorder')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Reorder skills' })
  @ApiResponse({ status: 204, description: 'Skills reordered' })
  async reorderSkills(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Body() dto: ReorderSkillsDto,
  ): Promise<void> {
    return this.skillService.reorderSkills(user.userId, dto.skills);
  }
}
