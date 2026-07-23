import { IsUUID, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetupCareerGoalDto {
  @ApiProperty({
    description: 'Career goal ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  careerGoalId!: string;
}
