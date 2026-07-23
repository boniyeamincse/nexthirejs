import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { CvSectionService, SectionContentResponse } from './cv-section.service';
import { CvProfileImportService } from './cv-profile-import.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequireRoles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { UpdateSectionContentDto } from './dto/update-section-content.dto';
import { UpdateSectionOrderDto } from './dto/update-section-order.dto';
import { ToggleSectionDto } from './dto/toggle-section.dto';

@ApiTags('CV Builder - Sections')
@Controller('cvs/:cvId/sections')
@UseGuards(AuthGuard, RolesGuard)
@RequireRoles('candidate')
@ApiBearerAuth()
export class CvSectionController {
  constructor(
    private readonly cvSectionService: CvSectionService,
    private readonly profileImportService: CvProfileImportService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all section contents for a CV' })
  @ApiResponse({ status: 200, description: 'Section contents retrieved' })
  async getAllSections(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Param('cvId') cvId: string,
  ): Promise<SectionContentResponse[]> {
    return this.cvSectionService.getAllSectionContents(user.userId, cvId);
  }

  @Get(':sectionType')
  @ApiOperation({ summary: 'Get specific section content' })
  @ApiResponse({ status: 200, description: 'Section content retrieved' })
  async getSection(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Param('cvId') cvId: string,
    @Param('sectionType') sectionType: string,
  ): Promise<SectionContentResponse> {
    return this.cvSectionService.getSectionContent(user.userId, cvId, sectionType);
  }

  @Put(':sectionType')
  @ApiOperation({ summary: 'Update section content' })
  @ApiResponse({ status: 200, description: 'Section content updated' })
  async updateSection(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Param('cvId') cvId: string,
    @Param('sectionType') sectionType: string,
    @Body() dto: UpdateSectionContentDto,
  ): Promise<SectionContentResponse> {
    return this.cvSectionService.updateSectionContent(user.userId, cvId, sectionType, dto.content);
  }

  @Patch('order')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Update section order (drag-drop)' })
  @ApiResponse({ status: 204, description: 'Section order updated' })
  async updateSectionOrder(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Param('cvId') cvId: string,
    @Body() dto: UpdateSectionOrderDto,
  ): Promise<void> {
    return this.cvSectionService.updateSectionOrder(user.userId, cvId, dto.sections);
  }

  @Post(':sectionType/import-from-profile')
  @ApiOperation({
    summary:
      'Snapshot section content from the candidate profile (education, work_experience, skills, projects, certifications, languages, achievements)',
  })
  @ApiResponse({ status: 200, description: 'Section content imported' })
  async importFromProfile(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Param('cvId') cvId: string,
    @Param('sectionType') sectionType: string,
  ): Promise<SectionContentResponse> {
    return this.profileImportService.importSection(user.userId, cvId, sectionType);
  }

  @Patch(':sectionType/toggle')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Toggle section visibility' })
  @ApiResponse({ status: 204, description: 'Section visibility toggled' })
  async toggleSection(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Param('cvId') cvId: string,
    @Param('sectionType') sectionType: string,
    @Body() dto: ToggleSectionDto,
  ): Promise<void> {
    return this.cvSectionService.toggleSectionVisibility(
      user.userId,
      cvId,
      sectionType,
      dto.enabled,
    );
  }
}
