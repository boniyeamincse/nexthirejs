import {
  IsString,
  MaxLength,
  MinLength,
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddSkillDto {
  @ApiProperty({
    description: 'Skill name',
    example: 'React',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    description: 'Skill level',
    enum: ['BEGINNER', 'DEVELOPING', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'],
    example: 'INTERMEDIATE',
  })
  @IsEnum(['BEGINNER', 'DEVELOPING', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'])
  level!: string;

  @ApiProperty({
    description: 'Years of experience',
    example: 2.5,
    required: false,
    minimum: 0,
    maximum: 70,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(70)
  yearsOfExperience?: number;
}
