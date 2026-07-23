import { IsString, MaxLength, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCvDto {
  @ApiProperty({
    description: 'CV title',
    example: 'Senior Developer CV',
    minLength: 3,
    maxLength: 200,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @ApiProperty({
    description: 'CV template',
    enum: ['MODERN', 'CLASSIC', 'MINIMAL', 'ATS_OPTIMIZED'],
    example: 'ATS_OPTIMIZED',
    required: false,
  })
  @IsOptional()
  @IsEnum(['MODERN', 'CLASSIC', 'MINIMAL', 'ATS_OPTIMIZED'])
  template?: string;
}
