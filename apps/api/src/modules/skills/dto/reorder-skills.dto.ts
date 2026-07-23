import { IsArray, ValidateNested, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class SkillOrder {
  @ApiProperty({
    description: 'Skill ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  id!: string;

  @ApiProperty({
    description: 'Sort order',
    example: 0,
  })
  @IsNumber()
  order!: number;
}

export class ReorderSkillsDto {
  @ApiProperty({
    description: 'Array of skills with new order',
    type: [SkillOrder],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkillOrder)
  skills!: SkillOrder[];
}
