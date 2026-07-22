import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CandidateForgotPasswordDto {
  @ApiProperty({
    description: 'Email address (will be normalized to lowercase)',
    example: 'candidate@example.com',
    maxLength: 320,
  })
  @IsEmail({}, { message: 'Invalid email format' })
  @MaxLength(320, { message: 'Email must not exceed 320 characters' })
  email!: string;
}

export class CandidateResetPasswordDto {
  @ApiProperty({ description: 'The password reset token sent via email' })
  @IsString()
  token!: string;

  @ApiProperty({
    description:
      'Password (min 10 chars, max 128 chars, must contain uppercase, lowercase, number, and special character)',
    minLength: 10,
    maxLength: 128,
  })
  @IsString()
  @MinLength(10, { message: 'Password must be at least 10 characters' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  @Matches(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
  @Matches(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
  @Matches(/[0-9]/, { message: 'Password must contain at least one number' })
  @Matches(/[^a-zA-Z0-9]/, { message: 'Password must contain at least one special character' })
  password!: string;

  @ApiProperty({
    description: 'Password confirmation (must match password)',
  })
  @IsString()
  confirmPassword!: string;
}
