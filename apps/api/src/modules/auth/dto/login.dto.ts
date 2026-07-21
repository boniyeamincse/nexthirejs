import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'candidate@example.com' })
  @IsEmail()
  @IsString()
  email!: string;

  @ApiProperty({ example: 'StrongPass#2026' })
  @IsString()
  @MinLength(1)
  password!: string;
}
