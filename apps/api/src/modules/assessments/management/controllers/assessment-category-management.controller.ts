import { Controller, Get, Post, Put, Body, Param, UseGuards, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AssessmentCategoryManagementService } from '../services/assessment-category-management.service';
import type { CreateAssessmentCategoryInput, UpdateAssessmentCategoryInput, ReorderAssessmentCategoriesInput } from '@nexthire/types';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { RequireRoles } from '../../../../common/decorators/roles.decorator';
import type { AuthenticatedRequest } from '../../../auth/auth.guard';

@ApiTags('Assessment Management - Categories')
@Controller('v1/manage/assessments/categories')
@UseGuards(RolesGuard)
@RequireRoles('assessment_manager')
@ApiBearerAuth()
export class AssessmentCategoryManagementController {
  constructor(private readonly categoryService: AssessmentCategoryManagementService) {}

  @Get()
  @ApiOperation({ summary: 'List all assessment categories for management' })
  @ApiResponse({ status: 200, description: 'List of categories' })
  async listCategories() {
    return this.categoryService.listCategories();
  }

  @Post()
  @ApiOperation({ summary: 'Create a new assessment category' })
  @ApiResponse({ status: 201, description: 'Category created' })
  @ApiResponse({ status: 409, description: 'Slug conflict' })
  async createCategory(
    @Body() input: CreateAssessmentCategoryInput,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.categoryService.createCategory(input, req.principal.userId);
  }

  @Put('reorder')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reorder assessment categories' })
  @ApiResponse({ status: 200, description: 'Categories reordered' })
  async reorderCategories(
    @Body() input: ReorderAssessmentCategoriesInput,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.categoryService.reorderCategories(input, req.principal.userId);
    return { success: true };
  }

  @Put(':categoryId')
  @ApiOperation({ summary: 'Update an assessment category' })
  @ApiResponse({ status: 200, description: 'Category updated' })
  async updateCategory(
    @Param('categoryId') categoryId: string,
    @Body() input: UpdateAssessmentCategoryInput,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.categoryService.updateCategory(categoryId, input, req.principal.userId);
  }

  @Post(':categoryId/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate an assessment category' })
  @ApiResponse({ status: 200, description: 'Category activated' })
  async activateCategory(
    @Param('categoryId') categoryId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.categoryService.activateCategory(categoryId, req.principal.userId);
  }

  @Post(':categoryId/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate an assessment category' })
  @ApiResponse({ status: 200, description: 'Category deactivated' })
  async deactivateCategory(
    @Param('categoryId') categoryId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.categoryService.deactivateCategory(categoryId, req.principal.userId);
  }
}
