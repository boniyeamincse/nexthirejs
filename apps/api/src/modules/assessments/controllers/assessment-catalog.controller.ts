import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequireRoles } from '../../../common/decorators/roles.decorator';
import { AssessmentCatalogService } from '../services/assessment-catalog.service';
import type { AuthenticatedRequest } from '../../auth/auth.guard';

@ApiTags('Assessment Catalog')
@Controller({
  path: 'assessments',
  version: '1',
})
@UseGuards(AuthGuard, RolesGuard)
@RequireRoles('candidate')
@ApiBearerAuth()
export class AssessmentCatalogController {
  constructor(private readonly catalogService: AssessmentCatalogService) {}

  @Get()
  @ApiOperation({
    summary: 'List candidate assessment catalog',
    description:
      'Returns published, catalog-visible assessments with filtering and pagination. ' +
      'Only active categories are included. Draft, archived, retired, invite-only, and internal assessments are hidden.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, description: 'Items per page (default: 12, max: 50)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by title or description (max 100 chars)' })
  @ApiQuery({ name: 'category', required: false, type: String, description: 'Filter by category slug' })
  @ApiQuery({ name: 'type', required: false, enum: ['PRACTICE', 'CERTIFICATION', 'SCREENING', 'SKILL_CHECK'], description: 'Filter by assessment type' })
  @ApiQuery({ name: 'difficulty', required: false, enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'], description: 'Filter by difficulty' })
  @ApiQuery({ name: 'availability', required: false, enum: ['AVAILABLE', 'COMING_SOON', 'UNAVAILABLE'], description: 'Filter by availability' })
  @ApiResponse({ status: 200, description: 'Paginated catalog with filter options' })
  @ApiResponse({ status: 400, description: 'ASSESSMENT_CATALOG_QUERY_INVALID' })
  @ApiResponse({ status: 401, description: 'AUTH_ACCESS_TOKEN_INVALID' })
  @ApiResponse({ status: 403, description: 'CANDIDATE_ROLE_REQUIRED or AUTH_ACCOUNT_UNAVAILABLE' })
  async listCatalog(
    @Req() req: AuthenticatedRequest,
    @Query() query: any,
  ) {
    return this.catalogService.listCatalog(req.principal.userId, query);
  }

  @Get(':assessmentIdOrSlug')
  @ApiOperation({
    summary: 'Get candidate assessment detail',
    description:
      'Returns published, catalog-visible assessment detail. ' +
      'Draft, archived, retired, invite-only, internal, or non-existent assessments return 404.',
  })
  @ApiResponse({ status: 200, description: 'Assessment catalog detail' })
  @ApiResponse({ status: 404, description: 'ASSESSMENT_NOT_FOUND' })
  @ApiResponse({ status: 401, description: 'AUTH_ACCESS_TOKEN_INVALID' })
  @ApiResponse({ status: 403, description: 'CANDIDATE_ROLE_REQUIRED or AUTH_ACCOUNT_UNAVAILABLE' })
  async getDetail(
    @Req() req: AuthenticatedRequest,
    @Param('assessmentIdOrSlug') identifier: string,
  ) {
    return this.catalogService.getDetail(req.principal.userId, identifier);
  }
}
