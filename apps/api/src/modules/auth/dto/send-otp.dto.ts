import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiProperty({
    description: 'Phone number in international format',
    example: '+8801700000000',
  })
  @IsString()
  phone!: string;
}
