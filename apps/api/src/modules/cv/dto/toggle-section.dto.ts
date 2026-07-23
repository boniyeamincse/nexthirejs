import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ToggleSectionDto {
  @ApiProperty({
    description: 'Whether section should be visible/enabled',
    example: true,
  })
  @IsBoolean()
  enabled!: boolean;
}
