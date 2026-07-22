import { Controller, Post, Body, HttpCode, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IsString, MinLength, MaxLength } from 'class-validator';
import { AuthGuard } from '../../auth/auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequireRoles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AccountDeactivationService } from './account-deactivation.service';
import type { AuthenticatedPrincipal } from '../../auth/interfaces/authenticated-principal.interface';
import type { DeactivateCandidateAccountResult } from '@nexthire/types';

export class DeactivateAccountDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  currentPassword!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  confirmation!: string;
}

@ApiTags('Account Lifecycle')
@Controller({
  path: 'candidates/me/deactivate',
  version: '1',
})
@UseGuards(AuthGuard, RolesGuard)
@RequireRoles('candidate')
@ApiBearerAuth()
export class AccountDeactivationController {
  constructor(private readonly deactivationService: AccountDeactivationService) {}

  @Post()
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 900000 } })
  @ApiOperation({ summary: 'Deactivate the authenticated candidate account' })
  @ApiResponse({ status: 200, description: 'Account deactivated successfully' })
  @ApiResponse({ status: 400, description: 'ACCOUNT_DEACTIVATION_CONFIRMATION_INVALID' })
  @ApiResponse({ status: 401, description: 'AUTH_CURRENT_PASSWORD_INVALID' })
  @ApiResponse({ status: 403, description: 'Candidate role required or account unavailable' })
  @ApiResponse({ status: 429, description: 'Too many attempts - 5 per 15 minutes' })
  async deactivateAccount(
    @Body() dto: DeactivateAccountDto,
    @CurrentUser() principal: AuthenticatedPrincipal,
  ): Promise<DeactivateCandidateAccountResult> {
    return this.deactivationService.deactivateAccount(
      principal.userId,
      dto.currentPassword,
      dto.confirmation,
    );
  }
}
