import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({ description: 'Email verification token', minLength: 10 })
  @IsString()
  @MinLength(10)
  token!: string;
}
