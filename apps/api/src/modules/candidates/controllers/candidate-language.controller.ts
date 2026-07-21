import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus, ParseUUIDPipe, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CandidateLanguageService } from '../services/candidate-language.service';
import { AuthGuard } from '../../auth/auth.guard';
import type { AuthenticatedRequest } from '../../auth/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequireRoles } from '../../../common/decorators/roles.decorator';

@ApiTags('Candidate Languages')
@Controller({
  path: 'candidates/me/languages',
  version: '1',
})
@UseGuards(AuthGuard, RolesGuard)
@RequireRoles('candidate')
@ApiBearerAuth()
export class CandidateLanguageController {
  constructor(private readonly languageService: CandidateLanguageService) {}

  @Get()
  @ApiOperation({ summary: 'List own languages' })
  @ApiResponse({ status: 200, description: 'List of languages and completion status' })
  async listOwnLanguages(@Req() req: AuthenticatedRequest) {
    return this.languageService.listRecords(req.principal.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create language' })
  @ApiResponse({ status: 201, description: 'Language created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed or limit reached' })
  async createLanguage(
    @Req() req: AuthenticatedRequest,
    @Body() body: any,
  ) {
    return this.languageService.createRecord(req.principal.userId, body);
  }

  @Put('reorder')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reorder languages' })
  @ApiResponse({ status: 200, description: 'Languages reordered successfully' })
  async reorderLanguages(
    @Req() req: AuthenticatedRequest,
    @Body() body: any,
  ) {
    await this.languageService.reorderRecords(req.principal.userId, body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update language' })
  @ApiResponse({ status: 200, description: 'Language updated successfully' })
  @ApiResponse({ status: 404, description: 'Language not found' })
  async updateLanguage(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
  ) {
    return this.languageService.updateRecord(req.principal.userId, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete language' })
  @ApiResponse({ status: 204, description: 'Language deleted successfully' })
  @ApiResponse({ status: 404, description: 'Language not found' })
  async deleteLanguage(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.languageService.deleteRecord(req.principal.userId, id);
  }
}
