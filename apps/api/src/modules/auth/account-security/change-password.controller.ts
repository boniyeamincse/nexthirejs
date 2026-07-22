import { Controller, Post, Body, HttpCode, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiProperty } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { AuthGuard } from '../auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { ChangePasswordService } from './change-password.service';
import type { AuthenticatedPrincipal } from '../interfaces/authenticated-principal.interface';
import type { ChangePasswordResponse } from '@nexthire/types';
import { PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH, PASSWORD_UPPERCASE_ERROR, PASSWORD_LOWERCASE_ERROR, PASSWORD_DIGIT_ERROR, PASSWORD_SPECIAL_ERROR } from '@nexthire/constants';

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  currentPassword!: string;

  @ApiProperty()
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(PASSWORD_MAX_LENGTH)
  @Matches(/[A-Z]/, { message: PASSWORD_UPPERCASE_ERROR })
  @Matches(/[a-z]/, { message: PASSWORD_LOWERCASE_ERROR })
  @Matches(/[0-9]/, { message: PASSWORD_DIGIT_ERROR })
  @Matches(/[^a-zA-Z0-9]/, { message: PASSWORD_SPECIAL_ERROR })
  newPassword!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  confirmNewPassword!: string;
}

@ApiTags('Account Security')
@Controller('auth')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class ChangePasswordController {
  constructor(private readonly changePasswordService: ChangePasswordService) {}

  @Post('change-password')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 900000 } })
  @ApiOperation({ summary: 'Change password for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid current password' })
  @ApiResponse({ status: 403, description: 'Account unavailable' })
  @ApiResponse({ status: 429, description: 'Too many attempts - 5 per 15 minutes' })
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @CurrentUser() principal: AuthenticatedPrincipal,
  ): Promise<ChangePasswordResponse> {
    return this.changePasswordService.changePassword(
      principal.userId,
      principal.sessionId!,
      dto.currentPassword,
      dto.newPassword,
    );
  }
}
