import { IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DuplicateCvDto {
  @ApiProperty({
    description: 'New CV title',
    example: 'Senior Developer CV - Copy',
    minLength: 3,
    maxLength: 200,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string;
}
