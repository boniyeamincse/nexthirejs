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
}
