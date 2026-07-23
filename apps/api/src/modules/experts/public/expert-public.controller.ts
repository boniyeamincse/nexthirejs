import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../auth/decorators/public.decorator';
import { ExpertPublicDirectoryService } from './expert-public-directory.service';

@ApiTags('Expert Public Directory')
@Controller('expert/public')
export class ExpertPublicController {
  constructor(private readonly directoryService: ExpertPublicDirectoryService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Search the public expert directory' })
  @ApiResponse({ status: 200, description: 'Paginated public expert list' })
  async list(@Query() query: unknown) {
    return this.directoryService.list(query);
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get a public expert profile by slug' })
  @ApiResponse({ status: 200, description: 'Public expert profile' })
  @ApiResponse({ status: 404, description: 'EXPERT_PUBLIC_PROFILE_NOT_FOUND' })
  async detail(@Param('slug') slug: string) {
    return this.directoryService.getBySlug(slug);
  }

  @Public()
  @Get(':slug/reviews')
  @ApiOperation({
    summary: 'List public (non-hidden) reviews for an expert, with aggregate rating',
  })
  @ApiResponse({ status: 200, description: 'Paginated reviews plus aggregate rating' })
  async reviews(@Param('slug') slug: string, @Query() query: unknown) {
    return this.directoryService.getReviews(slug, query);
  }

  @Public()
  @Get(':slug/services/:serviceId/slots')
  @ApiOperation({ summary: "Preview bookable slots for one of a public expert's services" })
  @ApiResponse({ status: 200, description: 'Computed slot preview, conflicts excluded' })
  @ApiResponse({ status: 404, description: 'EXPERT_BOOKING_SERVICE_NOT_BOOKABLE' })
  async serviceSlots(
    @Param('slug') slug: string,
    @Param('serviceId') serviceId: string,
    @Query() query: unknown,
  ) {
    return this.directoryService.getServiceSlots(slug, serviceId, query);
  }
}
