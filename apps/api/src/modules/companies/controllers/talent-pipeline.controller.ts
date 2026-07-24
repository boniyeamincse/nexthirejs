import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/auth.guard';
import type { AuthenticatedRequest } from '../../auth/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequireRoles } from '../../../common/decorators/roles.decorator';
import { TalentPipelineService } from '../services/talent-pipeline.service';
import { TALENT_PIPELINE_RATE_LIMITS } from '@nexthire/constants';

const HOUR_MS = 3_600_000;

@ApiTags('Talent Pipeline')
@ApiBearerAuth('access-token')
@Controller({ path: 'companies/me/shortlists', version: '1' })
@UseGuards(AuthGuard, RolesGuard)
@RequireRoles('candidate')
export class TalentPipelineController {
  constructor(private readonly service: TalentPipelineService) {}

  @Get()
  @ApiOperation({ summary: 'List the current company talent shortlists' })
  async list(@Req() req: AuthenticatedRequest) {
    return this.service.list(req.principal.userId);
  }

  @Post()
  @Throttle({
    default: { limit: TALENT_PIPELINE_RATE_LIMITS.SHORTLIST_WRITE_PER_HOUR, ttl: HOUR_MS },
  })
  @ApiOperation({ summary: 'Create a new talent shortlist' })
  async create(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    return this.service.create(req.principal.userId, body);
  }

  @Get(':shortlistId')
  @ApiOperation({ summary: 'Get a shortlist with its members grouped by pipeline stage' })
  async getDetail(@Req() req: AuthenticatedRequest, @Param('shortlistId') shortlistId: string) {
    return this.service.getDetail(req.principal.userId, shortlistId);
  }

  @Patch(':shortlistId')
  @Throttle({
    default: { limit: TALENT_PIPELINE_RATE_LIMITS.SHORTLIST_WRITE_PER_HOUR, ttl: HOUR_MS },
  })
  @ApiOperation({ summary: 'Rename or edit a shortlist' })
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('shortlistId') shortlistId: string,
    @Body() body: unknown,
  ) {
    return this.service.update(req.principal.userId, shortlistId, body);
  }

  @Delete(':shortlistId')
  @Throttle({
    default: { limit: TALENT_PIPELINE_RATE_LIMITS.SHORTLIST_WRITE_PER_HOUR, ttl: HOUR_MS },
  })
  @ApiOperation({ summary: 'Delete a shortlist' })
  async remove(@Req() req: AuthenticatedRequest, @Param('shortlistId') shortlistId: string) {
    await this.service.remove(req.principal.userId, shortlistId);
    return { success: true };
  }

  @Post(':shortlistId/members')
  @Throttle({ default: { limit: TALENT_PIPELINE_RATE_LIMITS.MEMBER_WRITE_PER_HOUR, ttl: HOUR_MS } })
  @ApiOperation({ summary: 'Add a discoverable candidate to a shortlist' })
  async addMember(
    @Req() req: AuthenticatedRequest,
    @Param('shortlistId') shortlistId: string,
    @Body() body: unknown,
  ) {
    return this.service.addMember(req.principal.userId, shortlistId, body);
  }

  @Patch(':shortlistId/members/:memberId')
  @Throttle({ default: { limit: TALENT_PIPELINE_RATE_LIMITS.MEMBER_WRITE_PER_HOUR, ttl: HOUR_MS } })
  @ApiOperation({ summary: 'Update notes/tags, or move a member to a stage/position' })
  async updateMember(
    @Req() req: AuthenticatedRequest,
    @Param('shortlistId') shortlistId: string,
    @Param('memberId') memberId: string,
    @Body() body: unknown,
  ) {
    return this.service.updateMember(req.principal.userId, shortlistId, memberId, body);
  }

  @Delete(':shortlistId/members/:memberId')
  @Throttle({ default: { limit: TALENT_PIPELINE_RATE_LIMITS.MEMBER_WRITE_PER_HOUR, ttl: HOUR_MS } })
  @ApiOperation({ summary: 'Remove a candidate from a shortlist' })
  async removeMember(
    @Req() req: AuthenticatedRequest,
    @Param('shortlistId') shortlistId: string,
    @Param('memberId') memberId: string,
  ) {
    await this.service.removeMember(req.principal.userId, shortlistId, memberId);
    return { success: true };
  }
}
