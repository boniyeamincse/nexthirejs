import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CandidateCertificationService } from '../services/candidate-certification.service';
import { AuthGuard } from '../../auth/auth.guard';
import type { AuthenticatedRequest } from '../../auth/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequireRoles } from '../../../common/decorators/roles.decorator';

@ApiTags('Candidate Certifications')
@Controller({
  path: 'candidates/me/certifications',
  version: '1',
})
@UseGuards(AuthGuard, RolesGuard)
@RequireRoles('candidate')
@ApiBearerAuth()
export class CandidateCertificationController {
  constructor(private readonly certificationService: CandidateCertificationService) {}

  @Get()
  @ApiOperation({ summary: 'List own certifications' })
  @ApiResponse({ status: 200, description: 'List of certifications and completion status' })
  async listOwnCertifications(@Req() req: AuthenticatedRequest) {
    return this.certificationService.listRecords(req.principal.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create certification' })
  @ApiResponse({ status: 201, description: 'Certification created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed or limit reached' })
  async createCertification(@Req() req: AuthenticatedRequest, @Body() body: any) {
    return this.certificationService.createRecord(req.principal.userId, body);
  }

  @Put('reorder')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reorder certifications' })
  @ApiResponse({ status: 200, description: 'Certifications reordered successfully' })
  async reorderCertifications(@Req() req: AuthenticatedRequest, @Body() body: any) {
    return this.certificationService.reorderRecords(req.principal.userId, body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update certification' })
  @ApiResponse({ status: 200, description: 'Certification updated successfully' })
  @ApiResponse({ status: 404, description: 'Certification not found' })
  async updateCertification(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
  ) {
    return this.certificationService.updateRecord(req.principal.userId, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete certification' })
  @ApiResponse({ status: 204, description: 'Certification deleted successfully' })
  @ApiResponse({ status: 404, description: 'Certification not found' })
  async deleteCertification(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.certificationService.deleteRecord(req.principal.userId, id);
  }
}
