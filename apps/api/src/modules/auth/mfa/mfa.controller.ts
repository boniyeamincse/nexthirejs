import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  UseGuards,
  Req,
  Res,
  BadRequestException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiProperty } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IsString, IsOptional, IsBoolean, MaxLength, MinLength, IsIn } from 'class-validator';
import type { Request, Response } from 'express';
import { AuthGuard } from '../auth.guard';
import { Public } from '../decorators/public.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import type { AuthenticatedPrincipal } from '../interfaces/authenticated-principal.interface';
import { MfaService } from './mfa.service';
import { MfaChallengeService } from './mfa-challenge.service';
import { MfaTrustedDeviceService } from './mfa-trusted-device.service';
import { LoginService } from '../login.service';
import { TokenService } from '../token.service';
import { MFA_TRUST_COOKIE_NAME } from '../login.controller';
import {
  beginMfaEnrollmentSchema,
  confirmMfaEnrollmentSchema,
  disableMfaSchema,
  regenerateMfaRecoveryCodesSchema,
  verifyMfaChallengeSchema,
} from '@nexthire/validation';
import type {
  MfaSecurityStatus,
  BeginMfaEnrollmentResult,
  ConfirmMfaEnrollmentResult,
  RegenerateMfaRecoveryCodesResult,
  MfaTrustedDeviceListResult,
  CandidateLoginResult,
} from '@nexthire/types';

const REFRESH_COOKIE_NAME = 'nexthire_refresh';

export class BeginMfaEnrollmentDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  currentPassword!: string;
}

export class ConfirmMfaEnrollmentDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  @MinLength(6)
  @MaxLength(8)
  code!: string;
}

export class DisableMfaDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  currentPassword!: string;

  @ApiProperty({ description: 'TOTP code or recovery code' })
  @IsString()
  @MinLength(6)
  @MaxLength(64)
  code!: string;
}

export class RegenerateRecoveryCodesDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  @MinLength(6)
  @MaxLength(8)
  code!: string;
}

export class VerifyMfaChallengeDto {
  @ApiProperty({ description: '64-character challenge token from login' })
  @IsString()
  @MinLength(64)
  @MaxLength(64)
  challengeToken!: string;

  @ApiProperty({ enum: ['TOTP', 'RECOVERY_CODE'] })
  @IsString()
  @IsIn(['TOTP', 'RECOVERY_CODE'])
  method!: 'TOTP' | 'RECOVERY_CODE';

  @ApiProperty({ description: 'TOTP code or recovery code' })
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  code!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  trustDevice?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  deviceName?: string;
}

@ApiTags('MFA')
@Controller('auth/mfa')
export class MfaController {
  constructor(
    private readonly mfaService: MfaService,
    private readonly mfaChallengeService: MfaChallengeService,
    private readonly mfaTrustedDeviceService: MfaTrustedDeviceService,
    private readonly loginService: LoginService,
    private readonly tokenService: TokenService,
  ) {}

  @Get('status')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({ summary: 'Get MFA security status for the authenticated user' })
  @ApiResponse({ status: 200, description: 'MFA status' })
  async getStatus(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Req() req: Request,
  ): Promise<MfaSecurityStatus> {
    const rawTrustToken = (req.cookies?.[MFA_TRUST_COOKIE_NAME] as string) || undefined;
    return this.mfaService.getSecurityStatus(principal.userId, principal.roleCodes, rawTrustToken);
  }

  @Post('enrollment')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 900000 } })
  @ApiOperation({ summary: 'Begin TOTP enrollment (requires current password)' })
  @ApiResponse({ status: 200, description: 'Enrollment started; QR and manual secret returned' })
  @ApiResponse({ status: 401, description: 'Invalid current password' })
  @ApiResponse({ status: 409, description: 'MFA already enabled' })
  async beginEnrollment(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Body() dto: BeginMfaEnrollmentDto,
  ): Promise<BeginMfaEnrollmentResult> {
    const parsed = beginMfaEnrollmentSchema.safeParse(dto);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues[0]?.message ?? 'Validation failed');
    }
    return this.mfaService.beginEnrollment(principal.userId, parsed.data.currentPassword);
  }

  @Post('enrollment/confirm')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 900000 } })
  @ApiOperation({ summary: 'Confirm TOTP enrollment with a code; returns recovery codes once' })
  @ApiResponse({ status: 200, description: 'MFA enabled; recovery codes returned exactly once' })
  @ApiResponse({ status: 400, description: 'Enrollment not started or expired' })
  @ApiResponse({ status: 401, description: 'Invalid code' })
  async confirmEnrollment(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Body() dto: ConfirmMfaEnrollmentDto,
  ): Promise<ConfirmMfaEnrollmentResult> {
    const parsed = confirmMfaEnrollmentSchema.safeParse(dto);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues[0]?.message ?? 'Validation failed');
    }
    return this.mfaService.confirmEnrollment(principal.userId, parsed.data.code);
  }

  @Post('disable')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(204)
  @Throttle({ default: { limit: 5, ttl: 900000 } })
  @ApiOperation({ summary: 'Disable MFA (requires password and a valid TOTP or recovery code)' })
  @ApiResponse({ status: 204, description: 'MFA disabled' })
  @ApiResponse({ status: 400, description: 'MFA not enabled' })
  @ApiResponse({ status: 401, description: 'Invalid password or code' })
  async disable(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Body() dto: DisableMfaDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const parsed = disableMfaSchema.safeParse(dto);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues[0]?.message ?? 'Validation failed');
    }
    await this.mfaService.disable(principal.userId, parsed.data.currentPassword, parsed.data.code);
    res.clearCookie(MFA_TRUST_COOKIE_NAME, { path: '/api/v1/auth' });
  }

  @Post('recovery-codes/regenerate')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 900000 } })
  @ApiOperation({ summary: 'Regenerate recovery codes (invalidates previous codes)' })
  @ApiResponse({ status: 200, description: 'New recovery codes returned exactly once' })
  @ApiResponse({ status: 400, description: 'MFA not enabled' })
  @ApiResponse({ status: 401, description: 'Invalid code' })
  async regenerateRecoveryCodes(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Body() dto: RegenerateRecoveryCodesDto,
  ): Promise<RegenerateMfaRecoveryCodesResult> {
    const parsed = regenerateMfaRecoveryCodesSchema.safeParse(dto);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues[0]?.message ?? 'Validation failed');
    }
    return this.mfaService.regenerateRecoveryCodes(principal.userId, parsed.data.code);
  }

  @Get('trusted-devices')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'List active trusted devices' })
  @ApiResponse({ status: 200, description: 'Trusted devices' })
  async listTrustedDevices(
    @CurrentUser() principal: AuthenticatedPrincipal,
  ): Promise<MfaTrustedDeviceListResult> {
    const devices = await this.mfaTrustedDeviceService.listDevices(principal.userId);
    return { devices };
  }

  @Delete('trusted-devices/:deviceId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(204)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Revoke one trusted device (owner only)' })
  @ApiResponse({ status: 204, description: 'Device revoked' })
  @ApiResponse({ status: 404, description: 'Device not found' })
  async revokeTrustedDevice(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('deviceId', new ParseUUIDPipe()) deviceId: string,
  ): Promise<void> {
    await this.mfaTrustedDeviceService.revokeDevice(principal.userId, deviceId);
  }

  @Delete('trusted-devices')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(204)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Revoke all trusted devices' })
  @ApiResponse({ status: 204, description: 'All devices revoked' })
  async revokeAllTrustedDevices(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.mfaTrustedDeviceService.revokeAllDevices(principal.userId);
    res.clearCookie(MFA_TRUST_COOKIE_NAME, { path: '/api/v1/auth' });
  }

  @Post('challenge/verify')
  @Public()
  @HttpCode(200)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Verify an MFA login challenge and complete sign-in' })
  @ApiResponse({ status: 200, description: 'Login completed; tokens issued' })
  @ApiResponse({ status: 401, description: 'Invalid, expired, or consumed challenge or code' })
  @ApiResponse({ status: 429, description: 'Too many attempts' })
  async verifyChallenge(
    @Body() dto: VerifyMfaChallengeDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<CandidateLoginResult> {
    const parsed = verifyMfaChallengeSchema.safeParse(dto);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues[0]?.message ?? 'Validation failed');
    }

    const { userId } = await this.mfaChallengeService.verifyChallenge(
      parsed.data.challengeToken,
      parsed.data.method,
      parsed.data.code,
    );

    const ip = req.ip || req.socket?.remoteAddress || undefined;
    const userAgent = req.headers['user-agent'] || undefined;
    const result = await this.loginService.completeMfaLogin(userId, {
      ipAddress: ip,
      userAgent,
    });

    const cookieConfig = this.tokenService.getRefreshCookieConfig();
    res.cookie(REFRESH_COOKIE_NAME, result.rawRefreshToken, {
      httpOnly: cookieConfig.httpOnly,
      secure: cookieConfig.secure,
      sameSite: cookieConfig.sameSite,
      path: cookieConfig.path,
      maxAge: cookieConfig.maxAge,
    });

    if (parsed.data.trustDevice) {
      const trusted = await this.mfaTrustedDeviceService.trustDevice(
        userId,
        parsed.data.deviceName,
        userAgent,
      );
      res.cookie(MFA_TRUST_COOKIE_NAME, trusted.rawToken, {
        httpOnly: true,
        secure: cookieConfig.secure,
        sameSite: cookieConfig.sameSite,
        path: cookieConfig.path,
        maxAge: trusted.expiresAt.getTime() - Date.now(),
      });
    }

    return {
      accessToken: result.accessToken,
      accessTokenExpiresAt: result.accessTokenExpiresAt,
      user: result.user,
    };
  }
}
