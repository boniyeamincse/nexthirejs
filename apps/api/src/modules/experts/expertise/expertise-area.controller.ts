import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../modules/auth/decorators/public.decorator';
import { PrismaService } from '../../../database/prisma.service';

@ApiTags('Expertise Areas')
@Controller('expert/expertise-areas')
export class ExpertiseAreaController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all active expertise areas' })
  @ApiResponse({ status: 200, description: 'List of active expertise areas' })
  async listAreas() {
    const areas = await this.prisma.expertiseArea.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, slug: true, name: true, description: true, sortOrder: true },
    });
    return areas;
  }
}
