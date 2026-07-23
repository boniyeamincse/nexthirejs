import { IsString, IsArray, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetupLanguageDto {
  @ApiProperty({
    description: 'Array of language names',
    example: ['English', 'Bangla'],
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  @MinLength(1, { each: true })
  languages!: string[];
}
