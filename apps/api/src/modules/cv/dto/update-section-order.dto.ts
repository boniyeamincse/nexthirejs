import { IsArray, ValidateNested, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class SectionOrderItem {
  @ApiProperty({
    description: 'Section type',
    example: 'professional_summary',
  })
  @IsString()
  type!: string;

  @ApiProperty({
    description: 'Sort order',
    example: 0,
  })
  @IsNumber()
  sortOrder!: number;
}

export class UpdateSectionOrderDto {
  @ApiProperty({
    description: 'Array of sections with new order',
    type: [SectionOrderItem],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SectionOrderItem)
  sections!: SectionOrderItem[];
}
