import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequireRoles } from '../../../common/decorators/roles.decorator';
import { CourseCatalogService } from '../services/course-catalog.service';
import type { AuthenticatedRequest } from '../../auth/auth.guard';

@ApiTags('Course Catalog')
@Controller({
  path: 'courses',
  version: '1',
})
@UseGuards(AuthGuard, RolesGuard)
@RequireRoles('candidate')
@ApiBearerAuth()
export class CourseCatalogController {
  constructor(private readonly catalogService: CourseCatalogService) {}

  @Get()
  @ApiOperation({
    summary: 'List candidate course catalog',
    description:
      'Returns published, catalog-visible courses with filtering and pagination. ' +
      'Only active categories are included.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    description: 'Items per page (default: 12, max: 50)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by title or summary (max 100 chars)',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    type: String,
    description: 'Filter by category slug',
  })
  @ApiQuery({
    name: 'difficulty',
    required: false,
    enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'],
    description: 'Filter by difficulty',
  })
  @ApiResponse({ status: 200, description: 'Paginated catalog with filter options' })
  @ApiResponse({ status: 400, description: 'COURSE_CATALOG_QUERY_INVALID' })
  @ApiResponse({ status: 401, description: 'AUTH_ACCESS_TOKEN_INVALID' })
  @ApiResponse({ status: 403, description: 'CANDIDATE_ROLE_REQUIRED' })
  async listCatalog(@Req() req: AuthenticatedRequest, @Query() query: any) {
    const userId = req.principal.userId;
    return this.catalogService.listCatalog(userId, query);
  }

  @Get(':courseIdOrSlug')
  @ApiOperation({ summary: 'Get candidate course detail (outline + enrollment status)' })
  @ApiResponse({ status: 200, description: 'Course detail with module/lesson outline' })
  @ApiResponse({ status: 404, description: 'COURSE_NOT_FOUND' })
  async getDetail(
    @Req() req: AuthenticatedRequest,
    @Param('courseIdOrSlug') courseIdOrSlug: string,
  ) {
    const userId = req.principal.userId;
    return this.catalogService.getDetail(userId, courseIdOrSlug);
  }
}
