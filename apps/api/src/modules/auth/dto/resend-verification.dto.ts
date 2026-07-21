import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResendVerificationDto {
  @ApiProperty({ description: 'Email address to resend verification to', format: 'email' })
  @IsString()
  @IsEmail()
  email!: string;
}
