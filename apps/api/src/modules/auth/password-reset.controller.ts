import { Controller, Post, Body, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { PasswordResetService } from './password-reset.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from './decorators/public.decorator';
import { CandidateForgotPasswordDto, CandidateResetPasswordDto } from './dto/password-reset.dto';

@ApiTags('auth')
@Controller('auth')
export class PasswordResetController {
  constructor(private readonly passwordResetService: PasswordResetService) {}

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Request a password reset link' })
  @ApiResponse({ status: 202, description: 'If account exists, email will be sent' })
  async forgotPassword(@Body() body: CandidateForgotPasswordDto): Promise<{ message: string }> {
    await this.passwordResetService.requestPasswordReset(body.email);
    return { message: 'If an account exists, a reset link will be sent to the email address.' };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using token' })
  @ApiResponse({ status: 200, description: 'Password successfully reset' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(@Body() body: CandidateResetPasswordDto): Promise<{ message: string }> {
    if (body.password !== body.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }
    await this.passwordResetService.resetPassword(body.token, body.password);
    return { message: 'Password has been successfully reset.' };
  }
}
