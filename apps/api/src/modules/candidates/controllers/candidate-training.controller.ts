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
import { CandidateTrainingService } from '../services/candidate-training.service';
import { AuthGuard } from '../../auth/auth.guard';
import type { AuthenticatedRequest } from '../../auth/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequireRoles } from '../../../common/decorators/roles.decorator';

@ApiTags('Candidate Training')
@Controller({
  path: 'candidates/me/training',
  version: '1',
})
@UseGuards(AuthGuard, RolesGuard)
@RequireRoles('candidate')
@ApiBearerAuth()
export class CandidateTrainingController {
  constructor(private readonly trainingService: CandidateTrainingService) {}

  @Get()
  @ApiOperation({ summary: 'List own training records' })
  @ApiResponse({ status: 200, description: 'List of training records and completion status' })
  async listOwnTraining(@Req() req: AuthenticatedRequest) {
    return this.trainingService.listRecords(req.principal.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create training record' })
  @ApiResponse({ status: 201, description: 'Training record created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed or limit reached' })
  async createTraining(@Req() req: AuthenticatedRequest, @Body() body: any) {
    return this.trainingService.createRecord(req.principal.userId, body);
  }

  @Put('reorder')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reorder training records' })
  @ApiResponse({ status: 200, description: 'Training records reordered successfully' })
  async reorderTraining(@Req() req: AuthenticatedRequest, @Body() body: any) {
    return this.trainingService.reorderRecords(req.principal.userId, body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update training record' })
  @ApiResponse({ status: 200, description: 'Training record updated successfully' })
  @ApiResponse({ status: 404, description: 'Training record not found' })
  async updateTraining(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
  ) {
    return this.trainingService.updateRecord(req.principal.userId, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete training record' })
  @ApiResponse({ status: 204, description: 'Training record deleted successfully' })
  @ApiResponse({ status: 404, description: 'Training record not found' })
  async deleteTraining(@Req() req: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    await this.trainingService.deleteRecord(req.principal.userId, id);
  }
}
