import { BadRequestException, Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../../modules/auth/auth.guard';
import type { AuthenticatedRequest } from '../../../modules/auth/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequireRoles } from '../../../common/decorators/roles.decorator';
import { ExpertEligibilityGuard } from '../shared/expert-eligibility.guard';
import { ExpertWalletService } from './expert-wallet.service';
import {
  createExpertPayoutAccountSchema,
  createExpertPayoutRequestSchema,
} from '@nexthire/validation';
import { EXPERT_WALLET_ERROR_CODES, EXPERT_WALLET_RATE_LIMITS } from '@nexthire/constants';

const HOUR_MS = 3_600_000;

@ApiTags('Expert Wallet')
@ApiBearerAuth('access-token')
@Controller('expert/wallet')
@UseGuards(AuthGuard, RolesGuard, ExpertEligibilityGuard)
@RequireRoles('expert')
export class ExpertWalletController {
  constructor(private readonly walletService: ExpertWalletService) {}

  @Post('initialize')
  @ApiOperation({ summary: 'Initialize my expert wallet' })
  @ApiResponse({ status: 201, description: 'Wallet initialized' })
  async initialize(@Req() req: AuthenticatedRequest) {
    return this.walletService.initializeWallet(req.principal.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get my expert wallet' })
  @ApiResponse({ status: 200, description: 'Wallet, or null if not yet initialized' })
  async get(@Req() req: AuthenticatedRequest) {
    return this.walletService.getWallet(req.principal.userId);
  }

  @Post('payout-accounts')
  @Throttle({
    default: { limit: EXPERT_WALLET_RATE_LIMITS.PAYOUT_ACCOUNT_CREATE_PER_HOUR, ttl: HOUR_MS },
  })
  @ApiOperation({ summary: 'Add a payout account' })
  @ApiResponse({ status: 201, description: 'Payout account added' })
  async addPayoutAccount(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    const parsed = createExpertPayoutAccountSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        code: EXPERT_WALLET_ERROR_CODES.VALIDATION_FAILED,
        details: parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      });
    }
    return this.walletService.addPayoutAccount(req.principal.userId, parsed.data);
  }

  @Get('payout-accounts')
  @ApiOperation({ summary: 'List my payout accounts' })
  @ApiResponse({ status: 200, description: 'Payout accounts' })
  async listPayoutAccounts(@Req() req: AuthenticatedRequest) {
    return this.walletService.listPayoutAccounts(req.principal.userId);
  }

  @Post('payout-requests')
  @Throttle({ default: { limit: EXPERT_WALLET_RATE_LIMITS.PAYOUT_REQUEST_PER_HOUR, ttl: HOUR_MS } })
  @ApiOperation({ summary: 'Request a payout' })
  @ApiResponse({ status: 201, description: 'Payout request created' })
  async requestPayout(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    const parsed = createExpertPayoutRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        code: EXPERT_WALLET_ERROR_CODES.VALIDATION_FAILED,
        details: parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      });
    }
    return this.walletService.requestPayout(req.principal.userId, parsed.data);
  }

  @Get('payout-requests')
  @ApiOperation({ summary: 'List my payout requests' })
  @ApiResponse({ status: 200, description: 'Payout requests' })
  async listPayoutRequests(@Req() req: AuthenticatedRequest) {
    return this.walletService.listPayoutRequests(req.principal.userId);
  }
}
