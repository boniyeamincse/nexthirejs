import { IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EnqueueSystemPingDto {
  @ApiProperty({
    description: 'Source identifier for the ping request',
    example: 'manual-test',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  source!: string;
}
