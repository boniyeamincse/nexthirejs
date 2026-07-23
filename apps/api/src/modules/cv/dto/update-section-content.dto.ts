import { IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSectionContentDto {
  @ApiProperty({
    description: 'Section content (JSON object)',
    example: {
      summary: 'Experienced software engineer with 5 years background',
    },
  })
  @IsObject()
  content!: Record<string, any>;
}
