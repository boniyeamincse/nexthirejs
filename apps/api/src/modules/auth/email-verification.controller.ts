import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from './decorators/public.decorator';
import { EmailVerificationService, VerifyResult, ResendResult } from './email-verification.service';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';

@Controller('auth/email-verification')
export class EmailVerificationController {
  constructor(private readonly emailVerificationService: EmailVerificationService) {}

  @Post('verify')
  @Public()
  @HttpCode(200)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Verify email with token' })
  @ApiBody({ type: VerifyEmailDto })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  @ApiResponse({ status: 409, description: 'Email already verified' })
  @ApiResponse({ status: 429, description: 'Too many attempts' })
  async verify(@Body() dto: VerifyEmailDto): Promise<VerifyResult> {
    return this.emailVerificationService.verify(dto.token);
  }

  @Post('resend')
  @Public()
  @HttpCode(200)
  @Throttle({ default: { limit: 1, ttl: 60000 } })
  @ApiOperation({ summary: 'Resend verification email' })
  @ApiBody({ type: ResendVerificationDto })
  @ApiResponse({ status: 200, description: 'Verification email sent' })
  @ApiResponse({ status: 404, description: 'No account found with this email' })
  @ApiResponse({ status: 409, description: 'Email already verified' })
  @ApiResponse({ status: 429, description: 'Too many attempts' })
  async resend(@Body() dto: ResendVerificationDto): Promise<ResendResult> {
    return this.emailVerificationService.resend(dto.email);
  }
}
