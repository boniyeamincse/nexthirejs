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
import { ExpertWalletService } from './expert-wallet.service';
import { processExpertPayoutRequestSchema } from '@nexthire/validation';
import { EXPERT_PAYOUT_STATUSES, EXPERT_WALLET_ERROR_CODES } from '@nexthire/constants';

@ApiTags('Expert Payout Moderation')
@ApiBearerAuth('access-token')
@Controller('manage/experts')
@UseGuards(AuthGuard, RolesGuard)
@RequireRoles('admin', 'super_admin')
export class ExpertPayoutAdminController {
  constructor(private readonly walletService: ExpertWalletService) {}

  @Get('payout-requests')
  @ApiOperation({ summary: 'List payout requests across all experts' })
  @ApiResponse({ status: 200, description: 'Payout requests' })
  async list(@Query('status') status?: string) {
    if (status && !(EXPERT_PAYOUT_STATUSES as readonly string[]).includes(status)) {
      throw new BadRequestException({
        code: EXPERT_WALLET_ERROR_CODES.VALIDATION_FAILED,
        details: [{ field: 'status', message: 'Invalid status' }],
      });
    }
    return this.walletService.listForAdmin(status);
  }

  @Post('payout-accounts/:id/verify')
  @ApiOperation({ summary: "Verify a payout account's KYC details" })
  @ApiResponse({ status: 200, description: 'Payout account verified' })
  async verify(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.walletService.verifyPayoutAccount(id, req.principal.userId);
  }

  @Post('payout-requests/:id/process')
  @ApiOperation({ summary: 'Complete, fail, or cancel a payout request' })
  @ApiResponse({ status: 200, description: 'Payout request updated' })
  async process(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() body: unknown) {
    const parsed = processExpertPayoutRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        code: EXPERT_WALLET_ERROR_CODES.VALIDATION_FAILED,
        details: parsed.error.issues.map((i: { path: (string | number)[]; message: string }) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      });
    }
    return this.walletService.processPayoutRequest(
      id,
      req.principal.userId,
      parsed.data.status,
      parsed.data.failureReason,
    );
  }
}
