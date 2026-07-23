import { IsEnum, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSkillDto {
  @ApiProperty({
    description: 'Skill level',
    enum: ['BEGINNER', 'DEVELOPING', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['BEGINNER', 'DEVELOPING', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'])
  level?: string;

  @ApiProperty({
    description: 'Years of experience',
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
