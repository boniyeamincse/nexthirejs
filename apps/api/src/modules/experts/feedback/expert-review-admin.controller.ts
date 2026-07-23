import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../../modules/auth/auth.guard';
import type { AuthenticatedRequest } from '../../../modules/auth/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequireRoles } from '../../../common/decorators/roles.decorator';
import { ExpertReviewService } from './expert-review.service';
import { expertReviewListQuerySchema, moderateExpertReviewSchema } from '@nexthire/validation';
import { EXPERT_FEEDBACK_ERROR_CODES } from '@nexthire/constants';

@ApiTags('Expert Review Moderation')
@ApiBearerAuth('access-token')
@Controller('manage/experts/reviews')
@UseGuards(AuthGuard, RolesGuard)
@RequireRoles('admin', 'super_admin')
export class ExpertReviewAdminController {
  constructor(private readonly reviewService: ExpertReviewService) {}

  @Get()
  @ApiOperation({ summary: 'List expert reviews for moderation' })
  @ApiResponse({ status: 200, description: 'Paginated reviews' })
  async list(
    @Query() query: unknown,
    @Query('expertUserId') expertUserId?: string,
    @Query('isHidden') isHiddenRaw?: string,
  ) {
    const parsed = expertReviewListQuerySchema.safeParse(query ?? {});
    if (!parsed.success) {
      throw new BadRequestException({
        code: EXPERT_FEEDBACK_ERROR_CODES.VALIDATION_FAILED,
        details: parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      });
    }
    const isHidden = isHiddenRaw === undefined ? undefined : isHiddenRaw === 'true';
    return this.reviewService.listForAdmin({ ...parsed.data, expertUserId, isHidden });
  }

  @Post(':id/hide')
  @ApiOperation({ summary: 'Hide a review from public display' })
  @ApiResponse({ status: 200, description: 'Review hidden' })
  async hide(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() body: unknown) {
    const parsed = moderateExpertReviewSchema.safeParse(body ?? {});
    if (!parsed.success) {
      throw new BadRequestException({
        code: EXPERT_FEEDBACK_ERROR_CODES.VALIDATION_FAILED,
        details: parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      });
    }
    return this.reviewService.hideReview(id, req.principal.userId, parsed.data.reason);
  }

  @Post(':id/unhide')
  @ApiOperation({ summary: 'Restore a hidden review to public display' })
  @ApiResponse({ status: 200, description: 'Review unhidden' })
  async unhide(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.reviewService.unhideReview(id, req.principal.userId);
  }
}
