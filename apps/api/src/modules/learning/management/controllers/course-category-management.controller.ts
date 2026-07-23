import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CourseCategoryManagementService } from '../services/course-category-management.service';
import type { CreateCourseCategoryInput, UpdateCourseCategoryInput } from '@nexthire/types';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { RequireRoles } from '../../../../common/decorators/roles.decorator';
import type { AuthenticatedRequest } from '../../../auth/auth.guard';

@ApiTags('Learning Management - Categories')
@Controller('v1/manage/courses/categories')
@UseGuards(RolesGuard)
@RequireRoles('course_manager')
@ApiBearerAuth()
export class CourseCategoryManagementController {
  constructor(private readonly categoryService: CourseCategoryManagementService) {}

  @Get()
  @ApiOperation({ summary: 'List all course categories for management' })
  @ApiResponse({ status: 200, description: 'List of categories' })
  async listCategories() {
    return this.categoryService.listCategories();
  }

  @Post()
  @ApiOperation({ summary: 'Create a new course category' })
  @ApiResponse({ status: 201, description: 'Category created' })
  @ApiResponse({ status: 409, description: 'Slug conflict' })
  async createCategory(@Body() input: CreateCourseCategoryInput, @Req() req: AuthenticatedRequest) {
    return this.categoryService.createCategory(input, req.principal.userId);
  }

  @Put(':categoryId')
  @ApiOperation({ summary: 'Update a course category' })
  @ApiResponse({ status: 200, description: 'Category updated' })
  async updateCategory(
    @Param('categoryId') categoryId: string,
    @Body() input: UpdateCourseCategoryInput,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.categoryService.updateCategory(categoryId, input, req.principal.userId);
  }

  @Post(':categoryId/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate a course category' })
  @ApiResponse({ status: 200, description: 'Category activated' })
  async activateCategory(
    @Param('categoryId') categoryId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.categoryService.activateCategory(categoryId, req.principal.userId);
  }

  @Post(':categoryId/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate a course category' })
  @ApiResponse({ status: 200, description: 'Category deactivated' })
  async deactivateCategory(
    @Param('categoryId') categoryId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.categoryService.deactivateCategory(categoryId, req.principal.userId);
  }
}
