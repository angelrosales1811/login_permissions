import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateResourceDto {
  @ApiProperty()
  @IsString()
  internal_name!: string;

  @ApiProperty()
  @IsString()
  external_name!: string;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsUUID()
  application_id!: string;

  @ApiProperty({
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  module_ids!: string[];
}
