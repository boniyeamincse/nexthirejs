import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { EvaluationService } from './evaluation.service';
import type { CreateEvaluationDto } from './evaluation.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';

@ApiTags('Trainer Marketplace')
@Controller('evaluations')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class EvaluationController {
  constructor(private readonly evaluationService: EvaluationService) {}

  @Post('bookings/:bookingId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit evaluation for booking' })
  @ApiResponse({ status: 201, description: 'Evaluation submitted' })
  async createEvaluation(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Param('bookingId') bookingId: string,
    @Body() dto: CreateEvaluationDto,
  ): Promise<any> {
    return this.evaluationService.createEvaluation(bookingId, user.userId, dto);
  }

  @Get(':evaluationId')
  @ApiOperation({ summary: 'Get evaluation' })
  @ApiResponse({ status: 200, description: 'Evaluation retrieved' })
  async getEvaluation(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Param('evaluationId') evaluationId: string,
  ): Promise<any> {
    return this.evaluationService.getEvaluation(evaluationId, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'List evaluations for trainer' })
  @ApiResponse({ status: 200, description: 'Evaluations retrieved' })
  async listEvaluations(@CurrentUser() user: AuthenticatedPrincipal): Promise<any[]> {
    return this.evaluationService.listEvaluations(user.userId);
  }
}
