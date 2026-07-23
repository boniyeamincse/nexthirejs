import { IsUUID, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetupCountryDto {
  @ApiProperty({
    description: 'Country ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  countryId!: string;

  @ApiProperty({
    description: 'Current city (optional)',
    example: 'Dhaka',
  })
  @IsString()
  currentCity?: string;
}
