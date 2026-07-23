import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import {
  PhoneVerificationService,
  SendOtpResult,
  VerifyOtpResult,
} from './phone-verification.service';
import { AuthGuard } from './auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { AuthenticatedPrincipal } from './interfaces/authenticated-principal.interface';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';

@ApiTags('Auth - Phone Verification')
@Controller('auth/phone')
export class PhoneVerificationController {
  constructor(private readonly phoneVerificationService: PhoneVerificationService) {}

  @Post('send-otp')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send OTP to phone number' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  async sendOtp(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Body() dto: SendOtpDto,
  ): Promise<SendOtpResult> {
    return this.phoneVerificationService.sendOtp(user.userId, dto.phone);
  }

  @Post('verify')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify phone number with OTP' })
  @ApiResponse({ status: 200, description: 'Phone verified successfully' })
  async verifyOtp(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Body() dto: VerifyOtpDto,
  ): Promise<VerifyOtpResult> {
    return this.phoneVerificationService.verifyOtp(user.userId, dto.phone, dto.otp);
  }

  @Post('resend-otp')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resend OTP to phone number' })
  @ApiResponse({ status: 200, description: 'OTP resent successfully' })
  async resendOtp(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Body() dto: ResendOtpDto,
  ): Promise<SendOtpResult> {
    return this.phoneVerificationService.resendOtp(user.userId, dto.phone);
  }
}
