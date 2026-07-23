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
import { WalletService } from './wallet.service';
import type { PayoutAccountDto } from './wallet.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';

export interface RequestPayoutDto {
  accountId: string;
  amount: number;
}

@ApiTags('Trainer Marketplace')
@Controller('wallet')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post('initialize')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Initialize trainer wallet' })
  @ApiResponse({ status: 201, description: 'Wallet initialized' })
  async initializeWallet(@CurrentUser() user: AuthenticatedPrincipal): Promise<any> {
    return this.walletService.initializeWallet(user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get trainer wallet' })
  @ApiResponse({ status: 200, description: 'Wallet retrieved' })
  async getWallet(@CurrentUser() user: AuthenticatedPrincipal): Promise<any> {
    return this.walletService.getWallet(user.userId);
  }

  @Post('payout-accounts')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add payout account' })
  @ApiResponse({ status: 201, description: 'Payout account added' })
  async addPayoutAccount(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Body() dto: PayoutAccountDto,
  ): Promise<any> {
    return this.walletService.addPayoutAccount(user.userId, dto);
  }

  @Get('payout-accounts')
  @ApiOperation({ summary: 'List payout accounts' })
  @ApiResponse({ status: 200, description: 'Payout accounts retrieved' })
  async listPayoutAccounts(@CurrentUser() user: AuthenticatedPrincipal): Promise<any[]> {
    return this.walletService.listPayoutAccounts(user.userId);
  }

  @Post('payout-requests')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Request payout' })
  @ApiResponse({ status: 201, description: 'Payout request created' })
  async requestPayout(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Body() dto: RequestPayoutDto,
  ): Promise<any> {
    return this.walletService.requestPayout(user.userId, dto.accountId, dto.amount);
  }

  @Get('payout-requests')
  @ApiOperation({ summary: 'List payout requests' })
  @ApiResponse({ status: 200, description: 'Payout requests retrieved' })
  async listPayoutRequests(@CurrentUser() user: AuthenticatedPrincipal): Promise<any[]> {
    return this.walletService.listPayoutRequests(user.userId);
  }
}
