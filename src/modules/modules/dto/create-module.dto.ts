import { ApiProperty } from '@nestjs/swagger';

import { IsInt, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateModuleDto {
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
  route?: string;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsInt()
  display_order?: number;

  @ApiProperty()
  @IsUUID()
  application_id!: string;
}
