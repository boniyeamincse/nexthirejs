import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus, ParseUUIDPipe, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CandidateProfessionalLinkService } from '../services/candidate-professional-link.service';
import { AuthGuard } from '../../auth/auth.guard';
import type { AuthenticatedRequest } from '../../auth/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequireRoles } from '../../../common/decorators/roles.decorator';

@ApiTags('Candidate Professional Links')
@Controller({
  path: 'candidates/me/professional-links',
  version: '1',
})
@UseGuards(AuthGuard, RolesGuard)
@RequireRoles('candidate')
@ApiBearerAuth()
export class CandidateProfessionalLinkController {
  constructor(private readonly linkService: CandidateProfessionalLinkService) {}

  @Get()
  @ApiOperation({ summary: 'List own professional links' })
  @ApiResponse({ status: 200, description: 'List of professional links and completion status' })
  async listOwnLinks(@Req() req: AuthenticatedRequest) {
    return this.linkService.listRecords(req.principal.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create professional link' })
  @ApiResponse({ status: 201, description: 'Professional link created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed or limit reached' })
  @ApiResponse({ status: 409, description: 'Duplicate professional link' })
  async createLink(
    @Req() req: AuthenticatedRequest,
    @Body() body: any,
  ) {
    return this.linkService.createRecord(req.principal.userId, body);
  }

  @Put('reorder')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reorder professional links' })
  @ApiResponse({ status: 200, description: 'Professional links reordered successfully' })
  async reorderLinks(
    @Req() req: AuthenticatedRequest,
    @Body() body: any,
  ) {
    return this.linkService.reorderRecords(req.principal.userId, body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update professional link' })
  @ApiResponse({ status: 200, description: 'Professional link updated successfully' })
  @ApiResponse({ status: 404, description: 'Professional link not found' })
  @ApiResponse({ status: 409, description: 'Duplicate professional link' })
  async updateLink(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
  ) {
    return this.linkService.updateRecord(req.principal.userId, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete professional link' })
  @ApiResponse({ status: 204, description: 'Professional link deleted successfully' })
  @ApiResponse({ status: 404, description: 'Professional link not found' })
  async deleteLink(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.linkService.deleteRecord(req.principal.userId, id);
  }
}
