import {
  IsString,
  MaxLength,
  MinLength,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({
    description: 'Project title',
    example: 'E-Commerce Platform',
    minLength: 3,
    maxLength: 200,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @ApiProperty({
    description: 'Short summary',
    example: 'Full-stack e-commerce platform with React and Node.js',
    maxLength: 500,
  })
  @IsString()
  @MaxLength(500)
  summary!: string;

  @ApiProperty({
    description: 'Full description',
    example: 'A complete e-commerce solution...',
  })
  @IsString()
  description!: string;

  @ApiProperty({
    description: 'Problem statement',
    required: false,
  })
  @IsOptional()
  @IsString()
  problemStatement?: string;

  @ApiProperty({
    description: 'Solution approach',
    required: false,
  })
  @IsOptional()
  @IsString()
  solution?: string;

  @ApiProperty({
    description: 'Your contribution',
    required: false,
  })
  @IsOptional()
  @IsString()
  candidateContribution?: string;

  @ApiProperty({
    description: 'Project status',
    enum: ['IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'ABANDONED'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'ABANDONED'])
  status?: string;

  @ApiProperty({
    description: 'Visibility level',
    enum: ['PRIVATE', 'TRAINER_ONLY', 'COMPANIES_ONLY', 'PUBLIC'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['PRIVATE', 'TRAINER_ONLY', 'COMPANIES_ONLY', 'PUBLIC'])
  visibility?: string;

  @ApiProperty({
    description: 'Start date (ISO 8601)',
    required: false,
    example: '2024-01-15',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: 'Completion date (ISO 8601)',
    required: false,
    example: '2024-06-30',
  })
  @IsOptional()
  @IsDateString()
  completionDate?: string;

  @ApiProperty({
    description: 'Team size',
    required: false,
    example: 3,
  })
  @IsOptional()
  @IsNumber()
  teamSize?: number;

  @ApiProperty({
    description: 'Your role in project',
    required: false,
    example: 'Backend Developer',
  })
  @IsOptional()
  @IsString()
  roleInProject?: string;

  @ApiProperty({
    description: 'GitHub repository URL',
    required: false,
  })
  @IsOptional()
  @IsString()
  githubUrl?: string;

  @ApiProperty({
    description: 'Live project URL',
    required: false,
  })
  @IsOptional()
  @IsString()
  liveUrl?: string;

  @ApiProperty({
    description: 'Documentation URL',
    required: false,
  })
  @IsOptional()
  @IsString()
  documentationUrl?: string;

  @ApiProperty({
    description: 'Challenges faced',
    required: false,
  })
  @IsOptional()
  @IsString()
  challenges?: string;

  @ApiProperty({
    description: 'Lessons learned',
    required: false,
  })
  @IsOptional()
  @IsString()
  lessonsLearned?: string;

  @ApiProperty({
    description: 'Future improvements',
    required: false,
  })
  @IsOptional()
  @IsString()
  futureImprovements?: string;
}
